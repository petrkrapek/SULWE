// Čtení proudu Server-Sent Events z odpovědi fetch (OpenAI, Mistral).

// Rozdělí proud SSE na jednotlivé události (JSON z řádků „data: …“).
export async function* readEvents(body) {
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
