// Funkce „Pin“ do Notion přes Notion API (https://api.notion.com/v1, verze 2026-03-11).
// Cíl je stránka nebo databáze, kterou uživatel sdílel se svou integrací:
// - stránka:  každý Pin založí podstránku pojmenovanou podle webu,
// - databáze: každý Pin přidá záznam (název, URL) se shrnutím v obsahu; stejnou adresu neuloží dvakrát.

const API = "https://api.notion.com/v1";
export const NOTION_VERSION = "2026-03-11";
export const PROPERTY_URL = "URL";

export class NotionError extends Error {}

/**
 * Z vloženého textu (ID nebo adresa z Notion) vytáhne ID stránky či databáze ve tvaru UUID.
 * U adresy databáze (…/<id>?v=<pohled>) bere ID z cesty, ne ID pohledu.
 */
export function parseNotionId(input) {
  const text = (input ?? "").trim();
  let haystack = text;
  try {
    const u = new URL(text);
    haystack = u.pathname;
  } catch {
    // Není to adresa – hledáme přímo v textu.
  }
  const matches = haystack.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/gi);
  if (!matches) return null;
  const hex = matches.at(-1).replace(/-/g, "").toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function call(token, path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new NotionError("Nepodařilo se spojit s Notion. Zkontrolujte připojení k internetu.");
  }
  const data = await response.json().catch(() => ({}));
  if (response.ok) return data;

  const code = data?.code ?? "";
  const message = String(data?.message ?? "").slice(0, 200);
  const err = new NotionError(
    response.status === 401
      ? "Token Notion je neplatný. Zkontrolujte ho v nastavení."
      : response.status === 403
        ? "Integrace Notion nemá potřebná oprávnění (čtení, vkládání a úpravy obsahu)."
        : response.status === 404
          ? "Stránka nebo databáze Notion nebyla nalezena. Zkontrolujte adresu v nastavení a v Notion ji " +
            "sdílejte s integrací (••• → Připojení)."
          : response.status === 429
            ? "Příliš mnoho požadavků na Notion. Zkuste to za chvíli."
            : response.status >= 500
              ? "Služba Notion je dočasně nedostupná. Zkuste to prosím později."
              : `Notion požadavek odmítl (${response.status}${code ? `, ${code}` : ""}). ${message}`.trim(),
  );
  err.status = response.status;
  throw err;
}

// Zkusí načíst objekt; „nenalezeno“ nebo „jiný typ objektu“ (404 / 400) vrátí jako null.
async function tryGet(token, path, signal) {
  try {
    return await call(token, path, { signal });
  } catch (err) {
    if (err.status === 404 || err.status === 400) return null;
    throw err;
  }
}

/** Zjistí, jestli ID patří databázi (resp. zdroji dat), nebo stránce. */
async function resolveTarget(token, id, signal) {
  const database = await tryGet(token, `/databases/${id}`, signal);
  const dataSourceId = database ? database.data_sources?.[0]?.id : id;
  if (dataSourceId) {
    const dataSource = await tryGet(token, `/data_sources/${dataSourceId}`, signal);
    if (dataSource) return { type: "database", dataSource };
  }
  if (database) {
    throw new NotionError("Databáze Notion nemá žádný zdroj dat, do kterého by šlo ukládat.");
  }
  if (await tryGet(token, `/pages/${id}`, signal)) return { type: "page", pageId: id };
  throw new NotionError(
    "Stránka nebo databáze Notion nebyla nalezena. Zkontrolujte adresu v nastavení a v Notion ji " +
      "sdílejte s integrací (••• → Připojení).",
  );
}

// Závorky a mezery v adrese by ukončily odkaz – zakódujeme je (encodeURIComponent závorky nechává).
const mdUrl = (url) =>
  url.replace(/[()\s<>]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
const mdText = (text) => text.replace(/[[\]<>]/g, "");

/** Obsah stránky v Markdownu: odkaz na web, shrnutí a čas uložení. */
export function pageMarkdown({ title, url, summary }) {
  const when = new Date().toLocaleString("cs-CZ", { dateStyle: "medium", timeStyle: "short" });
  return [`[${mdText(title || url)}](${mdUrl(url)})`, summary.trim(), `*Uloženo ${when}*`].join("\n\n");
}

const titleValue = (text) => [{ type: "text", text: { content: text.slice(0, 2000) } }];

// Vlastnost typu URL v databázi – přednostně pojmenovaná „URL“. Když chybí, zkusíme ji přidat;
// pokud to integrace nesmí, uložíme záznam bez ní (odkaz je i v obsahu stránky).
async function ensureUrlProperty(token, dataSource, signal) {
  const props = Object.entries(dataSource.properties ?? {});
  const urlProps = props.filter(([, p]) => p.type === "url").map(([name]) => name);
  if (urlProps.length) return urlProps.includes(PROPERTY_URL) ? PROPERTY_URL : urlProps[0];
  if (props.some(([name]) => name === PROPERTY_URL)) return null; // jméno je obsazené jiným typem
  try {
    await call(token, `/data_sources/${dataSource.id}`, {
      method: "PATCH",
      body: { properties: { [PROPERTY_URL]: { url: {} } } },
      signal,
    });
    return PROPERTY_URL;
  } catch (err) {
    if (signal?.aborted) throw err;
    return null;
  }
}

async function pinToDatabase(token, dataSource, { title, url, summary }, signal) {
  const titleProp = Object.entries(dataSource.properties ?? {}).find(([, p]) => p.type === "title")?.[0];
  if (!titleProp) throw new NotionError("Databáze Notion nemá sloupec s názvem (Title).");
  const urlProp = await ensureUrlProperty(token, dataSource, signal);

  if (urlProp) {
    const { results } = await call(token, `/data_sources/${dataSource.id}/query`, {
      method: "POST",
      body: { filter: { property: urlProp, url: { equals: url } }, page_size: 1 },
      signal,
    });
    if (results?.length) return "exists";
  }

  const properties = { [titleProp]: { title: titleValue(title || url) } };
  if (urlProp) properties[urlProp] = { url };
  await call(token, "/pages", {
    method: "POST",
    body: {
      parent: { type: "data_source_id", data_source_id: dataSource.id },
      icon: { type: "emoji", emoji: "📌" },
      properties,
      markdown: pageMarkdown({ title, url, summary }),
    },
    signal,
  });
  return "created";
}

async function pinToPage(token, pageId, { title, url, summary }, signal) {
  await call(token, "/pages", {
    method: "POST",
    body: {
      parent: { type: "page_id", page_id: pageId },
      icon: { type: "emoji", emoji: "📌" },
      properties: { title: { title: titleValue(title || url) } },
      markdown: pageMarkdown({ title, url, summary }),
    },
    signal,
  });
  return "created";
}

/** Uloží stránku do Notion. Vrací { status: "created" | "exists" }. */
export async function pinToNotion({ token, target, title, url, summary, signal }) {
  const id = parseNotionId(target);
  if (!id) {
    throw new NotionError("V nastavení chybí adresa nebo ID stránky či databáze Notion.");
  }
  const resolved = await resolveTarget(token, id, signal);
  const note = { title, url, summary };
  const status =
    resolved.type === "database"
      ? await pinToDatabase(token, resolved.dataSource, note, signal)
      : await pinToPage(token, resolved.pageId, note, signal);
  return { status };
}
