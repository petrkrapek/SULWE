import Anthropic from "@anthropic-ai/sdk";
import { loadSettings, saveSettings, pinConfigured, MODELS, AUTO_MODEL, AUTO_FALLBACK_MODEL } from "./settings.js";
import { summarizePage, describeError } from "./summarize.js";
import { renderMarkdown } from "./markdown.js";
import { factCheckPage, chooseModel, FactCheckError, VERDICTS } from "./factcheck.js";
import { pinPage, parseTarget, AirtableError } from "./airtable.js";
import { pinToCraft, CraftError } from "./craft.js";

// Horní mez délky textu stránky (znaky). Běžné stránky jsou mnohem kratší.
const MAX_CHARS = 400_000;
// Pin, na který služba neodpoví do minuty, přerušíme, aby tlačítko nezůstalo viset.
const PIN_TIMEOUT_MS = 60_000;

const $ = (id) => document.getElementById(id);
const els = {
  title: $("page-title"),
  status: $("status"),
  summary: $("summary"),
  error: $("error"),
  notice: $("notice"),
  setup: $("setup"),
  meta: $("meta"),
  regenerate: $("regenerate"),
  copy: $("copy"),
  options: $("options"),
  openOptions: $("open-options"),
  verify: $("verify"),
  verdict: $("verdict"),
  pin: $("pin"),
};

let currentText = "";
let controller = null;
let verifyController = null;
let pagePromise = null;
let pinned = false;

// Kopírovat a Pin jsou dostupné, jen když je shrnutí hotové.
function setSummaryReady(ready) {
  els.copy.disabled = !ready;
  els.pin.disabled = !ready || pinned;
}

function setStatus(text) {
  els.status.textContent = text;
  els.status.hidden = !text;
}

function showError(text) {
  els.error.textContent = text;
  els.error.hidden = !text;
}

function showNotice(text) {
  els.notice.textContent = text;
  els.notice.hidden = !text;
}

// Název modelu bez předpony „Claude“, např. „Haiku 5.5“. Neznámé ID (třeba záložní model
// po odmítnutí) převedeme z „claude-opus-4-8“ na „Opus 4.8“.
function modelLabel(id) {
  const known = MODELS.find((m) => m.id === id);
  if (known) return known.label.replace(/\s*\(.*\)$/, "");
  const m = /^claude-([a-z]+)-(\d+)(?:-(\d+))?/.exec(id ?? "");
  return m ? `${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[3] ? `${m[2]}.${m[3]}` : m[2]}` : id;
}

// Funkce běží uvnitř stránky (injektuje ji chrome.scripting) – nesmí používat nic zvenku.
function extractPageContent() {
  const pick = () => {
    const candidates = ["article", "main", "[role=main]", "#content", ".content"];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 200) return el;
    }
    return document.body;
  };
  const root = pick();
  const text = (root?.innerText ?? "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title: document.title, url: location.href, text };
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function readPage(tab) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent,
    });
    return result.result;
  } catch {
    throw new Error(
      "Tuto stránku nelze přečíst. Rozšíření nefunguje na interních stránkách Chromu, v Internetovém obchodě Chrome ani v prohlížeči PDF.",
    );
  }
}

// Text stránky čteme jen jednou – sdílí ho shrnutí i ověření.
function getPage(tab) {
  pagePromise ??= readPage(tab).then((page) => {
    if (!page.text || page.text.length < 50) {
      throw new Error("Na stránce jsem nenašel žádný text ke shrnutí.");
    }
    return page;
  });
  pagePromise.catch(() => (pagePromise = null));
  return pagePromise;
}

// Automatická volba modelu přes TypeSafe AI; při chybě použijeme záložní model a upozorníme.
async function pickModel(page, settings, signal) {
  if (!settings.typesafeKey) {
    showNotice(`Pro automatickou volbu modelu chybí klíč TypeSafe AI – použit ${modelLabel(AUTO_FALLBACK_MODEL)}.`);
    return AUTO_FALLBACK_MODEL;
  }
  setStatus("Vybírám model…");
  try {
    return await chooseModel({ page, apiKey: settings.typesafeKey, signal });
  } catch (err) {
    if (signal.aborted) throw err;
    showNotice(`Automatická volba modelu selhala (${err.message}) – použit ${modelLabel(AUTO_FALLBACK_MODEL)}.`);
    return AUTO_FALLBACK_MODEL;
  }
}

const cacheKey = (tab) => `summary:${tab.url}`;
const verdictKey = (tab) => `verdict:${tab.url}`;
// Stav Pinu pamatujeme zvlášť pro každý cíl (Airtable / Craft).
const pinKey = (tab, target) => `pin:${target}:${tab.url}`;
const PIN_NAMES = { airtable: "Airtable", craft: "Craft" };

async function summarize({ force = false } = {}) {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  showError("");
  showNotice("");
  els.summary.replaceChildren();
  els.meta.textContent = "";
  setSummaryReady(false);
  els.regenerate.disabled = true;
  currentText = "";

  const settings = await loadSettings();
  if (!settings.apiKey) {
    els.setup.hidden = false;
    els.regenerate.disabled = false;
    setStatus("");
    return;
  }
  els.setup.hidden = true;

  try {
    const tab = await getActiveTab();
    els.title.textContent = tab?.title || "Aktuální stránka";

    // Shrnutí stejné stránky se pamatuje do zavření prohlížeče, aby se zbytečně neplatilo znovu.
    if (!force) {
      const cached = (await chrome.storage.session.get(cacheKey(tab)))[cacheKey(tab)];
      if (cached) {
        currentText = cached.text;
        renderMarkdown(els.summary, currentText);
        els.meta.textContent = `${modelLabel(cached.model)}${cached.auto ? " · auto" : ""} · uloženo`;
        setSummaryReady(true);
        els.regenerate.disabled = false;
        setStatus("");
        return;
      }
    }

    setStatus("Čtu stránku…");
    const page = { ...(await getPage(tab)) };
    if (page.text.length > MAX_CHARS) {
      page.text = page.text.slice(0, MAX_CHARS);
      showNotice("Stránka je velmi dlouhá – shrnutí vychází jen z její první části.");
    }

    let model = settings.model;
    let auto = false;
    if (model === AUTO_MODEL) {
      auto = true;
      model = await pickModel(page, settings, signal);
      if (signal.aborted) return;
    }

    setStatus("Shrnuji…");
    const message = await summarizePage({
      page,
      settings: { ...settings, model },
      signal,
      onText: (delta) => {
        if (signal.aborted) return;
        setStatus("");
        currentText += delta;
        renderMarkdown(els.summary, currentText);
      },
    });
    if (signal.aborted) return;
    setStatus("");

    if (message.stop_reason === "refusal") {
      showError("Model odmítl tuto stránku shrnout.");
      return;
    }
    if (message.stop_reason === "max_tokens") {
      showNotice("Shrnutí bylo zkráceno.");
    }

    els.meta.textContent = modelLabel(message.model) + (auto ? " · auto" : "");
    setSummaryReady(Boolean(currentText));
    await chrome.storage.session.set({
      [cacheKey(tab)]: { text: currentText, model: message.model, auto },
    });
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError || signal.aborted) return;
    setStatus("");
    showError(err instanceof Anthropic.AnthropicError ? describeError(err) : err.message);
  } finally {
    if (!signal.aborted) els.regenerate.disabled = false;
  }
}

const MANIPULATION_LABELS = ["žádná", "mírná", "výrazná", "silná"];

function renderVerdict(result) {
  const verdict = VERDICTS[result.choice];
  els.verdict.dataset.tone = verdict.tone;
  const parts = [verdict.label];
  if (typeof result.probability === "number") parts.push(`${Math.round(result.probability * 100)} %`);
  if (typeof result.manipulation === "number") {
    const level = Math.min(3, Math.max(0, Math.round(result.manipulation)));
    parts.push(`manipulace ${MANIPULATION_LABELS[level]}`);
  }
  els.verdict.querySelector(".verdict-text").textContent = parts.join(" · ");
  els.verdict.title = "Odhad modelu Jev (TypeSafe AI) – nejde o ověření faktů novinářem.";
  els.verdict.hidden = false;
}

async function verify({ force = false } = {}) {
  verifyController?.abort();
  verifyController = new AbortController();
  const { signal } = verifyController;

  const settings = await loadSettings();
  if (!settings.typesafeKey) return;

  els.verify.disabled = true;
  els.verify.textContent = "Ověřuji…";
  showError("");
  try {
    const tab = await getActiveTab();
    if (!force) {
      const cached = (await chrome.storage.session.get(verdictKey(tab)))[verdictKey(tab)];
      if (cached) return renderVerdict(cached);
    }
    const page = await getPage(tab);
    const result = await factCheckPage({ page, apiKey: settings.typesafeKey, signal });
    if (signal.aborted) return;
    renderVerdict(result);
    await chrome.storage.session.set({ [verdictKey(tab)]: result });
  } catch (err) {
    if (signal.aborted) return;
    showError(err instanceof FactCheckError ? err.message : `Ověření selhalo: ${err.message}`);
  } finally {
    if (!signal.aborted) {
      els.verify.disabled = false;
      els.verify.textContent = "Ověřit";
    }
  }
}

function showPinned(status, target) {
  pinned = true;
  els.pin.disabled = true;
  els.pin.textContent = "Připnuto ✓";
  els.pin.title =
    status === "exists" ? `Tato stránka už v ${PIN_NAMES[target]} je.` : `Uloženo do ${PIN_NAMES[target]}.`;
}

async function pinToAirtable(settings, tab, signal) {
  const result = await pinPage({
    token: settings.airtableToken,
    target: settings.airtableTarget,
    tableName: settings.airtableTable,
    url: tab.url,
    summary: currentText,
    signal,
  });
  // Pokud se databáze právě založila, zapamatujeme si její ID pro další piny.
  if (!parseTarget(settings.airtableTarget).baseId) {
    await saveSettings({ airtableTarget: result.baseId });
  }
  return result.status;
}

async function pin() {
  const settings = await loadSettings();
  if (!pinConfigured(settings) || !currentText) return;
  const target = settings.pinTarget;
  const signal = AbortSignal.timeout(PIN_TIMEOUT_MS);

  els.pin.disabled = true;
  els.pin.textContent = "Ukládám…";
  showError("");
  try {
    const tab = await getActiveTab();
    const status =
      target === "craft"
        ? (
            await pinToCraft({
              connectionUrl: settings.craftUrl,
              apiKey: settings.craftKey,
              mode: settings.craftMode,
              title: tab.title,
              url: tab.url,
              summary: currentText,
              signal,
            })
          ).status
        : await pinToAirtable(settings, tab, signal);
    showPinned(status, target);
    await chrome.storage.session.set({ [pinKey(tab, target)]: status });
  } catch (err) {
    els.pin.textContent = "Pin";
    els.pin.disabled = false;
    showError(
      signal.aborted
        ? `${PIN_NAMES[target]} neodpověděl včas. Zkuste to prosím znovu.`
        : err instanceof AirtableError || err instanceof CraftError
          ? err.message
          : `Uložení do ${PIN_NAMES[target]} selhalo: ${err.message}`,
    );
  }
}

els.pin.addEventListener("click", pin);
els.verify.addEventListener("click", () => verify({ force: !els.verdict.hidden }));
els.regenerate.addEventListener("click", () => summarize({ force: true }));
els.copy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(currentText);
  els.copy.textContent = "Zkopírováno";
  setTimeout(() => (els.copy.textContent = "Kopírovat"), 1500);
});
const openOptions = () => chrome.runtime.openOptionsPage();
els.options.addEventListener("click", openOptions);
els.openOptions.addEventListener("click", openOptions);

summarize();

// Tlačítko „Ověřit“ je vidět jen s nastaveným klíčem TypeSafe; uložený výsledek se ukáže hned.
loadSettings().then(async (settings) => {
  els.pin.hidden = !pinConfigured(settings);
  if (pinConfigured(settings)) {
    els.pin.title = `Uložit odkaz a shrnutí do ${PIN_NAMES[settings.pinTarget]}`;
    const tab = await getActiveTab();
    const key = pinKey(tab, settings.pinTarget);
    const status = (await chrome.storage.session.get(key))[key];
    if (status) showPinned(status, settings.pinTarget);
  }
  els.verify.hidden = !settings.typesafeKey;
  if (settings.typesafeKey) {
    getActiveTab().then(async (tab) => {
      const cached = (await chrome.storage.session.get(verdictKey(tab)))[verdictKey(tab)];
      if (cached) renderVerdict(cached);
    });
  }
});
