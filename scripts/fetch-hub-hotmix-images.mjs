#!/usr/bin/env node
/**
 * Download hub hot-mix card images into upload/hub-hotmix/<slug>/.
 * Uses upgradeRemoteImageUrl for larger variants; keeps imageSource for re-fetch.
 * Run: npm run fetch-hub-hotmix-images
 * Force re-download: npm run fetch-hub-hotmix-images -- --force
 */
import fs from "fs";
import path from "path";
import {
  HUB_HOTMIX_DIR,
  HOTMIX_MIN_WIDTH,
  ROOT,
  extFromContentType,
  extFromUrl,
  hotmixAbsPath,
  hotmixRelPath,
  isLocalAssetPath,
  isRemoteUrl,
  localHotmixWidth,
  shouldSkipHotmixUrl,
  upgradeRemoteImageUrl,
} from "./hub-image-local.mjs";
import { fetchPageMeta, sleep } from "./fetch-page-meta.mjs";

const HUB_DIR = path.join(ROOT, "data", "hubs");
const MIN_BYTES = 200;
const DELAY_MS = 100;
const OG_DELAY_MS = 250;
const FORCE = process.argv.includes("--force");
const HUB_FILTER = (() => {
  const i = process.argv.indexOf("--hub");
  if (i === -1 || !process.argv[i + 1]) return null;
  return new Set(
    process.argv[i + 1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
})();

async function download(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "aogl.cn-hub-hotmix/2.0",
      Accept: "image/*,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error(`too small (${buf.length} B)`);
  const ext = extFromContentType(ct) || extFromUrl(url);
  return { buf, ext };
}

function loadHubSpecs() {
  return fs
    .readdirSync(HUB_DIR)
    .filter((f) => f.endsWith(".json") && f !== "news-feeds.json")
    .map((f) => JSON.parse(fs.readFileSync(path.join(HUB_DIR, f), "utf8")));
}

function resolveRemoteUrl(it) {
  const src = String(it.imageSource || "").trim();
  if (isRemoteUrl(src) && !shouldSkipHotmixUrl(src)) return upgradeRemoteImageUrl(src);
  const img = String(it.image || "").trim();
  if (isRemoteUrl(img) && !shouldSkipHotmixUrl(img)) return upgradeRemoteImageUrl(img);
  return "";
}

async function ogImageForItem(it) {
  const pageUrl = String(it.url || "").trim();
  if (!isRemoteUrl(pageUrl)) return "";
  const meta = await fetchPageMeta(pageUrl);
  await sleep(OG_DELAY_MS);
  if (!meta.ok || !meta.image) return "";
  return upgradeRemoteImageUrl(meta.image);
}

async function main() {
  const specs = loadHubSpecs();
  let ok = 0;
  let skip = 0;
  let fail = 0;
  let hubsWritten = 0;

  for (const spec of specs) {
    const slug = spec.slug;
    if (HUB_FILTER && !HUB_FILTER.has(slug)) continue;
    const items = spec.hotMixItems;
    if (!slug || !Array.isArray(items) || !items.length) continue;

    let hubChanged = false;
    fs.mkdirSync(path.join(HUB_HOTMIX_DIR, slug), { recursive: true });

    for (const it of items) {
      let remote = resolveRemoteUrl(it);
      const local = String(it.image || "").trim();
      const pageUrl = String(it.url || "").trim();

      if (
        isRemoteUrl(pageUrl) &&
        (FORCE || !remote || shouldSkipHotmixUrl(String(it.imageSource || it.image || "")))
      ) {
        const og = await ogImageForItem(it);
        if (og) {
          it.imageSource = og;
          remote = og;
          console.log(`OG ${slug} ${pageUrl.slice(0, 64)}…`);
        }
      }

      if (!remote) {
        if (local && isLocalAssetPath(local)) {
          if (!FORCE || localHotmixWidth(local) >= HOTMIX_MIN_WIDTH) {
            skip++;
            continue;
          }
          if (!it.imageSource) {
            skip++;
            continue;
          }
        } else {
          skip++;
          continue;
        }
      }

      const fetchUrl = remote || upgradeRemoteImageUrl(it.imageSource);
      if (!fetchUrl || shouldSkipHotmixUrl(fetchUrl)) {
        it.image = "";
        it.imageSource = "";
        hubChanged = true;
        skip++;
        continue;
      }

      if (!FORCE && local && isLocalAssetPath(local) && localHotmixWidth(local) >= HOTMIX_MIN_WIDTH) {
        if (!it.imageSource) {
          it.imageSource = fetchUrl;
          hubChanged = true;
        }
        skip++;
        continue;
      }

      try {
        const { buf, ext } = await download(fetchUrl);
        const dest = hotmixAbsPath(slug, fetchUrl, ext);
        fs.writeFileSync(dest, buf);
        it.imageSource = fetchUrl;
        it.image = hotmixRelPath(slug, fetchUrl, ext);
        hubChanged = true;
        ok++;
        console.log(`OK ${slug} ${path.basename(dest)} (${(buf.length / 1024).toFixed(1)} KiB)`);
        await new Promise((r) => setTimeout(r, DELAY_MS));
      } catch (e) {
        console.warn(`FAIL ${slug} ${fetchUrl.slice(0, 72)}…: ${e.message}`);
        if (local && isLocalAssetPath(local) && fs.existsSync(path.join(ROOT, local))) {
          it.image = local;
        }
        fail++;
      }
    }

    if (hubChanged) {
      fs.writeFileSync(
        path.join(HUB_DIR, `${slug}.json`),
        JSON.stringify(spec, null, 2) + "\n",
        "utf8"
      );
      hubsWritten++;
    }
  }

  console.log(
    `\nDone. ${ok} downloaded, ${skip} skipped, ${fail} failed; ${hubsWritten} hub JSON updated.`
  );
  if (fail > 0) process.exitCode = 1;
}

main();
