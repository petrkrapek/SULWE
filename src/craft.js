// Funkce „Pin“ do Craft (craft.do) přes Craft API (https://connect.craft.do/links/<id>/api/v1).
// Dva režimy podle typu připojení:
// - "document": nový samostatný dokument (připojení ke všem dokumentům),
// - "daily":    podstránka na konci dnešního denního zápisu (připojení Daily Notes & Tasks).

export const CRAFT_MODES = [
  { id: "document", label: "Nový dokument (připojení ke všem dokumentům)" },
  { id: "daily", label: "Podstránka v dnešní denní poznámce (připojení Daily Notes & Tasks)" },
];

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

  // Craft vrací chyby jako { error, code } nebo { errors: [{ code, message }] }.
  const first = Array.isArray(data?.errors) ? data.errors[0] : null;
  const detail = String(first?.message ?? data?.error?.message ?? data?.message ?? data?.error ?? text ?? "").slice(0, 200);
  if (/in trash/i.test(detail)) {
    throw new CraftError(
      "Cílový dokument je v Craft v koši. U denní poznámky: obnovte dnešní denní poznámku z koše, " +
        "nebo ji z koše trvale smažte – Craft pak při dalším Pinu použije novou.",
    );
  }
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

// ID nově založeného dokumentu – odpověď může mít různé obaly.
function firstId(data) {
  for (const list of [data?.items, data?.documents, data?.data, Array.isArray(data) ? data : null]) {
    if (Array.isArray(list) && list[0]) return list[0].id ?? list[0].rootBlockId ?? list[0].documentId;
  }
  return data?.id ?? data?.rootBlockId ?? data?.documentId;
}

// Obsah nového dokumentu jako textové bloky: odkaz, řádky shrnutí, čas uložení.
function noteBlocks({ title, url, summary }) {
  const when = new Date().toLocaleString("cs-CZ", { dateStyle: "medium", timeStyle: "short" });
  const lines = [
    `[${mdText(title || url)}](${mdUrl(url)})`,
    // Každý řádek shrnutí (odstavec, nadpis, odrážka) je v Craft samostatný blok.
    ...stripCraftTags(summary)
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.trim()),
    `*Uloženo ${when}*`,
  ];
  return lines.map((markdown) => ({ type: "text", markdown }));
}

// Režim „document“: založí dokument a vloží do něj obsah.
async function pinAsDocument(base, apiKey, { title, url, summary }, signal) {
  const docTitle = mdText(title || url).slice(0, 200);
  const created = await call(base, apiKey, "/documents", { documents: [{ title: docTitle }] }, signal);
  const pageId = firstId(created);
  if (!pageId) {
    throw new CraftError("Craft dokument založil, ale nevrátil jeho ID – shrnutí se nepodařilo vložit.");
  }
  await call(
    base,
    apiKey,
    "/blocks",
    { blocks: noteBlocks({ title, url, summary }), position: { position: "end", pageId } },
    signal,
  );
}

// Režim „daily“: vloží podstránku na konec dnešního denního zápisu.
async function pinToDailyNote(base, apiKey, note, signal) {
  await call(
    base,
    apiKey,
    "/blocks",
    { markdown: noteMarkdown(note), position: { position: "end", date: "today" } },
    signal,
  );
}

/** Uloží poznámku do Craft podle zvoleného režimu. Vrací { status: "created" }. */
export async function pinToCraft({ connectionUrl, apiKey, mode, title, url, summary, signal }) {
  const base = parseConnectionUrl(connectionUrl ?? "");
  if (!base) {
    throw new CraftError(
      "V nastavení chybí platná adresa API připojení Craft (https://connect.craft.do/links/…/api/v1).",
    );
  }
  const note = { title, url, summary };
  if (mode === "daily") {
    await pinToDailyNote(base, apiKey, note, signal);
  } else {
    await pinAsDocument(base, apiKey, note, signal);
  }
  return { status: "created" };
}
