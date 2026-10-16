// Uvítací stránka s návodem: odškrtává hotové kroky podle aktuálního nastavení.
import {
  loadSettings,
  pinConfigured,
  providerKey,
  selectedModel,
  PROVIDER_NAMES,
  AUTO_MODEL,
  providerOf,
} from "./settings.js";

const $ = (id) => document.getElementById(id);

const version = globalThis.chrome?.runtime?.getManifest?.().version;
if (version) $("version").textContent = version;

for (const button of document.querySelectorAll(".open-options")) {
  button.addEventListener("click", () => chrome.runtime.openOptionsPage());
}

function setBadge(id, tone, text) {
  const badge = $(id);
  badge.dataset.tone = tone;
  badge.textContent = text;
}

async function refresh() {
  const settings = await loadSettings();
  const hasKey = Boolean(providerKey(settings));
  // Připnutí ikony umí Chrome zjistit (chrome.action.getUserSettings); jinde krok neodškrtneme.
  const onToolbar = await chrome.action
    ?.getUserSettings?.()
    .then((s) => s.isOnToolbar)
    .catch(() => false);

  $("step-pin").classList.toggle("done", Boolean(onToolbar));
  $("step-key").classList.toggle("done", hasKey);
  const done = [onToolbar, hasKey].filter(Boolean).length;
  if (hasKey) setBadge("badge-start", "ok", `Připraveno · ${PROVIDER_NAMES[providerOf(settings)]}`);
  else setBadge("badge-start", "warn", `Hotovo ${done} ze 2`);

  setBadge("badge-verify", settings.typesafeKey ? "ok" : "off", settings.typesafeKey ? "Zapnuto" : "Vypnuto");
  const auto = settings.typesafeKey && selectedModel(settings) === AUTO_MODEL;
  setBadge("badge-auto", auto ? "ok" : "off", auto ? "Zapnuto" : "Vypnuto");
  setBadge("badge-pin", pinConfigured(settings) ? "ok" : "off", pinConfigured(settings) ? "Zapnuto" : "Vypnuto");
}

refresh();
// Když uživatel mezitím uloží nastavení v jiné kartě, stav se hned aktualizuje.
chrome.storage?.onChanged?.addListener((_changes, area) => area === "local" && refresh());
// Připnutí ikony nevyvolá žádnou událost – zkontrolujeme ho po návratu do karty.
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && refresh());
