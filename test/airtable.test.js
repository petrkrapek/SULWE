import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTarget } from "../src/airtable.js";

test("parseTarget najde ID databáze v adrese z Airtable", () => {
  assert.deepEqual(parseTarget("https://airtable.com/appAbCdEfGh123456/tblXyz/viwAbc"), {
    baseId: "appAbCdEfGh123456",
  });
});

test("parseTarget rozpozná ID pracovního prostoru", () => {
  assert.deepEqual(parseTarget("wspAbCdEfGh123456"), { workspaceId: "wspAbCdEfGh123456" });
});

test("parseTarget vrátí prázdný objekt pro neznámý vstup", () => {
  assert.deepEqual(parseTarget("appKratke"), {});
  assert.deepEqual(parseTarget(""), {});
});
