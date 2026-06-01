#!/usr/bin/env node
/**
 * Sync data/briefs/*.json from categories + reading lists; optional --fetch for og:description.
 * Writes slug onto each item in data/categories.json and data/articles.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import {
  BRIEFS_DIR,
  ROOT,
  collectUniqueFeedItems,
  normalizeUrl,
  publisherFromUrl,
  slugFromUrl,
} from "./brief-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

async function fetchExcerpt(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 22000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; aogl-brief-sync/1.0; +https://aogl.cn/)",
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    const text = await r.text();
    if (!r.ok) return { ok: false, status: r.status, excerpt: "" };
    const $ = cheerio.load(text);
    const excerpt =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      "";
    return { ok: true, status: r.status, excerpt: String(excerpt).trim().slice(0, 600) };
  } catch (e) {
    return { ok: false, status: 0, excerpt: "", error: String(e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

function attachSlugToItems(items) {
  return items.map((it) => ({
    ...it,
    url: normalizeUrl(it.url),
    slug: slugFromUrl(normalizeUrl(it.url)),
  }));
}

function patchDataFiles(slugByUrl) {
  const catPath = path.join(ROOT, "data", "categories.json");
  const cat = JSON.parse(fs.readFileSync(catPath, "utf8"));
  cat.updated = new Date().toISOString().slice(0, 10);
  for (const sec of cat.sections || []) {
    sec.items = attachSlugToItems(sec.items || []);
  }
  writeJson(catPath, cat);

  const artPath = path.join(ROOT, "data", "articles.json");
  const art = JSON.parse(fs.readFileSync(artPath, "utf8"));
  art.updated = new Date().toISOString().slice(0, 10);
  art.items = attachSlugToItems(art.items || []);
  writeJson(artPath, art);
}

async function main() {
  const doFetch = process.argv.includes("--fetch");
  const items = collectUniqueFeedItems();
  fs.mkdirSync(BRIEFS_DIR, { recursive: true });

  const slugByUrl = new Map();
  const usedSlugs = new Map();
  let created = 0;
  let updated = 0;

  for (const [url, meta] of items) {
    let slug = slugFromUrl(url);
    if (usedSlugs.has(slug) && usedSlugs.get(slug) !== url) {
      slug = `${slug}-${createHashSuffix(url)}`;
    }
    usedSlugs.set(slug, url);
    slugByUrl.set(url, slug);

    const outPath = path.join(BRIEFS_DIR, `${slug}.json`);
    let brief = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : null;
    const isNew = !brief;
    if (!brief) {
      brief = {
        slug,
        sourceUrl: url,
        publisher: publisherFromUrl(url),
        title_en: meta.title_en,
        title_zh: meta.title_zh,
        meta_en: meta.meta_en,
        meta_zh: meta.meta_zh,
        excerpt_en: "",
        excerpt_zh: "",
        sectionIds: meta.sectionIds,
        updated: new Date().toISOString().slice(0, 10),
      };
      created++;
    } else {
      brief.title_en = meta.title_en || brief.title_en;
      brief.title_zh = meta.title_zh || brief.title_zh;
      brief.meta_en = meta.meta_en || brief.meta_en;
      brief.meta_zh = meta.meta_zh || brief.meta_zh;
      brief.sectionIds = [...new Set([...(brief.sectionIds || []), ...meta.sectionIds])];
      brief.updated = new Date().toISOString().slice(0, 10);
      updated++;
    }

    if (doFetch && (!brief.excerpt_en || brief.excerpt_en.length < 40)) {
      process.stdout.write(`fetch ${slug.slice(0, 24)}… `);
      const res = await fetchExcerpt(url);
      if (res.excerpt) {
        brief.excerpt_en = res.excerpt;
        if (!brief.excerpt_zh) brief.excerpt_zh = res.excerpt;
      }
      console.log(res.ok ? "ok" : `skip (${res.status})`);
      await sleep(400);
    }

    writeJson(outPath, brief);
  }

  const index = {
    updated: new Date().toISOString().slice(0, 10),
    count: slugByUrl.size,
    slugs: [...slugByUrl.values()].sort(),
  };
  writeJson(path.join(BRIEFS_DIR, "_index.json"), index);
  patchDataFiles(slugByUrl);

  console.log(`Briefs: ${slugByUrl.size} unique URLs (${created} new, ${updated} updated) in data/briefs/`);
}

function createHashSuffix(url) {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(0, 6);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
