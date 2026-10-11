import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../src/markdown.js";

// Minimální náhrada DOM – renderMarkdown používá jen createElement, createTextNode a appendChild.
class Node {
  constructor(tag, text = "") {
    this.tag = tag;
    this.text = text;
    this.children = [];
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  replaceChildren() {
    this.children = [];
  }
  set textContent(value) {
    this.children = [new Node("#text", value)];
  }
  toString() {
    if (this.tag === "#text") return this.text;
    return `<${this.tag}>${this.children.join("")}</${this.tag}>`;
  }
}

beforeEach(() => {
  globalThis.document = {
    createElement: (tag) => new Node(tag),
    createTextNode: (text) => new Node("#text", text),
  };
});

const render = (markdown) => {
  const root = new Node("div");
  renderMarkdown(root, markdown);
  return root.children.join("");
};

test("nadpisy, odrážky, odstavce a tučné písmo", () => {
  assert.equal(
    render("## Nadpis\n- první **bod**\n- druhý\n\nOdstavec\npokračuje"),
    "<h3>Nadpis</h3><ul><li>první <strong>bod</strong></li><li>druhý</li></ul><p>Odstavec pokračuje</p>",
  );
});

test("HTML z odpovědi zůstane textem, nevznikne z něj element", () => {
  const root = new Node("div");
  renderMarkdown(root, '<img src=x onerror="alert(1)">');
  const [p] = root.children;
  assert.equal(p.tag, "p");
  assert.deepEqual(
    p.children.map((c) => c.tag),
    ["#text"],
  );
});
