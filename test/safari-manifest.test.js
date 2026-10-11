import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toSafariManifest, SAFARI_MIN_VERSION } from "../scripts/safari-manifest.mjs";

const manifest = JSON.parse(readFileSync("extension/manifest.json", "utf8"));

test("nastavení se v Safari otevírá přes options_ui", () => {
  const safari = toSafariManifest(manifest);
  assert.equal(safari.options_page, undefined);
  assert.deepEqual(safari.options_ui, { page: manifest.options_page, open_in_tab: true });
});

test("manifest pro Safari určuje minimální verzi a zbytek přebírá", () => {
  const safari = toSafariManifest(manifest);
  assert.deepEqual(safari.browser_specific_settings, { safari: { strict_min_version: SAFARI_MIN_VERSION } });
  assert.equal(safari.version, manifest.version);
  assert.deepEqual(safari.permissions, manifest.permissions);
  assert.deepEqual(safari.host_permissions, manifest.host_permissions);
  assert.deepEqual(safari.content_security_policy, manifest.content_security_policy);
});

test("vstupní manifest zůstane beze změny", () => {
  const copy = structuredClone(manifest);
  toSafariManifest(manifest);
  assert.deepEqual(manifest, copy);
});
