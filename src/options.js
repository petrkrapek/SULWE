import { loadSettings, saveSettings, MODELS, LANGUAGES, LENGTHS } from "./settings.js";

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

document.getElementById("toggle-key").addEventListener("click", (e) => {
  const hidden = form.apiKey.type === "password";
  form.apiKey.type = hidden ? "text" : "password";
  e.target.textContent = hidden ? "Skrýt" : "Zobrazit";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveSettings({
    apiKey: form.apiKey.value.trim(),
    model: form.model.value,
    language: form.language.value,
    length: form.length.value,
  });
  // Po změně nastavení zahodíme uložená shrnutí, ať se vytvoří znovu.
  await chrome.storage.session.clear();
  status.textContent = "Uloženo.";
  setTimeout(() => (status.textContent = ""), 2000);
});
