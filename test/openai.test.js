import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { summarizeWithOpenAI, describeOpenAIError, OpenAIError, OPENAI_ENDPOINT } from "../src/openai.js";

const realFetch = globalThis.fetch;
afterEach(() => (globalThis.fetch = realFetch));

const sse = (events) => events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");

function mockFetch(body, init = { status: 200 }) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(body, init);
  };
  return calls;
}

const args = { apiKey: "sk-test", model: "gpt-6-luna", instructions: "sys", input: "page", effort: "low" };

test("summarizeWithOpenAI streamuje text a vrátí model a důvod konce", async () => {
  const calls = mockFetch(
    sse([
      { type: "response.created", response: { status: "in_progress" } },
      { type: "response.output_text.delta", delta: "Ahoj " },
      { type: "response.output_text.delta", delta: "světe" },
      { type: "response.completed", response: { status: "completed", model: "gpt-6-luna-2026-09-01" } },
    ]),
  );
  let text = "";
  const result = await summarizeWithOpenAI({ ...args, onText: (d) => (text += d) });
  assert.equal(text, "Ahoj světe");
  assert.deepEqual(result, { model: "gpt-6-luna-2026-09-01", stop_reason: "end_turn" });

  assert.equal(calls[0].url, OPENAI_ENDPOINT);
  assert.equal(calls[0].options.headers.Authorization, "Bearer sk-test");
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.model, "gpt-6-luna");
  assert.equal(body.stream, true);
  assert.equal(body.store, false);
  assert.deepEqual(body.reasoning, { effort: "low" });
});

test("summarizeWithOpenAI pozná zkrácení a odmítnutí", async () => {
  mockFetch(
    sse([
      { type: "response.output_text.delta", delta: "x" },
      {
        type: "response.incomplete",
        response: { status: "incomplete", model: "gpt-6-luna", incomplete_details: { reason: "max_output_tokens" } },
      },
    ]),
  );
  assert.equal((await summarizeWithOpenAI({ ...args, onText: () => {} })).stop_reason, "max_tokens");

  mockFetch(
    sse([
      { type: "response.refusal.delta", delta: "Nemohu" },
      { type: "response.completed", response: { status: "completed", model: "gpt-6-luna" } },
    ]),
  );
  assert.equal((await summarizeWithOpenAI({ ...args, onText: () => {} })).stop_reason, "refusal");
});

test("summarizeWithOpenAI převede chybu API na českou hlášku", async () => {
  mockFetch(JSON.stringify({ error: { message: "quota", code: "insufficient_quota" } }), { status: 429 });
  await assert.rejects(summarizeWithOpenAI({ ...args, onText: () => {} }), (err) => {
    assert.ok(err instanceof OpenAIError);
    assert.match(err.message, /kredity/);
    return true;
  });
});

test("summarizeWithOpenAI ohlásí přerušený proud", async () => {
  mockFetch(sse([{ type: "response.output_text.delta", delta: "x" }]));
  await assert.rejects(summarizeWithOpenAI({ ...args, onText: () => {} }), OpenAIError);
});

test("describeOpenAIError rozliší hlavní chyby", () => {
  assert.match(describeOpenAIError(401, null), /neplatný/);
  assert.match(describeOpenAIError(404, null), /nebyl nalezen/);
  assert.match(describeOpenAIError(429, { error: { code: "rate_limit_exceeded" } }), /limit/);
  assert.match(describeOpenAIError(400, { error: { code: "context_length_exceeded", message: "" } }), /dlouhá/);
  assert.match(describeOpenAIError(503, null), /nedostupná/);
});
