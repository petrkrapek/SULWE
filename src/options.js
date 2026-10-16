import {
  loadSettings,
  saveSettings,
  MODELS,
  OPENAI_MODELS,
  PROVIDERS,
  LANGUAGES,
  LENGTHS,
  AUTO_MODEL,
  PIN_TARGETS,
} from "./settings.js";
import { parseConnectionUrl, CRAFT_MODES } from "./craft.js";
import { DEFAULT_TABLE } from "./airtable.js";

const form = document.getElementById("form");
const status = document.getElementById("status");

function fillSelect(select, items) {
  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    select.appendChild(option);
  }
}

fillSelect(form.provider, PROVIDERS);
fillSelect(form.model, MODELS);
fillSelect(form.openaiModel, OPENAI_MODELS);
fillSelect(form.language, LANGUAGES);
fillSelect(form.length, LENGTHS);
fillSelect(form.pinTarget, PIN_TARGETS);
fillSelect(form.craftMode, CRAFT_MODES);

const settings = await loadSettings();
form.provider.value = settings.provider;
form.apiKey.value = settings.apiKey;
form.model.value = settings.model;
form.openaiKey.value = settings.openaiKey;
form.openaiModel.value = settings.openaiModel;

// Zobrazíme jen pole pro zvoleného poskytovatele AI (stejně jako u cíle Pinu).
const updateProvider = () => {
  for (const provider of PROVIDERS) {
    document.getElementById(`provider-${provider.id}`).hidden = form.provider.value !== provider.id;
  }
};
form.provider.addEventListener("change", updateProvider);
updateProvider();

// Vysvětlení automatické volby modelu ukážeme jen při jejím výběru.
for (const select of [form.model, form.openaiModel]) {
  const hint = document.getElementById(`${select.name}-hint`);
  const update = () => (hint.hidden = select.value !== AUTO_MODEL);
  select.addEventListener("change", update);
  update();
}
form.language.value = settings.language;
form.length.value = settings.length;

form.typesafeKey.value = settings.typesafeKey;
form.pinTarget.value = settings.pinTarget;
form.craftUrl.value = settings.craftUrl;
form.craftMode.value = settings.craftMode;
form.craftKey.value = settings.craftKey;
form.airtableToken.value = settings.airtableToken;

// Zobrazíme jen pole pro zvolený cíl Pinu.
const updatePinTarget = () => {
  for (const target of PIN_TARGETS) {
    document.getElementById(`pin-${target.id}`).hidden = form.pinTarget.value !== target.id;
  }
};
form.pinTarget.addEventListener("change", updatePinTarget);
updatePinTarget();
form.airtableTarget.value = settings.airtableTarget;
form.airtableTable.value = settings.airtableTable;

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
  let craftUrl = form.craftUrl.value.trim();
  if (craftUrl) {
    const normalized = parseConnectionUrl(craftUrl);
    if (!normalized) {
      status.textContent = "Adresa připojení Craft musí mít tvar https://connect.craft.do/links/…/api/v1";
      return;
    }
    craftUrl = form.craftUrl.value = normalized;
  }
  await saveSettings({
    pinTarget: form.pinTarget.value,
    craftUrl,
    craftMode: form.craftMode.value,
    craftKey: form.craftKey.value.trim(),
    provider: form.provider.value,
    apiKey: form.apiKey.value.trim(),
    model: form.model.value,
    openaiKey: form.openaiKey.value.trim(),
    openaiModel: form.openaiModel.value,
    language: form.language.value,
    length: form.length.value,
    typesafeKey: form.typesafeKey.value.trim(),
    airtableToken: form.airtableToken.value.trim(),
    airtableTarget: form.airtableTarget.value.trim(),
    airtableTable: form.airtableTable.value.trim() || DEFAULT_TABLE,
  });
  // Po změně nastavení zahodíme uložená shrnutí a ověření, ať se vytvoří znovu.
  await chrome.storage.session.clear();
  status.textContent = "Uloženo.";
  setTimeout(() => (status.textContent = ""), 2000);
});
