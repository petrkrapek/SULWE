import { loadSettings, saveSettings, MODELS, LANGUAGES, LENGTHS } from "./settings.js";
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

const settings = await loadSettings();
form.apiKey.value = settings.apiKey;
form.model.value = settings.model;
form.language.value = settings.language;
form.length.value = settings.length;

form.typesafeKey.value = settings.typesafeKey;
form.airtableToken.value = settings.airtableToken;
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
  await saveSettings({
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
