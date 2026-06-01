#!/usr/bin/env node
/**
 * Optional: fetch og:description (and titles when missing) for data/hub-links/*.json
 * Usage:
 *   node scripts/sync-hub-links-fetch.mjs --fetch
 *   node scripts/sync-hub-links-fetch.mjs --fetch --limit 20
 *   node scripts/sync-hub-links-fetch.mjs --fetch --force
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchPageMeta, sleep } from "./fetch-page-meta.mjs";
import { HUB_LINKS_DIR, loadAllHubLinks } from "./hub-link-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function needsFetch(link, force) {
  if (force) return true;
  const ex = String(link.excerpt_en || "").trim();
  return ex.length < 40;
}

function applyMeta(link, meta) {
  let changed = false;
  if (meta.description) {
    if (link.excerpt_en !== meta.description) {
      link.excerpt_en = meta.description;
      changed = true;
    }
    if (!link.excerpt_zh || link.excerpt_zh.length < 40) {
      link.excerpt_zh = meta.description;
      changed = true;
    }
  }
  const emptyTitle = !String(link.title_en || link.name_en || "").trim();
  if (meta.title && emptyTitle && (link.kind === "rank" || link.kind === "more")) {
    if (!link.name_en) {
      link.name_en = meta.title;
      changed = true;
    }
    if (!link.name_zh) {
      link.name_zh = meta.title;
      changed = true;
    }
  }
  if (meta.title && !String(link.title_en || "").trim() && (link.kind === "news" || link.kind === "hotmix")) {
    link.title_en = meta.title;
    changed = true;
  }
  if (changed) link.fetchedAt = new Date().toISOString().slice(0, 10);
  return changed;
}

async function main() {
  const doFetch = process.argv.includes("--fetch");
  if (!doFetch) {
    console.log("Add --fetch to pull og:description into data/hub-links/*.json");
    console.log("Options: --force  --limit N");
    return;
  }
  const force = process.argv.includes("--force");
  const limitIdx = process.argv.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;

  const links = loadAllHubLinks();
  let done = 0;
  let skipped = 0;
  let failed = 0;
  let updated = 0;

  for (const link of links) {
    if (!needsFetch(link, force)) {
      skipped++;
      continue;
    }
    if (done >= limit) break;

    process.stdout.write(`fetch ${link.slug.slice(0, 28).padEnd(28)} `);
    const res = await fetchPageMeta(link.url);
    done++;
    if (!res.ok) {
      failed++;
      console.log(`skip (${res.status || "err"})`);
    } else {
      const changed = applyMeta(link, res);
      if (changed) {
        updated++;
        writeJson(path.join(HUB_LINKS_DIR, `${link.slug}.json`), link);
      }
      console.log(changed ? "ok" : "empty");
    }
    await sleep(450);
  }

  console.log(
    `Hub-link fetch: ${done} requested, ${updated} updated, ${skipped} already had excerpt, ${failed} failed`
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
