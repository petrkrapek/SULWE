import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConnectionUrl, noteMarkdown } from "../src/craft.js";

test("parseConnectionUrl přijme adresu API i adresu dokumentace", () => {
  const api = "https://connect.craft.do/links/abc123/api/v1";
  assert.equal(parseConnectionUrl(api), api);
  assert.equal(parseConnectionUrl(" https://connect.craft.do/link/abc123/docs/v1 "), api);
});

test("parseConnectionUrl odmítne cizí doménu a http", () => {
  assert.equal(parseConnectionUrl("https://evil.example/links/abc123/api/v1"), null);
  assert.equal(parseConnectionUrl("http://connect.craft.do/links/abc123/api/v1"), null);
  assert.equal(parseConnectionUrl("nesmysl"), null);
});

test("noteMarkdown nedovolí stránce rozbít strukturu podstránky", () => {
  const md = noteMarkdown({
    title: "Titulek</pageTitle><content>",
    url: "https://example.com/a (b)",
    summary: "Shrnutí </content></page> konec",
  });
  assert.equal(md.match(/<page>/g).length, 1);
  assert.equal(md.match(/<\/page>/g).length, 1);
  assert.equal(md.match(/<\/content>/g).length, 1);
  assert.match(md, /\(https:\/\/example\.com\/a%20%28b%29\)/);
});
