// Funkce „Pin“: uloží odkaz a shrnutí stránky do Airtable.
// Tabulku (případně i celou databázi) založí, pokud ještě neexistuje; záznamy jen přidává.

const API = "https://api.airtable.com/v0";

export const DEFAULT_TABLE = "Shrnutí stránek";
const BASE_NAME = "Shrnutí stránek";

export const FIELD_URL = "URL";
export const FIELD_SUMMARY = "Shrnutí";
export const FIELD_CREATED = "Datum a čas";

const DATE_OPTIONS = {
  dateFormat: { name: "european" },
  timeFormat: { name: "24hour" },
  timeZone: "client",
};

// Systémový sloupec – Airtable do něj čas vložení doplní sám.
const CREATED_SYSTEM = {
  name: FIELD_CREATED,
  type: "createdTime",
  options: { result: { type: "dateTime", options: DATE_OPTIONS } },
};
// Záloha pro případ, že API vytvoření systémového sloupce odmítne – čas pak doplní rozšíření.
const CREATED_MANUAL = { name: FIELD_CREATED, type: "dateTime", options: DATE_OPTIONS };

const fieldDefs = (created) => [
  { name: FIELD_URL, type: "url" }, // první sloupec je v Airtable primární
  { name: FIELD_SUMMARY, type: "multilineText" },
  created,
];

export class AirtableError extends Error {}

/** Z vloženého textu (ID nebo celá adresa z Airtable) vytáhne ID databáze nebo pracovního prostoru. */
export function parseTarget(input) {
  const base = input.match(/\bapp[A-Za-z0-9]{14}\b/);
  if (base) return { baseId: base[0] };
  const workspace = input.match(/\bwsp[A-Za-z0-9]{14}\b/);
  if (workspace) return { workspaceId: workspace[0] };
  return {};
}

async function call(token, path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new AirtableError("Nepodařilo se spojit s Airtable. Zkontrolujte připojení k internetu.");
  }
  const data = await response.json().catch(() => ({}));
  if (response.ok) return data;

  const type = data?.error?.type ?? "";
  const message = data?.error?.message ?? (typeof data?.error === "string" ? data.error : "");
  const err = new AirtableError(
    response.status === 401
      ? "Token Airtable je neplatný. Zkontrolujte ho v nastavení."
      : response.status === 403
        ? "Token Airtable nemá potřebná oprávnění nebo přístup k této databázi."
        : response.status === 404
          ? "Databáze Airtable nebyla nalezena. Zkontrolujte ID v nastavení."
          : response.status === 429
            ? "Příliš mnoho požadavků na Airtable. Zkuste to za chvíli."
            : `Airtable požadavek odmítl (${response.status}${type ? `, ${type}` : ""}). ${message}`.trim(),
  );
  err.status = response.status;
  throw err;
}

// Zkusí operaci se systémovým sloupcem, při odmítnutí (422) ji zopakuje s obyčejným datem.
async function withCreatedFallback(fn) {
  try {
    return await fn(CREATED_SYSTEM);
  } catch (err) {
    if (err.status !== 422) throw err;
    return await fn(CREATED_MANUAL);
  }
}

async function createBase(token, workspaceId, tableName, signal) {
  const base = await withCreatedFallback((created) =>
    call(token, "/meta/bases", {
      method: "POST",
      body: { name: BASE_NAME, workspaceId, tables: [{ name: tableName, fields: fieldDefs(created) }] },
      signal,
    }),
  );
  return { baseId: base.id, table: base.tables[0] };
}

async function ensureTable(token, baseId, tableName, signal) {
  const { tables } = await call(token, `/meta/bases/${baseId}/tables`, { signal });
  let table = tables.find((t) => t.name === tableName);

  if (!table) {
    table = await withCreatedFallback((created) =>
      call(token, `/meta/bases/${baseId}/tables`, {
        method: "POST",
        body: { name: tableName, fields: fieldDefs(created) },
        signal,
      }),
    );
    return table;
  }

  // Tabulka existuje – doplníme jen chybějící sloupce, nic nemažeme ani nepřepisujeme.
  const names = new Set(table.fields.map((f) => f.name));
  for (const def of [
    { name: FIELD_URL, type: "url" },
    { name: FIELD_SUMMARY, type: "multilineText" },
  ]) {
    if (!names.has(def.name)) {
      table.fields.push(
        await call(token, `/meta/bases/${baseId}/tables/${table.id}/fields`, { method: "POST", body: def, signal }),
      );
    }
  }
  if (!names.has(FIELD_CREATED)) {
    table.fields.push(
      await withCreatedFallback((created) =>
        call(token, `/meta/bases/${baseId}/tables/${table.id}/fields`, { method: "POST", body: created, signal }),
      ),
    );
  }
  return table;
}

const formulaString = (value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

async function urlExists(token, baseId, tableId, url, signal) {
  const params = new URLSearchParams({
    filterByFormula: `{${FIELD_URL}} = ${formulaString(url)}`,
    maxRecords: "1",
    "fields[]": FIELD_URL,
  });
  const { records } = await call(token, `/${baseId}/${tableId}?${params}`, { signal });
  return records.length > 0;
}

/**
 * Uloží stránku do Airtable. Vrací { status: "created" | "exists", baseId }.
 * `baseId` se vrací kvůli případu, kdy se databáze právě založila.
 */
export async function pinPage({ token, target, tableName, url, summary, signal }) {
  const name = tableName || DEFAULT_TABLE;
  let { baseId, workspaceId } = parseTarget(target);
  let table;

  if (baseId) {
    table = await ensureTable(token, baseId, name, signal);
  } else if (workspaceId) {
    ({ baseId, table } = await createBase(token, workspaceId, name, signal));
  } else {
    throw new AirtableError("V nastavení chybí ID databáze Airtable (app…) nebo pracovního prostoru (wsp…).");
  }

  if (await urlExists(token, baseId, table.id, url, signal)) {
    return { status: "exists", baseId };
  }

  const fields = { [FIELD_URL]: url, [FIELD_SUMMARY]: summary };
  const createdField = table.fields.find((f) => f.name === FIELD_CREATED);
  if (createdField && createdField.type !== "createdTime") {
    fields[FIELD_CREATED] = new Date().toISOString();
  }
  await call(token, `/${baseId}/${table.id}`, {
    method: "POST",
    body: { records: [{ fields }], typecast: true },
    signal,
  });
  return { status: "created", baseId };
}
