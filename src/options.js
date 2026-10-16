import {
  loadSettings,
  saveSettings,
  pinConfigured,
  providerKey,
  MODELS,
  OPENAI_MODELS,
  MISTRAL_MODELS,
  PROVIDERS,
  PROVIDER_NAMES,
  LANGUAGES,
  LENGTHS,
  AUTO_MODEL,
  PIN_TARGETS,
} from "./settings.js";
import { parseConnectionUrl, CRAFT_MODES } from "./craft.js";
import { DEFAULT_TABLE } from "./airtable.js";
import { parseNotionId } from "./notion.js";

const form = document.getElementById("form");
const status = document.getElementById("status");
const $ = (id) => document.getElementById(id);

function fillSelect(select, items) {
  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    select.appendChild(option);
  }
}

// Přepínač z položek s popiskem „Název – popis“ (poskytovatel AI, cíl Pinu).
function fillChoices(container, name, items) {
  for (const item of items) {
    const [title, sub] = item.label.split(" – ");
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = item.id;
    label.append(input, title);
    if (sub) {
      const small = document.createElement("span");
      small.className = "sub";
      small.textContent = sub;
      label.append(small);
    }
    container.append(label);
  }
}

fillChoices($("provider-choices"), "provider", PROVIDERS);
fillChoices($("pinTarget-choices"), "pinTarget", PIN_TARGETS);
fillSelect(form.model, MODELS);
fillSelect(form.openaiModel, OPENAI_MODELS);
fillSelect(form.mistralModel, MISTRAL_MODELS);
fillSelect(form.language, LANGUAGES);
fillSelect(form.length, LENGTHS);
fillSelect(form.craftMode, CRAFT_MODES);

const version = globalThis.chrome?.runtime?.getManifest?.().version;
if (version) $("version").textContent = version;

// Pole formuláře, která se ukládají beze změny (texty se jen oříznou).
const FIELDS = [
  "provider",
  "apiKey",
  "model",
  "openaiKey",
  "openaiModel",
  "mistralKey",
  "mistralModel",
  "language",
  "length",
  "typesafeKey",
  "pinTarget",
  "airtableToken",
  "airtableTarget",
  "airtableTable",
  "craftMode",
  "craftUrl",
  "craftKey",
  "notionToken",
  "notionTarget",
];

const settings = await loadSettings();
for (const name of FIELDS) form[name].value = settings[name];

const collect = () => Object.fromEntries(FIELDS.map((name) => [name, form[name].value.trim()]));

function setBadge(id, tone, text) {
  const badge = $(id);
  badge.dataset.tone = tone;
  badge.textContent = text;
}

// Zobrazí pole jen pro zvoleného poskytovatele a cíl Pinu a aktualizuje stavové štítky karet.
function refresh() {
  const values = collect();
  for (const provider of PROVIDERS) $(`provider-${provider.id}`).hidden = values.provider !== provider.id;
  for (const target of PIN_TARGETS) $(`pin-${target.id}`).hidden = values.pinTarget !== target.id;
  for (const select of [form.model, form.openaiModel, form.mistralModel])
    $(`${select.name}-hint`).hidden = select.value !== AUTO_MODEL;

  const providerName = PROVIDER_NAMES[values.provider] ?? PROVIDER_NAMES.anthropic;
  if (providerKey(values)) setBadge("badge-summary", "ok", `Připraveno · ${providerName}`);
  else setBadge("badge-summary", "warn", `Chybí klíč ${providerName}`);

  if (values.typesafeKey) setBadge("badge-verify", "ok", "Zapnuto");
  else setBadge("badge-verify", "off", "Vypnuto");

  const targetName = PIN_TARGETS.find((t) => t.id === values.pinTarget)?.label.split(" – ")[0];
  const pinFields = {
    airtable: ["airtableToken", "airtableTarget"],
    craft: ["craftUrl", "craftKey"],
    notion: ["notionToken", "notionTarget"],
  }[values.pinTarget];
  if (pinConfigured(values)) setBadge("badge-pin", "ok", `Zapnuto · ${targetName}`);
  else if (pinFields?.some((name) => values[name])) setBadge("badge-pin", "warn", "Nedokončeno");
  else setBadge("badge-pin", "off", "Vypnuto");
}

function setStatus(text, tone = "") {
  status.textContent = text;
  status.dataset.tone = tone;
}

form.addEventListener("input", () => {
  refresh();
  setStatus("Neuložené změny", "dirty");
});
form.addEventListener("change", refresh);
refresh();

for (const button of document.querySelectorAll(".toggle")) {
  button.addEventListener("click", () => {
    const input = form[button.dataset.for];
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    button.textContent = hidden ? "Skrýt" : "Zobrazit";
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const values = collect();
  if (values.craftUrl) {
    const normalized = parseConnectionUrl(values.craftUrl);
    if (!normalized) {
      setStatus("Adresa připojení Craft musí mít tvar https://connect.craft.do/links/…/api/v1", "error");
      form.craftUrl.focus();
      return;
    }
    values.craftUrl = form.craftUrl.value = normalized;
  }
  if (values.notionTarget && !parseNotionId(values.notionTarget)) {
    setStatus("Adresa Notion musí být odkaz na stránku nebo databázi (případně její ID).", "error");
    form.notionTarget.focus();
    return;
  }
  if (!values.airtableTable) values.airtableTable = form.airtableTable.value = DEFAULT_TABLE;
  await saveSettings(values);
  // Po změně nastavení zahodíme uložená shrnutí a ověření, ať se vytvoří znovu.
  await chrome.storage.session.clear();
  setStatus("Uloženo ✓", "ok");
  setTimeout(() => {
    if (status.dataset.tone === "ok") setStatus("");
  }, 2000);
});
