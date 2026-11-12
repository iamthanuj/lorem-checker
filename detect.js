// Shared detection logic (used by the popup, the injected page scan, and the site crawler)
const LoremDetector = (() => {
  const PHRASES = [
    "lorem ipsum", "dolor sit amet", "consectetur adipiscing", "consectetur adipisicing",
    "sed do eiusmod", "ut labore et dolore", "ut enim ad minim veniam",
    "quis nostrud exercitation", "duis aute irure", "excepteur sint occaecat", "ipsum dolor"
  ];
  const re = new RegExp(PHRASES.map(p => p.replace(/\s+/g, "\\s+")).join("|"), "gi");

  function findInText(text, source) {
    const hits = [];
    if (!text) return hits;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) && hits.length < 5) {
      const s = Math.max(0, m.index - 40);
      const e = Math.min(text.length, m.index + m[0].length + 60);
      hits.push({ source, match: m[0], snippet: text.slice(s, e).replace(/\s+/g, " ").trim() });
    }
    return hits;
  }

  function scanDocument(doc) {
    let hits = [];
    hits = hits.concat(findInText(doc.title, "title"));
    doc.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[property="og:title"]')
      .forEach(m => { hits = hits.concat(findInText(m.getAttribute("content"), "meta")); });

    if (doc.body) {
      const clone = doc.body.cloneNode(true);
      clone.querySelectorAll("script, style, noscript, template").forEach(n => n.remove());
      hits = hits.concat(findInText(clone.textContent, "body text"));
      clone.querySelectorAll("[alt],[title],[placeholder],[aria-label]").forEach(el => {
        ["alt", "title", "placeholder", "aria-label"].forEach(a => {
          hits = hits.concat(findInText(el.getAttribute(a), a + " attribute"));
        });
      });
    }
    // de-duplicate by snippet
    const seen = new Set();
    return hits.filter(h => !seen.has(h.snippet) && seen.add(h.snippet));
  }

  return { scanDocument, findInText };
})();
