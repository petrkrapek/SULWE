import Anthropic from "@anthropic-ai/sdk";
import { loadSettings, MODELS } from "./settings.js";
import { summarizePage, describeError } from "./summarize.js";
import { renderMarkdown } from "./markdown.js";

// Horní mez délky textu stránky (znaky). Běžné stránky jsou mnohem kratší.
const MAX_CHARS = 400_000;

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
};

let currentText = "";
let controller = null;

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

function modelLabel(id) {
  return MODELS.find((m) => m.id === id)?.label.replace(/\s*\(.*\)$/, "") ?? id;
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

const cacheKey = (tab) => `summary:${tab.url}`;

async function summarize({ force = false } = {}) {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  showError("");
  showNotice("");
  els.summary.replaceChildren();
  els.meta.textContent = "";
  els.copy.disabled = true;
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
        els.meta.textContent = `${modelLabel(cached.model)} · uloženo`;
        els.copy.disabled = false;
        els.regenerate.disabled = false;
        setStatus("");
        return;
      }
    }

    setStatus("Čtu stránku…");
    const page = await readPage(tab);
    if (!page.text || page.text.length < 50) {
      throw new Error("Na stránce jsem nenašel žádný text ke shrnutí.");
    }
    if (page.text.length > MAX_CHARS) {
      page.text = page.text.slice(0, MAX_CHARS);
      showNotice("Stránka je velmi dlouhá – shrnutí vychází jen z její první části.");
    }

    setStatus("Shrnuji…");
    const message = await summarizePage({
      page,
      settings,
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

    els.meta.textContent = modelLabel(message.model);
    els.copy.disabled = !currentText;
    await chrome.storage.session.set({
      [cacheKey(tab)]: { text: currentText, model: message.model },
    });
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError || signal.aborted) return;
    setStatus("");
    showError(err instanceof Anthropic.AnthropicError ? describeError(err) : err.message);
  } finally {
    if (!signal.aborted) els.regenerate.disabled = false;
  }
}

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
