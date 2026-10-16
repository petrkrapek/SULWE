import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pinConfigured,
  providerOf,
  providerKey,
  selectedModel,
  fallbackModel,
  modelLabel,
  DEFAULTS,
} from "../src/settings.js";

test("pinConfigured: Airtable stačí token", () => {
  assert.equal(pinConfigured({ ...DEFAULTS, airtableToken: "pat123" }), true);
  assert.equal(pinConfigured(DEFAULTS), false);
});

test("pinConfigured: Craft potřebuje adresu i klíč", () => {
  const craft = { ...DEFAULTS, pinTarget: "craft", craftUrl: "https://connect.craft.do/links/x/api/v1" };
  assert.equal(pinConfigured(craft), false);
  assert.equal(pinConfigured({ ...craft, craftKey: "pdk_x" }), true);
});

test("providerKey a selectedModel berou údaje zvoleného poskytovatele", () => {
  const settings = { ...DEFAULTS, apiKey: "sk-ant", openaiKey: "sk-oai", model: "claude-haiku-5-5" };
  assert.equal(providerKey(settings), "sk-ant");
  assert.equal(selectedModel(settings), "claude-haiku-5-5");
  const openai = { ...settings, provider: "openai", openaiModel: "gpt-6-luna" };
  assert.equal(providerKey(openai), "sk-oai");
  assert.equal(selectedModel(openai), "gpt-6-luna");
  assert.equal(fallbackModel(openai), "gpt-6.1-sol");
  assert.equal(fallbackModel(settings), "claude-sonnet-5-5");
});

test("starší nastavení bez poskytovatele zůstane u Anthropic", () => {
  const legacy = { ...DEFAULTS, apiKey: "sk-ant" };
  delete legacy.provider;
  assert.equal(providerOf(legacy), "anthropic");
  assert.equal(providerKey(legacy), "sk-ant");
});

test("modelLabel zkrátí známé i neznámé modely obou poskytovatelů", () => {
  assert.equal(modelLabel("claude-haiku-5-5"), "Haiku 5.5");
  assert.equal(modelLabel("claude-opus-4-8"), "Opus 4.8");
  assert.equal(modelLabel("gpt-6-luna"), "GPT-6 Luna");
  assert.equal(modelLabel("gpt-5.6-terra"), "GPT-5.6 Terra");
  assert.equal(modelLabel("gpt-6.1-sol-2026-09-01"), "GPT-6.1 Sol");
  assert.equal(modelLabel("gpt-7"), "GPT-7");
});
