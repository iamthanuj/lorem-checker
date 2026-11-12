const $ = id => document.getElementById(id);
let tab;

chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => {
  tab = t;
  try { $("host").textContent = new URL(t.url).host; } catch { $("host").textContent = "Unsupported page"; }
});

$("page").addEventListener("click", async () => {
  const out = $("result");
  out.textContent = "Scanning…";
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["detect.js"] });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => LoremDetector.scanDocument(document)
    });
    out.innerHTML = "";
    const head = document.createElement("div");
    if (!result.length) {
      head.className = "good"; head.textContent = "No lorem ipsum found on this page.";
      out.appendChild(head);
      return;
    }
    head.className = "bad"; head.textContent = `Found placeholder text (${result.length} match${result.length > 1 ? "es" : ""})`;
    out.appendChild(head);
    result.forEach(h => {
      const d = document.createElement("div"); d.className = "hit";
      d.textContent = "…" + h.snippet + "…";
      const s = document.createElement("small"); s.textContent = h.source;
      d.appendChild(s); out.appendChild(d);
    });
  } catch (e) {
    out.textContent = "Can't scan this page (browser-internal pages are blocked).";
  }
});

$("site").addEventListener("click", () => {
  if (!tab || !/^https?:/.test(tab.url)) return;
  chrome.tabs.create({ url: chrome.runtime.getURL("report.html") + "?url=" + encodeURIComponent(tab.url) });
});
