// Sdílená nastavení rozšíření (ukládají se jen lokálně v prohlížeči).

export const AUTO_MODEL = "auto";

// Poskytovatel AI, který píše shrnutí. Každý má vlastní klíč a vlastní volbu modelu.
export const PROVIDERS = [
  { id: "anthropic", label: "Anthropic – modely Claude" },
  { id: "openai", label: "OpenAI – modely GPT" },
];
export const PROVIDER_NAMES = { anthropic: "Anthropic", openai: "OpenAI" };

export const MODELS = [
  { id: AUTO_MODEL, label: "Automaticky podle textu (vybírá TypeSafe AI)" },
  { id: "claude-opus-5-5", label: "Opus 5.5 (nejkvalitnější)" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5 (rychlejší, levnější)" },
  { id: "claude-haiku-5-5", label: "Haiku 5.5 (nejrychlejší, nejlevnější)" },
];

export const OPENAI_MODELS = [
  { id: AUTO_MODEL, label: "Automaticky podle textu (vybírá TypeSafe AI)" },
  { id: "gpt-6-astra", label: "GPT-6 Astra (nejkvalitnější)" },
  { id: "gpt-6.1-sol", label: "GPT-6.1 Sol (rychlejší, levnější)" },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra (vyvážený výkon a cena)" },
  { id: "gpt-6-luna", label: "GPT-6 Luna (nejrychlejší, nejlevnější)" },
];

export const PROVIDER_MODELS = { anthropic: MODELS, openai: OPENAI_MODELS };

// Automatická volba modelu: podle náročnosti textu (viz factcheck.js) se vybere model zvoleného poskytovatele.
export const TIER_MODELS = {
  anthropic: { common: "claude-haiku-5-5", expert: "claude-sonnet-5-5", advanced: "claude-opus-5-5" },
  openai: { common: "gpt-6-luna", expert: "gpt-6.1-sol", advanced: "gpt-6-astra" },
};

/** Zvolený poskytovatel (neznámá hodnota → Anthropic). */
export function providerOf(settings) {
  return settings.provider === "openai" ? "openai" : "anthropic";
}

/** API klíč zvoleného poskytovatele. */
export function providerKey(settings) {
  return providerOf(settings) === "openai" ? settings.openaiKey : settings.apiKey;
}

/** Model zvolený v nastavení pro aktuálního poskytovatele (může být AUTO_MODEL). */
export function selectedModel(settings) {
  return providerOf(settings) === "openai" ? settings.openaiModel : settings.model;
}

/** Záložní (střední) model zvoleného poskytovatele, když automatická volba selže (chybí klíč TypeSafe, chyba API). */
export function fallbackModel(settings) {
  return TIER_MODELS[providerOf(settings)].expert;
}

/** Název modelu bez předpony a popisu, např. „Haiku 5.5“ nebo „GPT-6 Luna“. */
export function modelLabel(id) {
  const known = [...MODELS, ...OPENAI_MODELS].find((m) => m.id === id && m.id !== AUTO_MODEL);
  if (known) return known.label.replace(/\s*\(.*\)$/, "");
  // Neznámé ID (třeba záložní model po odmítnutí nebo snapshot) převedeme podle tvaru.
  const claude = /^claude-([a-z]+)-(\d+)(?:-(\d+))?/.exec(id ?? "");
  if (claude) {
    const [, name, major, minor] = claude;
    return `${name[0].toUpperCase()}${name.slice(1)} ${minor ? `${major}.${minor}` : major}`;
  }
  const gpt = /^gpt-(\d+(?:\.\d+)?)(?:-([a-z]+))?/.exec(id ?? "");
  if (gpt) {
    const [, version, name] = gpt;
    return `GPT-${version}${name ? ` ${name[0].toUpperCase()}${name.slice(1)}` : ""}`;
  }
  return id;
}

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
  provider: "anthropic",
  apiKey: "",
  model: "claude-opus-5-5",
  openaiKey: "",
  openaiModel: "gpt-6-astra",
  language: "cs",
  length: "medium",
  typesafeKey: "",
  pinTarget: "airtable",
  craftUrl: "",
  craftMode: "document",
  craftKey: "",
  airtableToken: "",
  airtableTarget: "",
  airtableTable: "Shrnutí stránek",
};

export const PIN_TARGETS = [
  { id: "airtable", label: "Airtable – záznam do tabulky" },
  { id: "craft", label: "Craft – nová poznámka (dokument)" },
];

/** Je zvolený cíl Pinu nastavený tak, že se dá použít? */
export function pinConfigured(settings) {
  return settings.pinTarget === "craft"
    ? Boolean(settings.craftUrl && settings.craftKey)
    : Boolean(settings.airtableToken);
}

export async function loadSettings() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...stored };
}

export async function saveSettings(settings) {
  await chrome.storage.local.set(settings);
}
