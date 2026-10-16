// Sdílená nastavení rozšíření (ukládají se jen lokálně v prohlížeči).

export const AUTO_MODEL = "auto";

// Poskytovatel AI, který píše shrnutí. Každý má vlastní klíč a vlastní volbu modelu.
export const PROVIDERS = [
  { id: "anthropic", label: "Anthropic – modely Claude" },
  { id: "openai", label: "OpenAI – modely GPT" },
  { id: "mistral", label: "Mistral – evropské modely" },
];
export const PROVIDER_NAMES = { anthropic: "Anthropic", openai: "OpenAI", mistral: "Mistral" };

// Pole nastavení s klíčem a modelem každého poskytovatele (Anthropic používá původní názvy).
const PROVIDER_FIELDS = {
  anthropic: { key: "apiKey", model: "model" },
  openai: { key: "openaiKey", model: "openaiModel" },
  mistral: { key: "mistralKey", model: "mistralModel" },
};

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

// Aliasy „-latest“ vždy míří na aktuální verzi modelu (např. Mistral Large 3 → Large 4).
export const MISTRAL_MODELS = [
  { id: AUTO_MODEL, label: "Automaticky podle textu (vybírá TypeSafe AI)" },
  { id: "mistral-large-latest", label: "Mistral Large (největší model)" },
  { id: "mistral-medium-latest", label: "Mistral Medium (vyvážený výkon a cena)" },
  { id: "mistral-small-latest", label: "Mistral Small (nejrychlejší, nejlevnější)" },
];

export const PROVIDER_MODELS = { anthropic: MODELS, openai: OPENAI_MODELS, mistral: MISTRAL_MODELS };

// Automatická volba modelu: podle náročnosti textu (viz factcheck.js) se vybere model zvoleného poskytovatele.
export const TIER_MODELS = {
  anthropic: { common: "claude-haiku-5-5", expert: "claude-sonnet-5-5", advanced: "claude-opus-5-5" },
  openai: { common: "gpt-6-luna", expert: "gpt-6.1-sol", advanced: "gpt-6-astra" },
  mistral: { common: "mistral-small-latest", expert: "mistral-medium-latest", advanced: "mistral-large-latest" },
};

/** Zvolený poskytovatel (neznámá hodnota → Anthropic). */
export function providerOf(settings) {
  return Object.hasOwn(PROVIDER_FIELDS, settings.provider ?? "") ? settings.provider : "anthropic";
}

/** API klíč zvoleného poskytovatele. */
export function providerKey(settings) {
  return settings[PROVIDER_FIELDS[providerOf(settings)].key];
}

/** Model zvolený v nastavení pro aktuálního poskytovatele (může být AUTO_MODEL). */
export function selectedModel(settings) {
  return settings[PROVIDER_FIELDS[providerOf(settings)].model];
}

/** Záložní (střední) model zvoleného poskytovatele, když automatická volba selže (chybí klíč TypeSafe, chyba API). */
export function fallbackModel(settings) {
  return TIER_MODELS[providerOf(settings)].expert;
}

/** Název modelu bez předpony a popisu, např. „Haiku 5.5“, „GPT-6 Luna“ nebo „Mistral Large“. */
export function modelLabel(id) {
  const known = [...MODELS, ...OPENAI_MODELS, ...MISTRAL_MODELS].find((m) => m.id === id && m.id !== AUTO_MODEL);
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
  // Mistral vrací konkrétní verzi, např. „mistral-large-2512“ → „Mistral Large“.
  // Velikost s čísly (např. „ministral-8b-2512“) píšeme velkými písmeny: „Ministral 8B“.
  const mistral = /^(mistral|ministral|magistral)-([a-z0-9]+)/.exec(id ?? "");
  if (mistral) {
    const [, family, size] = mistral;
    const cap = (s) => `${s[0].toUpperCase()}${s.slice(1)}`;
    return `${cap(family)} ${/\d/.test(size) ? size.toUpperCase() : cap(size)}`;
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
  mistralKey: "",
  mistralModel: "mistral-large-latest",
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
  notionToken: "",
  notionTarget: "",
};

export const PIN_TARGETS = [
  { id: "airtable", label: "Airtable – záznam do tabulky" },
  { id: "craft", label: "Craft – nová poznámka (dokument)" },
  { id: "notion", label: "Notion – podstránka nebo záznam v databázi" },
];

/** Je zvolený cíl Pinu nastavený tak, že se dá použít? */
export function pinConfigured(settings) {
  switch (settings.pinTarget) {
    case "craft":
      return Boolean(settings.craftUrl && settings.craftKey);
    case "notion":
      return Boolean(settings.notionToken && settings.notionTarget);
    default:
      return Boolean(settings.airtableToken);
  }
}

export async function loadSettings() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...stored };
}

export async function saveSettings(settings) {
  await chrome.storage.local.set(settings);
}
