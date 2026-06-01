#!/usr/bin/env node
/**
 * Sync data/hub-links/*.json from data/hubs/*.json (skips URLs already in data/briefs/).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BRIEFS_DIR, normalizeUrl, slugFromUrl } from "./brief-utils.mjs";
import { HUB_LINKS_DIR, collectHubOutboundItems } from "./hub-link-utils.mjs";
import { clearLocalLinkCache } from "./resolve-local-link.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function briefUrls() {
  const set = new Set();
  if (!fs.existsSync(BRIEFS_DIR)) return set;
  for (const f of fs.readdirSync(BRIEFS_DIR)) {
    if (!f.endsWith(".json") || f.startsWith("_")) continue;
    const o = JSON.parse(fs.readFileSync(path.join(BRIEFS_DIR, f), "utf8"));
    if (o.sourceUrl) set.add(normalizeUrl(o.sourceUrl));
  }
  return set;
}

function main() {
  const briefs = briefUrls();
  const items = collectHubOutboundItems();
  fs.mkdirSync(HUB_LINKS_DIR, { recursive: true });

  const usedSlugs = new Map();
  let created = 0;
  let updated = 0;
  let skippedBrief = 0;
  const slugs = [];

  for (const [url, meta] of items) {
    if (briefs.has(url)) {
      skippedBrief++;
      continue;
    }

    let slug = meta.slug || slugFromUrl(url);
    if (usedSlugs.has(slug) && usedSlugs.get(slug) !== url) {
      slug = `${slug}-${hashSuffix(url)}`;
    }
    usedSlugs.set(slug, url);

    const outPath = path.join(HUB_LINKS_DIR, `${slug}.json`);
    let link = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : null;
    if (!link) {
      created++;
      link = {
        slug,
        url,
        name_en: meta.name_en,
        name_zh: meta.name_zh,
        title_en: meta.title_en,
        title_zh: meta.title_zh,
        domain: meta.domain,
        hub: meta.hubs[0],
        hubs: meta.hubs,
        kind: meta.kinds[0],
        kinds: meta.kinds,
        excerpt_en: "",
        excerpt_zh: "",
        updated: new Date().toISOString().slice(0, 10),
      };
    } else {
      updated++;
      link.name_en = meta.name_en || link.name_en;
      link.name_zh = meta.name_zh || link.name_zh;
      link.title_en = meta.title_en || link.title_en;
      link.title_zh = meta.title_zh || link.title_zh;
      link.domain = meta.domain || link.domain;
      link.hubs = [...new Set([...(link.hubs || []), ...meta.hubs])];
      link.hub = link.hubs[0];
      link.kinds = [...new Set([...(link.kinds || []), ...meta.kinds])];
      link.kind = link.kinds[0];
      link.updated = new Date().toISOString().slice(0, 10);
    }
    writeJson(outPath, link);
    slugs.push(slug);
  }

  writeJson(path.join(HUB_LINKS_DIR, "_index.json"), {
    updated: new Date().toISOString().slice(0, 10),
    count: slugs.length,
    skippedBrief,
    slugs: slugs.sort(),
  });

  clearLocalLinkCache();
  console.log(
    `Hub links: ${slugs.length} pages (${created} new, ${updated} updated); ${skippedBrief} URLs use existing briefs/`
  );
}

function hashSuffix(url) {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(0, 6);
}

main();
