import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { parseNotionId, pageMarkdown, pinToNotion, NotionError, NOTION_VERSION } from "../src/notion.js";

const ID = "0123456789abcdef0123456789abcdef";
const UUID = "01234567-89ab-cdef-0123-456789abcdef";
const DS = "fedcba98-7654-3210-fedc-ba9876543210";

test("parseNotionId přijme ID i adresy stránky a databáze", () => {
  assert.equal(parseNotionId(ID), UUID);
  assert.equal(parseNotionId(UUID), UUID);
  assert.equal(parseNotionId(`https://www.notion.so/team/Moje-stranka-${ID}`), UUID);
  // U databáze bereme ID z cesty, ne ID pohledu za ?v=
  assert.equal(parseNotionId(`https://www.notion.so/${ID}?v=ffffffffffffffffffffffffffffffff`), UUID);
  assert.equal(parseNotionId("nesmysl"), null);
  assert.equal(parseNotionId(""), null);
});

test("pageMarkdown obsahuje odkaz se zakódovanými závorkami a shrnutí", () => {
  const md = pageMarkdown({ title: "Titulek [x]", url: "https://example.com/a (b)", summary: "- bod\n" });
  assert.match(md, /^\[Titulek x\]\(https:\/\/example\.com\/a%20%28b%29\)/);
  assert.match(md, /\n\n- bod\n\n\*Uloženo /);
});

const realFetch = globalThis.fetch;
afterEach(() => (globalThis.fetch = realFetch));

// Jednoduchý falešný Notion: odpovědi podle "METODA cesta".
function mockNotion(routes) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    const key = `${options.method} ${new URL(url).pathname.replace("/v1", "")}`;
    calls.push({ key, options, body: options.body ? JSON.parse(options.body) : undefined });
    const [status, body] = routes[key] ?? [404, { object: "error", code: "object_not_found", message: "nenalezeno" }];
    return new Response(JSON.stringify(body), { status });
  };
  return calls;
}

const note = { token: "ntn_x", title: "Web", url: "https://example.com/", summary: "Shrnutí" };

test("pinToNotion: stránka – založí podstránku z Markdownu", async () => {
  const calls = mockNotion({
    [`GET /pages/${UUID}`]: [200, { object: "page", id: UUID }],
    "POST /pages": [200, { object: "page", id: "new" }],
  });
  assert.deepEqual(await pinToNotion({ ...note, target: ID }), { status: "created" });
  const create = calls.find((c) => c.key === "POST /pages");
  assert.deepEqual(create.body.parent, { type: "page_id", page_id: UUID });
  assert.equal(create.body.properties.title.title[0].text.content, "Web");
  assert.match(create.body.markdown, /Shrnutí/);
  assert.equal(create.options.headers["Notion-Version"], NOTION_VERSION);
  assert.equal(create.options.headers.Authorization, "Bearer ntn_x");
});

test("pinToNotion: databáze – přidá záznam s URL a podruhé ho nezduplikuje", async () => {
  const dataSource = {
    object: "data_source",
    id: DS,
    properties: { Jméno: { type: "title" }, Odkaz: { type: "url" } },
  };
  const routes = {
    [`GET /databases/${UUID}`]: [200, { object: "database", id: UUID, data_sources: [{ id: DS }] }],
    [`GET /data_sources/${DS}`]: [200, dataSource],
    [`POST /data_sources/${DS}/query`]: [200, { results: [] }],
    "POST /pages": [200, { object: "page", id: "new" }],
  };
  let calls = mockNotion(routes);
  assert.deepEqual(await pinToNotion({ ...note, target: ID }), { status: "created" });
  const query = calls.find((c) => c.key.endsWith("/query"));
  assert.deepEqual(query.body.filter, { property: "Odkaz", url: { equals: "https://example.com/" } });
  const create = calls.find((c) => c.key === "POST /pages");
  assert.deepEqual(create.body.parent, { type: "data_source_id", data_source_id: DS });
  assert.equal(create.body.properties.Jméno.title[0].text.content, "Web");
  assert.equal(create.body.properties.Odkaz.url, "https://example.com/");
  assert.ok(!calls.some((c) => c.key.startsWith("PATCH")), "existující sloupec URL se nepřidává");

  calls = mockNotion({ ...routes, [`POST /data_sources/${DS}/query`]: [200, { results: [{ id: "old" }] }] });
  assert.deepEqual(await pinToNotion({ ...note, target: ID }), { status: "exists" });
  assert.ok(!calls.some((c) => c.key === "POST /pages"));
});

test("pinToNotion: databáze bez sloupce URL ho doplní", async () => {
  const calls = mockNotion({
    [`GET /databases/${UUID}`]: [200, { object: "database", data_sources: [{ id: DS }] }],
    [`GET /data_sources/${DS}`]: [200, { object: "data_source", id: DS, properties: { Name: { type: "title" } } }],
    [`PATCH /data_sources/${DS}`]: [200, { object: "data_source", id: DS }],
    [`POST /data_sources/${DS}/query`]: [200, { results: [] }],
    "POST /pages": [200, { object: "page" }],
  });
  await pinToNotion({ ...note, target: ID });
  const patch = calls.find((c) => c.key.startsWith("PATCH"));
  assert.deepEqual(patch.body, { properties: { URL: { url: {} } } });
  assert.equal(calls.find((c) => c.key === "POST /pages").body.properties.URL.url, "https://example.com/");
});

test("pinToNotion: nesdílený cíl a neplatný token mají srozumitelnou hlášku", async () => {
  mockNotion({});
  await assert.rejects(pinToNotion({ ...note, target: ID }), (err) => {
    assert.ok(err instanceof NotionError);
    assert.match(err.message, /Připojení/);
    return true;
  });
  mockNotion({ [`GET /databases/${UUID}`]: [401, { code: "unauthorized" }] });
  await assert.rejects(pinToNotion({ ...note, target: ID }), /neplatný/);
  await assert.rejects(pinToNotion({ ...note, target: "x" }), /chybí adresa/);
});
