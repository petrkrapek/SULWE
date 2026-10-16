import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { summarizeWithMistral, describeMistralError, MistralError, MISTRAL_ENDPOINT } from "../src/mistral.js";

const realFetch = globalThis.fetch;
afterEach(() => (globalThis.fetch = realFetch));

const sse = (events) => events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + "data: [DONE]\n\n";
const chunk = (content, finish_reason = null) => ({
  object: "chat.completion.chunk",
  model: "mistral-large-2512",
  choices: [{ index: 0, delta: { content }, finish_reason }],
});

function mockFetch(body, init = { status: 200 }) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(body, init);
  };
  return calls;
}

const args = { apiKey: "mk", model: "mistral-large-latest", instructions: "sys", input: "page" };

test("summarizeWithMistral streamuje text a vrátí skutečný model", async () => {
  const calls = mockFetch(sse([chunk("Ahoj "), chunk([{ type: "text", text: "světe" }]), chunk("", "stop")]));
  let text = "";
  const result = await summarizeWithMistral({ ...args, onText: (d) => (text += d) });
  assert.equal(text, "Ahoj světe");
  assert.deepEqual(result, { model: "mistral-large-2512", stop_reason: "end_turn" });

  assert.equal(calls[0].url, MISTRAL_ENDPOINT);
  assert.equal(calls[0].options.headers.Authorization, "Bearer mk");
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.model, "mistral-large-latest");
  assert.equal(body.stream, true);
  assert.deepEqual(body.messages, [
    { role: "system", content: "sys" },
    { role: "user", content: "page" },
  ]);
});

test("summarizeWithMistral přeskočí „myšlení“ a pozná zkrácení", async () => {
  mockFetch(
    sse([
      chunk([
        { type: "thinking", thinking: [] },
        { type: "text", text: "x" },
      ]),
      chunk("", "length"),
    ]),
  );
  let text = "";
  const result = await summarizeWithMistral({ ...args, onText: (d) => (text += d) });
  assert.equal(text, "x");
  assert.equal(result.stop_reason, "max_tokens");
});

test("summarizeWithMistral ohlásí přerušený proud a chybu API", async () => {
  mockFetch(`data: ${JSON.stringify(chunk("x"))}\n\n`);
  await assert.rejects(summarizeWithMistral({ ...args, onText: () => {} }), MistralError);

  mockFetch(JSON.stringify({ object: "error", message: "Unauthorized", type: "invalid_request_error" }), {
    status: 401,
  });
  await assert.rejects(summarizeWithMistral({ ...args, onText: () => {} }), /neplatný/);
});

test("describeMistralError rozliší hlavní chyby", () => {
  assert.match(describeMistralError(429, { message: "Rate limit exceeded" }), /limit/);
  assert.match(describeMistralError(400, { message: "Invalid model: mistral-foo" }), /nebyl nalezen/);
  assert.match(describeMistralError(400, { message: "Prompt contains too many tokens" }), /dlouhá/);
  assert.match(describeMistralError(503, null), /nedostupná/);
});
