/**
 * Local paths for hub hot-mix card images (upload/hub-hotmix/<slug>/).
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readImageDimensions } from "./favicon-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const HUB_HOTMIX_DIR = path.join(ROOT, "upload", "hub-hotmix");

export function isRemoteUrl(u) {
  return /^https?:\/\//i.test(String(u || "").trim());
}

export function isLocalAssetPath(u) {
  const s = String(u || "").trim();
  return Boolean(s) && !isRemoteUrl(s);
}

export const HOTMIX_MIN_WIDTH = 720;

/** Prefer larger CDN / CMS image variants when downloading. */
export function upgradeRemoteImageUrl(url) {
  let u = String(url || "").trim();
  if (!isRemoteUrl(u)) return u;
  u = u.replace(/max-\d+x\d+/gi, "max-1200x1200");
  u = u.replace(/\.max-\d+x\d+\./gi, ".max-1200x1200.");
  u = u.replace(/fit=\d+%2C\d+/gi, "fit=1200%2C675");
  u = u.replace(/([?&])w=\d+/gi, "$1w=1200");
  return u;
}

export function localHotmixWidth(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return 0;
  try {
    const dim = readImageDimensions(fs.readFileSync(p));
    return dim ? dim.w : 0;
  } catch {
    return 0;
  }
}

export function shouldSkipHotmixUrl(url) {
  const u = String(url || "").toLowerCase();
  return !u || u.includes("placeholder.svg") || u.includes("gravatar.com/avatar");
}

export function hotmixUrlHash(url) {
  return crypto.createHash("sha256").update(String(url)).digest("hex").slice(0, 16);
}

export function extFromUrl(url) {
  try {
    const p = new URL(url).pathname.toLowerCase();
    const m = p.match(/\.(webp|jpe?g|png|gif|avif)(\?|$)/);
    if (m) return m[1] === "jpeg" ? ".jpg" : `.${m[1]}`;
  } catch {
    /* ignore */
  }
  return ".jpg";
}

export function extFromContentType(ct) {
  const t = String(ct || "").toLowerCase();
  if (t.includes("webp")) return ".webp";
  if (t.includes("png")) return ".png";
  if (t.includes("gif")) return ".gif";
  if (t.includes("svg")) return ".svg";
  if (t.includes("jpeg") || t.includes("jpg")) return ".jpg";
  return ".jpg";
}

export function hotmixRelPath(hubSlug, url, ext) {
  const e = ext.startsWith(".") ? ext : `.${ext}`;
  return `upload/hub-hotmix/${hubSlug}/${hotmixUrlHash(url)}${e}`;
}

export function hotmixAbsPath(hubSlug, url, ext) {
  return path.join(ROOT, hotmixRelPath(hubSlug, url, ext));
}

export function hotmixExistsAtRel(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

/** Resolve img src for hub HTML: local file in JSON or on disk; null → use favicon fallback. */
export function hotMixImageSrcForHtml(hubSlug, it) {
  const img = String(it.image || "").trim();
  if (!img) return null;
  if (isLocalAssetPath(img)) {
    return hotmixExistsAtRel(img) ? img : img;
  }
  if (shouldSkipHotmixUrl(img)) return null;
  const dir = path.join(HUB_HOTMIX_DIR, hubSlug);
  if (!fs.existsSync(dir)) return null;
  const hash = hotmixUrlHash(img);
  for (const ext of [".webp", ".jpg", ".jpeg", ".png", ".gif", ".svg"]) {
    const rel = `upload/hub-hotmix/${hubSlug}/${hash}${ext}`;
    if (hotmixExistsAtRel(rel)) return rel;
  }
  return null;
}

export function collectHotmixRemoteUrls(hubSpecs) {
  const rows = [];
  for (const spec of hubSpecs) {
    const slug = spec.slug;
    if (!slug) continue;
    for (const it of spec.hotMixItems || []) {
      const img = String(it.image || "").trim();
      if (!isRemoteUrl(img) || shouldSkipHotmixUrl(img)) continue;
      rows.push({ hubSlug: slug, url: img, item: it });
    }
  }
  return rows;
}
