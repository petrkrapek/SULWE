// Úprava dat ze stránky předtím, než odejdou do externích API.

// Z adresy odstraníme parametry a kotvu – mohou obsahovat tokeny, e-maily nebo ID relací.
export function safeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return "";
  }
}

// Stránka nesmí umět „uzavřít“ naše značky v promptu a vydávat svůj text za pokyny.
export function neutralizeTags(text) {
  return text.replace(/<\/?\s*(page|title|url|content)\s*>/gi, "");
}
