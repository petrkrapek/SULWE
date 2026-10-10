// Funkce „Pin“ do Craft (craft.do): založí nový dokument s odkazem a shrnutím stránky.
// Používá Craft API – připojení vytvořené v aplikaci Craft (Imagine → API / Connections),
// jehož adresa má tvar https://connect.craft.do/links/<id>/api/v1.

export class CraftError extends Error {}

/** Ověří a znormalizuje adresu API připojení (bez koncového lomítka). */
export function parseConnectionUrl(input) {
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "https:" || u.hostname !== "connect.craft.do") return null;
    return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
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
    // ponecháme prázdné – některé chyby nevracejí JSON
  }
  if (response.ok) return data;

  const detail = (data?.error?.message ?? data?.message ?? data?.error ?? text ?? "").toString().slice(0, 200);
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

// ID nově založeného dokumentu – odpověď může mít různé obaly.
function firstId(data) {
  for (const list of [data?.items, data?.documents, data?.data, Array.isArray(data) ? data : null]) {
    if (Array.isArray(list) && list[0]) return list[0].id ?? list[0].rootBlockId ?? list[0].documentId;
  }
  return data?.id ?? data?.rootBlockId ?? data?.documentId;
}

// Odkaz pro Markdown: hranaté a kulaté závorky by rozbily syntaxi.
const mdText = (text) => text.replace(/[[\]]/g, "");
const mdUrl = (url) => url.replace(/[()\s]/g, encodeURIComponent);

function noteBlocks({ title, url, summary }) {
  const when = new Date().toLocaleString("cs-CZ", { dateStyle: "medium", timeStyle: "short" });
  const paragraphs = [
    `[${mdText(title || url)}](${mdUrl(url)})`,
    // Každý řádek shrnutí (odstavec, nadpis, odrážka) je v Craft samostatný blok.
    ...summary.split("\n").map((line) => line.trimEnd()).filter((line) => line.trim()),
    `*Uloženo ${when}*`,
  ];
  return paragraphs.map((markdown) => ({ type: "text", markdown }));
}

/**
 * Založí v Craft nový dokument „<název stránky>“ s odkazem, shrnutím a časem uložení.
 * Vrací { status: "created" }.
 */
export async function pinToCraft({ connectionUrl, apiKey, title, url, summary, signal }) {
  const base = parseConnectionUrl(connectionUrl ?? "");
  if (!base) {
    throw new CraftError(
      "V nastavení chybí platná adresa API připojení Craft (https://connect.craft.do/links/…/api/v1).",
    );
  }
  const docTitle = (title || url).slice(0, 200);
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
  return { status: "created" };
}
