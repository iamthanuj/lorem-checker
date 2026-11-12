const $ = id => document.getElementById(id);
const startUrl = new URL(new URLSearchParams(location.search).get("url"));
const origin = startUrl.origin;
$("origin").textContent = origin;

const CONCURRENCY = 5;
const SKIP_EXT = /\.(jpe?g|png|gif|webp|svg|ico|pdf|zip|gz|rar|7z|mp3|mp4|mov|avi|webm|css|js|json|xml|txt|woff2?|ttf|eot|docx?|xlsx?|pptx?|csv)$/i;

let stopped = false, running = false;
let flagged = [];

function normalize(href, base) {
  try {
    if (/^(mailto|tel|javascript|data):/i.test(href)) return null;
    const u = new URL(href, base);
    if (u.origin !== origin) return null;
    u.hash = "";
    if (SKIP_EXT.test(u.pathname)) return null;
    return u.href;
  } catch { return null; }
}

async function fetchText(url, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal, redirect: "follow" }); }
  finally { clearTimeout(t); }
}

async function discoverFromSitemaps(add) {
  const sitemaps = new Set([origin + "/sitemap.xml"]);
  try {
    const r = await fetchText(origin + "/robots.txt");
    if (r.ok) (await r.text()).split("\n").forEach(l => {
      const m = l.match(/^\s*sitemap:\s*(\S+)/i); if (m) sitemaps.add(m[1]);
    });
  } catch {}
  const queue = [...sitemaps], done = new Set();
  while (queue.length && done.size < 30 && !stopped) {
    const sm = queue.shift();
    if (done.has(sm)) continue; done.add(sm);
    try {
      const r = await fetchText(sm);
      if (!r.ok) continue;
      const xml = new DOMParser().parseFromString(await r.text(), "text/xml");
      xml.querySelectorAll("sitemap > loc").forEach(n => queue.push(n.textContent.trim()));
      xml.querySelectorAll("url > loc").forEach(n => add(n.textContent.trim()));
    } catch {}
  }
}

function highlight(snippet, match) {
  const frag = document.createDocumentFragment();
  const i = snippet.toLowerCase().indexOf(match.toLowerCase().replace(/\s+/g, " "));
  if (i < 0) { frag.append("…" + snippet + "…"); return frag; }
  const em = document.createElement("em");
  em.textContent = snippet.slice(i, i + match.length);
  frag.append("…" + snippet.slice(0, i), em, snippet.slice(i + match.length) + "…");
  return frag;
}

function renderFlagged(url, hits) {
  const box = document.createElement("div"); box.className = "page";
  const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = url;
  box.appendChild(a);
  hits.forEach(h => {
    const d = document.createElement("div"); d.className = "snip";
    d.append(`[${h.source}] `, highlight(h.snippet, h.match));
    box.appendChild(d);
  });
  $("results").appendChild(box);
}

async function crawl() {
  if (running) return;
  running = true; stopped = false; flagged = [];
  $("results").innerHTML = "";
  $("start").disabled = true; $("stop").disabled = false; $("csv").disabled = true;
  const max = Math.max(1, +$("max").value || 300);

  const seen = new Set(), queue = [];
  let active = 0, scanned = 0, errors = 0;
  const add = href => {
    const u = normalize(href, origin + "/");
    if (u && !seen.has(u)) { seen.add(u); queue.push(u); }
  };
  const update = (msg) => {
    $("nScanned").textContent = scanned;
    $("nFlagged").textContent = flagged.length;
    $("nFlagged").className = flagged.length ? "bad" : "good";
    $("nQueued").textContent = seen.size;
    $("nErr").textContent = errors;
    $("prog").max = Math.min(max, Math.max(seen.size, 1));
    $("prog").value = scanned;
    if (msg) $("status").textContent = msg;
  };

  add(startUrl.href);
  $("status").textContent = "Reading sitemap…";
  await discoverFromSitemaps(add);

  async function scanPage(url) {
    try {
      const r = await fetchText(url);
      const type = r.headers.get("content-type") || "";
      if (!r.ok || !type.includes("html")) { errors++; return; }
      const doc = new DOMParser().parseFromString(await r.text(), "text/html");
      doc.querySelectorAll("a[href]").forEach(a => add(new URL(a.getAttribute("href"), r.url).href));
      const hits = LoremDetector.scanDocument(doc);
      if (hits.length) { flagged.push({ url, hits }); renderFlagged(url, hits); }
    } catch { errors++; }
  }

  await new Promise(resolve => {
    const pump = () => {
      while (!stopped && active < CONCURRENCY && queue.length && scanned + active < max) {
        const u = queue.shift(); active++;
        update("Scanning " + u);
        scanPage(u).finally(() => { active--; scanned++; update(); pump(); });
      }
      if (active === 0) resolve();
    };
    pump();
  });

  update(stopped ? "Stopped." : `Done. Scanned ${scanned} page(s).` + (queue.length ? ` ${queue.length} more discovered but not scanned (raise Max pages).` : ""));
  if (!flagged.length && !stopped) {
    const d = document.createElement("div"); d.className = "good"; d.textContent = "No lorem ipsum found in the scanned pages.";
    $("results").appendChild(d);
  }
  running = false; $("start").disabled = false; $("stop").disabled = true; $("csv").disabled = !flagged.length;
}

$("start").addEventListener("click", crawl);
$("stop").addEventListener("click", () => { stopped = true; });
$("csv").addEventListener("click", () => {
  const esc = s => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [["page", "source", "snippet"]];
  flagged.forEach(f => f.hits.forEach(h => rows.push([f.url, h.source, h.snippet])));
  const blob = new Blob([rows.map(r => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "lorem-ipsum-report.csv"; a.click();
});

crawl();
