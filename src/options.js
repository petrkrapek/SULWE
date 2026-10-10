import { loadSettings, saveSettings, MODELS, LANGUAGES, LENGTHS, AUTO_MODEL, PIN_TARGETS } from "./settings.js";
import { parseConnectionUrl } from "./craft.js";
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

fillSelect(form.model, MODELS);
fillSelect(form.language, LANGUAGES);
fillSelect(form.length, LENGTHS);
fillSelect(form.pinTarget, PIN_TARGETS);

const settings = await loadSettings();
form.apiKey.value = settings.apiKey;
form.model.value = settings.model;

const modelHint = document.getElementById("model-hint");
const updateModelHint = () => (modelHint.hidden = form.model.value !== AUTO_MODEL);
form.model.addEventListener("change", updateModelHint);
updateModelHint();
form.language.value = settings.language;
form.length.value = settings.length;

form.typesafeKey.value = settings.typesafeKey;
form.pinTarget.value = settings.pinTarget;
form.craftUrl.value = settings.craftUrl;
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
    craftKey: form.craftKey.value.trim(),
    apiKey: form.apiKey.value.trim(),
    model: form.model.value,
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
