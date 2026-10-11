import { test } from "node:test";
import assert from "node:assert/strict";
import { pinConfigured, DEFAULTS } from "../src/settings.js";

test("pinConfigured: Airtable stačí token", () => {
  assert.equal(pinConfigured({ ...DEFAULTS, airtableToken: "pat123" }), true);
  assert.equal(pinConfigured(DEFAULTS), false);
});

test("pinConfigured: Craft potřebuje adresu i klíč", () => {
  const craft = { ...DEFAULTS, pinTarget: "craft", craftUrl: "https://connect.craft.do/links/x/api/v1" };
  assert.equal(pinConfigured(craft), false);
  assert.equal(pinConfigured({ ...craft, craftKey: "pdk_x" }), true);
});
