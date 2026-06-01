/**
 * Map outbound URL → local path (briefs/ or hub-links/), shared by hub + feed builders.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeUrl, slugFromUrl } from "./brief-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BRIEFS_DIR = path.join(ROOT, "data", "briefs");
const HUB_LINKS_DIR = path.join(ROOT, "data", "hub-links");

let cache = null;

function loadMaps() {
  if (cache) return cache;
  const briefByUrl = new Map();
  const hubByUrl = new Map();

  if (fs.existsSync(BRIEFS_DIR)) {
    for (const f of fs.readdirSync(BRIEFS_DIR)) {
      if (!f.endsWith(".json") || f.startsWith("_")) continue;
      const o = JSON.parse(fs.readFileSync(path.join(BRIEFS_DIR, f), "utf8"));
      if (o.sourceUrl && o.slug) briefByUrl.set(normalizeUrl(o.sourceUrl), o.slug);
    }
  }
  if (fs.existsSync(HUB_LINKS_DIR)) {
    for (const f of fs.readdirSync(HUB_LINKS_DIR)) {
      if (!f.endsWith(".json") || f.startsWith("_")) continue;
      const o = JSON.parse(fs.readFileSync(path.join(HUB_LINKS_DIR, f), "utf8"));
      if (o.url && o.slug) hubByUrl.set(normalizeUrl(o.url), o.slug);
    }
  }
  cache = { briefByUrl, hubByUrl };
  return cache;
}

export function clearLocalLinkCache() {
  cache = null;
}

/** @returns {string} relative path like briefs/x.html or hub-links/y.html, or original url if unknown */
export function resolveLocalHref(url) {
  const norm = normalizeUrl(url);
  const { briefByUrl, hubByUrl } = loadMaps();
  if (briefByUrl.has(norm)) return `briefs/${briefByUrl.get(norm)}.html`;
  if (hubByUrl.has(norm)) return `hub-links/${hubByUrl.get(norm)}.html`;
  return url;
}

export function isLocalHref(href) {
  return (
    typeof href === "string" &&
    (href.startsWith("briefs/") || href.startsWith("hub-links/") || href.startsWith("../briefs/") || href.startsWith("../hub-links/"))
  );
}

export function localHrefAttr(href) {
  if (isLocalHref(href)) return "";
  return ' target="_blank" rel="noopener noreferrer"';
}
