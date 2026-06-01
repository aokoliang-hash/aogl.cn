#!/usr/bin/env node
/**
 * Download sharp favicons (≥48px, target 120px) into upload/favicons/.
 * Run: npm run fetch-tools-favicons
 * Re-download all: npm run fetch-tools-favicons -- --force
 */
import fs from "fs";
import path from "path";
import {
  FAVICON_DIR,
  FAVICON_MIN_PX,
  collectAllFaviconDomains,
  existingFaviconMinSide,
  faviconAbsPath,
  faviconCandidateUrls,
  faviconFilename,
  faviconQualityScore,
  readImageDimensions,
} from "./favicon-local.mjs";

const MANIFEST = path.join(FAVICON_DIR, "manifest.json");
const MIN_BYTES = 80;
const DELAY_MS = 60;
const FORCE = process.argv.includes("--force");

async function download(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "aogl.cn-favicon-fetch/2.0", Accept: "image/*,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error(`too small (${buf.length} B)`);
  const dim = readImageDimensions(buf);
  if (dim && Math.min(dim.w, dim.h) < 16) throw new Error(`tiny (${dim.w}x${dim.h})`);
  return buf;
}

async function fetchBestForDomain(domain) {
  const urls = faviconCandidateUrls(domain);
  let best = null;
  let lastErr = null;
  for (const url of urls) {
    try {
      const buf = await download(url);
      const dim = readImageDimensions(buf);
      const minSide = dim ? Math.min(dim.w, dim.h) : 0;
      const score = faviconQualityScore(buf);
      if (!best || score > best.score) {
        best = { buf, source: url, dim, score };
      }
      if (minSide >= FAVICON_MIN_PX) break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!best) throw lastErr || new Error("all sources failed");
  return best;
}

async function main() {
  const domains = collectAllFaviconDomains();
  fs.mkdirSync(FAVICON_DIR, { recursive: true });

  const manifest = { updated: new Date().toISOString().slice(0, 10), icons: {} };
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const domain of domains) {
    const dest = faviconAbsPath(domain);
    const minSide = existingFaviconMinSide(domain);
    if (!FORCE && minSide >= FAVICON_MIN_PX) {
      manifest.icons[domain] = faviconFilename(domain);
      skip++;
      continue;
    }
    try {
      const { buf, source, dim } = await fetchBestForDomain(domain);
      fs.writeFileSync(dest, buf);
      manifest.icons[domain] = faviconFilename(domain);
      const label = dim ? `${dim.w}x${dim.h}` : "?";
      console.log(`OK ${domain} ${label} <- ${source.slice(0, 72)} (${(buf.length / 1024).toFixed(1)} KiB)`);
      ok++;
      await new Promise((r) => setTimeout(r, DELAY_MS));
    } catch (e) {
      console.warn(`FAIL ${domain}: ${e.message}`);
      fail++;
    }
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`\nDone. ${ok} updated, ${skip} skipped (≥${FAVICON_MIN_PX}px), ${fail} failed.`);
  if (fail > 0) process.exitCode = 1;
}

main();
