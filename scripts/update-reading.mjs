#!/usr/bin/env node
/**
 * Merge listing-page discovery + curated data/articles.json, verify HTTP status,
 * inject reading section + JSON-LD into index.html, refresh sitemap lastmod.
 *
 * Usage:
 *   node scripts/update-reading.mjs              # rebuild HTML + verify (no scrape)
 *   node scripts/update-reading.mjs --fetch      # also scrape vendor news pages
 *   node scripts/update-reading.mjs --verify-only
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const INDEX_PATH = path.join(ROOT, "index.html");
const ARTICLES_PATH = path.join(ROOT, "data", "articles.json");
const CONFIG_PATH = path.join(ROOT, "site.config.json");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");

const READING_START = "<!-- READING_SECTION_AUTO_START -->";
const READING_END = "<!-- READING_SECTION_AUTO_END -->";
const JSONLD_START = "<!-- JSONLD_AUTO_START -->";
const JSONLD_END = "<!-- JSONLD_AUTO_END -->";

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function normalizeUrl(u) {
  try {
    const x = new URL(u);
    x.hash = "";
    let s = x.href.replace(/\/$/, "");
    return s;
  } catch {
    return u;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchText(url, ms = 25000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; aogl.cn-reading-bot/1.0; +https://aogl.cn/)",
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    const text = await r.text();
    return { ok: r.ok, status: r.status, text };
  } finally {
    clearTimeout(timer);
  }
}

async function verifyUrl(url) {
  const opts = {
    redirect: "follow",
    headers: { "user-agent": "aogl-link-check/1.0 (+https://aogl.cn/)" },
  };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 18000);
    let r = await fetch(url, { method: "HEAD", signal: ctrl.signal, ...opts });
    clearTimeout(t);
    if (r.status >= 200 && r.status < 400) return { ok: true, status: r.status };
    if (r.status === 405 || r.status === 501) {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 18000);
      r = await fetch(url, { method: "GET", signal: ctrl2.signal, ...opts });
      clearTimeout(t2);
      return { ok: r.ok && r.status < 400, status: r.status };
    }
    return { ok: false, status: r.status };
  } catch (e) {
    try {
      const ctrl3 = new AbortController();
      const t3 = setTimeout(() => ctrl3.abort(), 18000);
      const r = await fetch(url, { method: "GET", signal: ctrl3.signal, ...opts });
      clearTimeout(t3);
      return { ok: r.ok && r.status < 400, status: r.status };
    } catch (e2) {
      return { ok: false, status: 0, error: String(e2.message || e2) };
    }
  }
}

function extractPageTitle(html) {
  const og = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (og) return decodeBasicEntities(og[1].trim());
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (t) return decodeBasicEntities(t[1].trim().replace(/\s+/g, " "));
  return "";
}

function decodeBasicEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function hostSource(hostname) {
  if (hostname.includes("openai.com")) return "OpenAI";
  if (hostname.includes("anthropic.com")) return "Anthropic";
  if (hostname.includes("deepmind.google")) return "Google DeepMind";
  return hostname.replace(/^www\./, "");
}

function metaNowEnZh() {
  const d = new Date();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mo = d.getMonth() + 1;
  const y = d.getFullYear();
  return {
    meta_en: `${months[d.getMonth()]} ${y}`,
    meta_zh: `${y}年${mo}月`,
  };
}

function scrapeOpenAI(html, max) {
  const re = /href="(https:\/\/openai\.com\/index\/[^"?#]+)/gi;
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    let u = normalizeUrl(m[1]);
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
      if (out.length >= max) break;
    }
  }
  return out;
}

function scrapeAnthropic(html, max) {
  const re =
    /href="(https:\/\/www\.anthropic\.com\/(?:news|research)\/[a-z0-9][a-z0-9\-]*)"/gi;
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    let u = normalizeUrl(m[1]);
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
      if (out.length >= max) break;
    }
  }
  return out;
}

function scrapeDeepMind(html, max) {
  const re = /href="(https:\/\/deepmind\.google\/blog\/[a-z0-9\-]+\/?)"/gi;
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    let u = normalizeUrl(m[1]);
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
      if (out.length >= max) break;
    }
  }
  return out;
}

async function discoverUrls(config) {
  const { sources } = config;
  const ordered = [];

  const oa = sources.openai;
  const r1 = await fetchText(oa.listUrl);
  if (r1.ok) ordered.push(...scrapeOpenAI(r1.text, oa.max).map((u) => ({ u, src: "openai" })));

  const an = sources.anthropic;
  const r2 = await fetchText(an.listUrl);
  if (r2.ok) ordered.push(...scrapeAnthropic(r2.text, an.max).map((u) => ({ u, src: "anthropic" })));

  const dm = sources.deepmind;
  const r3 = await fetchText(dm.listUrl);
  if (r3.ok) ordered.push(...scrapeDeepMind(r3.text, dm.max).map((u) => ({ u, src: "deepmind" })));

  return ordered;
}

async function buildItemsFromDiscovery(config, existingItems, orderedPairs) {
  const byUrl = new Map(existingItems.map((it) => [normalizeUrl(it.url), it]));
  const seen = new Set();
  const next = [];
  const { meta_en: mEn, meta_zh: mZh } = metaNowEnZh();

  for (const { u } of orderedPairs) {
    const key = normalizeUrl(u);
    if (seen.has(key)) continue;
    seen.add(key);
    let item = byUrl.get(key);
    if (!item) {
      const page = await fetchText(key);
      const title = page.ok ? extractPageTitle(page.text) : "";
      const host = hostSource(new URL(key).hostname);
      const te = title || key.split("/").filter(Boolean).pop().replace(/-/g, " ");
      item = {
        url: key,
        title_en: te,
        title_zh: te,
        meta_en: `${host} · ${mEn}`,
        meta_zh: `${host} · ${mZh}`,
      };
    }
    next.push(item);
    if (next.length >= config.readingMaxTotal) break;
  }

  for (const it of existingItems) {
    const k = normalizeUrl(it.url);
    if (next.length >= config.readingMaxTotal) break;
    if (!seen.has(k)) {
      seen.add(k);
      next.push(it);
    }
  }

  return next.slice(0, config.readingMaxTotal);
}

function renderReadingHtml(items) {
  const n = items.length;
  const introEn = `${n} curated links from OpenAI, Anthropic, and Google DeepMind — primary sources for model releases and product updates.`;
  const introZh = `下列 ${n} 条来自 OpenAI、Anthropic、Google DeepMind 官网文章链接（外链将离开本站），便于查阅一手信息。`;

  const liEn = items
    .map(
      (it) => `          <li>
            <a href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(it.title_en)}</a>
            <span class="reading-meta">${escapeHtml(it.meta_en)}</span>
          </li>`
    )
    .join("\n");

  const liZh = items
    .map(
      (it) => `          <li>
            <a href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(it.title_zh)}</a>
            <span class="reading-meta">${escapeHtml(it.meta_zh)}</span>
          </li>`
    )
    .join("\n");

  return `      <section id="reading">
        <h2 class="lang-en">Latest official articles</h2>
        <h2 class="lang-zh">最新官方文章（外链）</h2>
        <p class="reading-intro lang-en">
          ${escapeHtml(introEn)}
        </p>
        <p class="reading-intro lang-zh">
          ${escapeHtml(introZh)}
        </p>

        <ul class="reading-list lang-en">
${liEn}
        </ul>

        <ul class="reading-list lang-zh">
${liZh}
        </ul>
      </section>`;
}

function renderJsonLd(siteUrl, items) {
  const base = siteUrl.replace(/\/$/, "");
  const { meta_en: mEn } = metaNowEnZh();
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "aogl.cn",
      url: `${base}/`,
      description:
        "AI tools news, rankings, categories, and practical tips for generative AI.",
      inLanguage: ["en", "zh-CN"],
    },
    {
      "@type": "ItemList",
      "@id": `${base}/#reading-list`,
      name: "Official AI lab reading list",
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.title_en,
        url: it.url,
      })),
    },
  ];
  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };
  return `<script type="application/ld+json">\n${JSON.stringify(payload, null, 2)}\n</script>`;
}

function replaceMarker(html, start, end, inner) {
  const i0 = html.indexOf(start);
  const i1 = html.indexOf(end);
  if (i0 === -1 || i1 === -1 || i1 <= i0) {
    throw new Error(`Markers not found: ${start}`);
  }
  return html.slice(0, i0 + start.length) + "\n" + inner + "\n    " + html.slice(i1);
}

function writeSitemap(siteUrl, isoDate) {
  const base = siteUrl.replace(/\/$/, "");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <lastmod>${isoDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>${base}/privacy.html</loc>
    <lastmod>${isoDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
`;
  fs.writeFileSync(SITEMAP_PATH, xml, "utf8");
}

async function verifyAll(items) {
  const bad = [];
  for (const it of items) {
    const v = await verifyUrl(it.url);
    if (!v.ok) bad.push({ url: it.url, ...v });
    process.stdout.write(v.ok ? "." : "x");
  }
  console.log("");
  return bad;
}

async function main() {
  const argv = process.argv.slice(2);
  const fetchListings = argv.includes("--fetch");
  const verifyOnly = argv.includes("--verify-only");

  const config = loadJson(CONFIG_PATH);
  let data = loadJson(ARTICLES_PATH);

  if (verifyOnly) {
    const bad = await verifyAll(data.items);
    if (bad.length) {
      console.error("Failed URLs:", bad);
      process.exitCode = 1;
    } else {
      console.log("All URLs OK.");
    }
    return;
  }

  let items = data.items.map((it) => ({
    ...it,
    url: normalizeUrl(it.url),
  }));

  if (fetchListings) {
    console.log("Fetching vendor listing pages…");
    const pairs = await discoverUrls(config);
    if (pairs.length === 0) {
      console.warn("Discovery returned no URLs (pages may have changed). Keeping existing articles.json entries.");
    } else {
      items = await buildItemsFromDiscovery(config, items, pairs);
      data = {
        updated: new Date().toISOString().slice(0, 10),
        items,
      };
      writeJson(ARTICLES_PATH, data);
      console.log(`Wrote ${items.length} items to data/articles.json`);
    }
  }

  console.log("Verifying article URLs…");
  const bad = await verifyAll(items);
  if (bad.length) {
    console.warn("Warning: some URLs failed verification:", bad);
  }

  let indexHtml = fs.readFileSync(INDEX_PATH, "utf8");
  const readingBlock = renderReadingHtml(items);
  indexHtml = replaceMarker(indexHtml, READING_START, READING_END, readingBlock);

  const jsonLd = renderJsonLd(config.siteUrl, items);
  indexHtml = replaceMarker(indexHtml, JSONLD_START, JSONLD_END, jsonLd);

  fs.writeFileSync(INDEX_PATH, indexHtml, "utf8");

  const iso = new Date().toISOString().slice(0, 10);
  writeSitemap(config.siteUrl, iso);
  console.log("Updated index.html reading section, JSON-LD, and sitemap.xml");

  if (bad.length) process.exitCode = 1;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
