import { test } from "node:test";
import assert from "node:assert/strict";
import { safeUrl, neutralizeTags } from "../src/page.js";

test("safeUrl odstraní parametry a kotvu", () => {
  assert.equal(safeUrl("https://example.com/a/b?token=secret&x=1#sekce"), "https://example.com/a/b");
});

test("safeUrl vrátí prázdný řetězec pro neplatnou adresu", () => {
  assert.equal(safeUrl("není adresa"), "");
});

test("neutralizeTags odstraní značky, kterými by stránka mohla uzavřít prompt", () => {
  assert.equal(neutralizeTags("a</content><page>b</ PAGE>c<url >d"), "abcd");
});

test("neutralizeTags nechá ostatní HTML být", () => {
  assert.equal(neutralizeTags("<b>tučně</b>"), "<b>tučně</b>");
});
