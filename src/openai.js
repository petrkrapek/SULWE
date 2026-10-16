// Shrnutí přes OpenAI – Responses API se streamováním (Server-Sent Events).
// Voláme ho přímo přes fetch, aby rozšíření nepotřebovalo další knihovnu.

export const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

export class OpenAIError extends Error {}

/** Převede chybovou odpověď OpenAI na srozumitelnou českou hlášku. */
export function describeOpenAIError(status, body) {
  const error = body?.error ?? {};
  const msg = error.message ?? "";
  const code = error.code ?? error.type ?? "";
  if (status === 401) return "API klíč OpenAI je neplatný. Zkontrolujte ho v nastavení rozšíření.";
  if (status === 403) return "Tento API klíč OpenAI nemá přístup ke zvolenému modelu.";
  if (status === 404) return "Zvolený model OpenAI nebyl nalezen. Vyberte v nastavení jiný model.";
  if (status === 429) {
    return code === "insufficient_quota"
      ? "Na účtu OpenAI nejsou kredity. Dobijte je na platform.openai.com."
      : "Překročen limit požadavků OpenAI. Zkuste to prosím za chvíli znovu.";
  }
  if (status >= 500) return "Služba OpenAI je dočasně nedostupná. Zkuste to prosím později.";
  if (code === "context_length_exceeded" || /context|too long|maximum input/i.test(msg)) {
    return "Stránka je na shrnutí příliš dlouhá.";
  }
  return `Požadavek byl odmítnut: ${msg || `chyba ${status}`}`;
}

// Rozdělí proud SSE na jednotlivé události (JSON z řádků „data: …“).
async function* readEvents(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const chunks = buffer.split(/\r?\n\r?\n/);
    buffer = done ? "" : chunks.pop();
    for (const chunk of chunks) {
      const data = chunk
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data || data === "[DONE]") continue;
      try {
        yield JSON.parse(data);
      } catch {
        // Neúplná nebo neznámá událost – přeskočíme.
      }
    }
    if (done) return;
  }
}

/**
 * Streamuje shrnutí z OpenAI. `onText` dostává průběžně přibývající text.
 * Vrací `{ model, stop_reason }` ve stejném tvaru jako zpráva z Claude API
 * (`end_turn`, `max_tokens` nebo `refusal`).
 */
export async function summarizeWithOpenAI({ apiKey, model, instructions, input, effort, onText, signal }) {
  let response;
  try {
    response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        max_output_tokens: 64000,
        reasoning: { effort },
        // Shrnutí neukládáme na straně OpenAI.
        store: false,
        stream: true,
      }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new OpenAIError("Nepodařilo se spojit se službou OpenAI. Zkontrolujte připojení k internetu.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new OpenAIError(describeOpenAIError(response.status, body));
  }

  let final = null;
  let refused = false;
  let hasText = false;
  for await (const event of readEvents(response.body)) {
    switch (event.type) {
      case "response.output_text.delta":
        if (event.delta) {
          hasText = true;
          onText(event.delta);
        }
        break;
      case "response.refusal.delta":
      case "response.refusal.done":
        refused = true;
        break;
      case "response.completed":
      case "response.incomplete":
        final = event.response;
        break;
      case "response.failed":
        throw new OpenAIError(`OpenAI shrnutí nedokončilo: ${event.response?.error?.message ?? "neznámá chyba"}`);
      case "error":
        throw new OpenAIError(`OpenAI vrátila chybu: ${event.message ?? event.error?.message ?? "neznámá chyba"}`);
    }
  }
  if (!final) {
    throw new OpenAIError("Spojení se službou OpenAI se přerušilo před dokončením shrnutí.");
  }

  const reason = final.incomplete_details?.reason;
  const stop_reason =
    refused && !hasText
      ? "refusal"
      : final.status === "incomplete" && reason === "content_filter"
        ? "refusal"
        : final.status === "incomplete"
          ? "max_tokens"
          : "end_turn";
  return { model: final.model ?? model, stop_reason };
}
