// Funkce „Pin“ do Craft (craft.do) přes Craft API (https://connect.craft.do/links/<id>/api/v1).
// Poznámka se vloží jako podstránka (<page>) na konec dnešního denního zápisu (Daily Note);
// funguje s připojením „Daily Notes & Tasks“ i s připojením ke všem dokumentům.

export class CraftError extends Error {}

/**
 * Znormalizuje adresu připojení. Přijme adresu API (…/links/<id>/api/v1) i adresu
 * dokumentace (…/link/<id>/docs/v1) a vrátí základ API bez koncového lomítka.
 */
export function parseConnectionUrl(input) {
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "https:" || u.hostname !== "connect.craft.do") return null;
    const m = u.pathname.match(/^\/links?\/([^/]+)/);
    return m ? `${u.origin}/links/${m[1]}/api/v1` : null;
  } catch {
    return null;
  }
}

async function call(base, apiKey, path, body, signal) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new CraftError("Nepodařilo se spojit s Craft. Zkontrolujte připojení k internetu.");
  }
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // některé chyby nevracejí JSON
  }
  if (response.ok) return data;

  const detail = String(data?.error?.message ?? data?.message ?? data?.error ?? text ?? "").slice(0, 200);
  if (data?.code === "MISSING_AUTH_HEADER" || (response.status === 401 && !apiKey)) {
    throw new CraftError("Připojení Craft vyžaduje API klíč (pdk_…). Vyplňte ho v nastavení rozšíření.");
  }
  throw new CraftError(
    response.status === 401 || response.status === 403
      ? "Craft odmítl přístup. Zkontrolujte adresu připojení a API klíč v nastavení (připojení musí povolovat zápis)."
      : response.status === 404
        ? "Připojení Craft nebylo nalezeno. Zkontrolujte adresu v nastavení."
        : response.status === 429
          ? "Příliš mnoho požadavků na Craft. Zkuste to za chvíli."
          : `Craft požadavek odmítl (${response.status}). ${detail}`.trim(),
  );
}

// Text stránky nesmí obsahovat strukturální značky Craftu – rozbily by podstránku.
const stripCraftTags = (text) =>
  text.replace(/<\/?\s*(page|pagetitle|content|card|callout|caption|highlight|comment)\b[^>]*>/gi, "");
const mdText = (text) => stripCraftTags(text).replace(/[[\]<>]/g, "");
// Závorky a mezery v adrese by ukončily odkaz – zakódujeme je (encodeURIComponent závorky nechává).
const mdUrl = (url) => url.replace(/[()\s<>]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);

/** Markdown podstránky: název = titulek stránky, obsah = odkaz, shrnutí, čas uložení. */
export function noteMarkdown({ title, url, summary }) {
  const when = new Date().toLocaleString("cs-CZ", { dateStyle: "medium", timeStyle: "short" });
  const body = [
    `[${mdText(title || url)}](${mdUrl(url)})`,
    stripCraftTags(summary).trim(),
    `<caption>Uloženo ${when}</caption>`,
  ].join("\n\n");
  return `<page><pageTitle>${mdText(title || url).slice(0, 200)}</pageTitle><content>${body}</content></page>`;
}

/** Vloží poznámku do dnešního denního zápisu v Craft. Vrací { status: "created" }. */
export async function pinToCraft({ connectionUrl, apiKey, title, url, summary, signal }) {
  const base = parseConnectionUrl(connectionUrl ?? "");
  if (!base) {
    throw new CraftError(
      "V nastavení chybí platná adresa API připojení Craft (https://connect.craft.do/links/…/api/v1).",
    );
  }
  await call(
    base,
    apiKey,
    "/blocks",
    {
      markdown: noteMarkdown({ title, url, summary }),
      position: { position: "end", date: "today" },
    },
    signal,
  );
  return { status: "created" };
}
