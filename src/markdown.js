// Jednoduchý a bezpečný převod Markdownu na DOM (bez innerHTML).
// Podporuje nadpisy (#, ##, ###), odrážky (-, *, 1.), odstavce a **tučné** písmo.

function appendInline(parent, text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const strong = document.createElement("strong");
      strong.textContent = part.slice(2, -2);
      parent.appendChild(strong);
    } else {
      parent.appendChild(document.createTextNode(part));
    }
  }
}

export function renderMarkdown(container, markdown) {
  container.replaceChildren();
  let list = null;
  let paragraph = null;

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);

    if (!line.trim()) {
      list = null;
      paragraph = null;
    } else if (heading) {
      list = null;
      paragraph = null;
      const h = document.createElement(heading[1].length === 1 ? "h2" : "h3");
      appendInline(h, heading[2]);
      container.appendChild(h);
    } else if (bullet) {
      paragraph = null;
      if (!list) {
        list = document.createElement("ul");
        container.appendChild(list);
      }
      const li = document.createElement("li");
      appendInline(li, bullet[1]);
      list.appendChild(li);
    } else {
      list = null;
      if (!paragraph) {
        paragraph = document.createElement("p");
        container.appendChild(paragraph);
      } else {
        paragraph.appendChild(document.createTextNode(" "));
      }
      appendInline(paragraph, line.trim());
    }
  }
}
