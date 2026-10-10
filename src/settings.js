// Sdílená nastavení rozšíření (ukládají se jen lokálně v prohlížeči).

export const AUTO_MODEL = "auto";
// Když automatická volba selže (chybí klíč TypeSafe, chyba API), použije se tento model.
export const AUTO_FALLBACK_MODEL = "claude-sonnet-5-5";

export const MODELS = [
  { id: AUTO_MODEL, label: "Automaticky podle textu (vybírá TypeSafe AI)" },
  { id: "claude-opus-5-5", label: "Opus 5.5 (nejkvalitnější)" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5 (rychlejší, levnější)" },
  { id: "claude-haiku-5-5", label: "Haiku 5.5 (nejrychlejší, nejlevnější)" },
];

export const LANGUAGES = [
  { id: "cs", label: "Čeština" },
  { id: "en", label: "Angličtina" },
  { id: "page", label: "Jazyk stránky" },
];

export const LENGTHS = [
  { id: "short", label: "Krátké (3–5 bodů)" },
  { id: "medium", label: "Střední" },
  { id: "long", label: "Podrobné" },
];

export const DEFAULTS = {
  apiKey: "",
  model: "claude-opus-5-5",
  language: "cs",
  length: "medium",
  typesafeKey: "",
  airtableToken: "",
  airtableTarget: "",
  airtableTable: "Shrnutí stránek",
};

export async function loadSettings() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...stored };
}

export async function saveSettings(settings) {
  await chrome.storage.local.set(settings);
}
