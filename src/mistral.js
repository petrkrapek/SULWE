// Shrnutí přes Mistral AI – Chat Completions API se streamováním (Server-Sent Events).
// Voláme ho přímo přes fetch, aby rozšíření nepotřebovalo další knihovnu.

import { readEvents } from "./sse.js";

export const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

export class MistralError extends Error {}

/** Převede chybovou odpověď Mistral na srozumitelnou českou hlášku. */
export function describeMistralError(status, body) {
  const detail = body?.message ?? body?.error?.message ?? body?.detail;
  const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? (detail[0]?.msg ?? "") : "";
  if (status === 401) return "API klíč Mistral je neplatný. Zkontrolujte ho v nastavení rozšíření.";
  if (status === 402 || /credit|billing|payment|quota/i.test(msg)) {
    return "Na účtu Mistral nejsou kredity nebo není aktivní platba. Zkontrolujte to na console.mistral.ai.";
  }
  if (status === 403) return "Tento API klíč Mistral nemá přístup ke zvolenému modelu.";
  if (status === 404 || /invalid model|model.*not found/i.test(msg)) {
    return "Zvolený model Mistral nebyl nalezen. Vyberte v nastavení jiný model.";
  }
  if (status === 429) return "Překročen limit požadavků Mistral. Zkuste to prosím za chvíli znovu.";
  if (status >= 500) return "Služba Mistral je dočasně nedostupná. Zkuste to prosím později.";
  if (/context|too long|too many tokens|maximum/i.test(msg)) return "Stránka je na shrnutí příliš dlouhá.";
  return `Požadavek byl odmítnut: ${msg.slice(0, 200) || `chyba ${status}`}`;
}

// Obsah přírůstku je obvykle text; některé modely posílají pole částí (text, „myšlení“) – bereme jen text.
function deltaText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
  }
  return "";
}

/**
 * Streamuje shrnutí z Mistral. `onText` dostává průběžně přibývající text.
 * Vrací `{ model, stop_reason }` ve stejném tvaru jako zpráva z Claude API (`end_turn` nebo `max_tokens`).
 */
export async function summarizeWithMistral({ apiKey, model, instructions, input, onText, signal }) {
  let response;
  try {
    response = await fetch(MISTRAL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: input },
        ],
        stream: true,
      }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new MistralError("Nepodařilo se spojit se službou Mistral. Zkontrolujte připojení k internetu.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new MistralError(describeMistralError(response.status, body));
  }

  let finishReason = null;
  let finalModel = model;
  for await (const event of readEvents(response.body)) {
    if (event.object === "error" || (event.error && !event.choices)) {
      throw new MistralError(`Mistral vrátila chybu: ${event.message ?? event.error?.message ?? "neznámá chyba"}`);
    }
    if (event.model) finalModel = event.model;
    const choice = event.choices?.[0];
    if (!choice) continue;
    const text = deltaText(choice.delta?.content);
    if (text) onText(text);
    if (choice.finish_reason) finishReason = choice.finish_reason;
  }

  if (!finishReason) {
    throw new MistralError("Spojení se službou Mistral se přerušilo před dokončením shrnutí.");
  }
  if (finishReason === "error") {
    throw new MistralError("Mistral shrnutí nedokončila kvůli chybě. Zkuste to prosím znovu.");
  }
  const stop_reason = finishReason === "length" || finishReason === "model_length" ? "max_tokens" : "end_turn";
  return { model: finalModel, stop_reason };
}
