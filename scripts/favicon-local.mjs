/**
 * Local favicon paths for homepage tools directory (upload/favicons/).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const FAVICON_DIR = path.join(ROOT, "upload", "favicons");

export function faviconFilename(domain) {
  return String(domain || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "_") + ".png";
}

export function faviconRelPath(domain) {
  return `upload/favicons/${faviconFilename(domain)}`;
}

export function faviconAbsPath(domain) {
  return path.join(FAVICON_DIR, faviconFilename(domain));
}

export function faviconExists(domain) {
  return fs.existsSync(faviconAbsPath(domain));
}

export function googleFaviconUrl(domain, sz = 128) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${sz}`;
}

export const FAVICON_MIN_PX = 48;
export const FAVICON_TARGET_PX = 120;

/** Read PNG/JPEG/GIF dimensions from buffer (best-effort). */
export function readImageDimensions(buf) {
  if (!buf || buf.length < 24) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) break;
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
  }
  return null;
}

export function yandexFaviconUrlV2(domain, size = FAVICON_TARGET_PX) {
  const d = String(domain || "").trim();
  return `https://favicon.yandex.net/favicon/v2/${encodeURIComponent(d)}?size=${size}&stub=1`;
}

/** Candidate URLs, largest reliable sources first. */
export function faviconCandidateUrls(domain) {
  const d = String(domain || "").trim();
  const bare = d.replace(/^www\./, "");
  const hosts = [...new Set([d, bare, `www.${bare}`])];
  const urls = [];
  for (const h of hosts) {
    urls.push(yandexFaviconUrlV2(h, FAVICON_TARGET_PX));
    urls.push(googleFaviconUrl(h, 128));
    urls.push(`https://${h}/apple-touch-icon.png`);
    urls.push(`https://${h}/apple-touch-icon-precomposed.png`);
    urls.push(`https://${h}/favicon-192x192.png`);
    urls.push(`https://${h}/favicon-128x128.png`);
    urls.push(`https://${h}/favicon-96x96.png`);
    urls.push(`https://${h}/favicon-32x32.png`);
    urls.push(`https://${h}/favicon.ico`);
  }
  urls.push(`https://favicon.yandex.net/favicon/${encodeURIComponent(d)}`);
  urls.push(`https://icons.duckduckgo.com/ip3/${bare}.ico`);
  return [...new Set(urls)];
}

export function faviconQualityScore(buf) {
  const dim = readImageDimensions(buf);
  if (!dim || !dim.w || !dim.h) return buf.length;
  return Math.min(dim.w, dim.h) * 1000 + dim.w * dim.h;
}

export function existingFaviconMinSide(domain) {
  const p = faviconAbsPath(domain);
  if (!fs.existsSync(p)) return 0;
  try {
    const dim = readImageDimensions(fs.readFileSync(p));
    if (!dim) return 0;
    return Math.min(dim.w, dim.h);
  } catch {
    return 0;
  }
}

/** Prefer local file; optional remote fallback when missing (build-time only). */
export function faviconSrcForHtml(domain, { allowRemoteFallback = false } = {}) {
  if (faviconExists(domain)) return faviconRelPath(domain);
  if (allowRemoteFallback) return googleFaviconUrl(domain);
  return faviconRelPath(domain);
}

export function normalizeDomain(domain) {
  return String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

export function collectToolDomains(toolsDirectoryJson) {
  const set = new Set();
  for (const cat of toolsDirectoryJson.categories || []) {
    for (const t of cat.tools || []) {
      if (t.domain) set.add(String(t.domain).trim());
    }
  }
  return [...set].sort();
}

export function collectHubSpecDomains(spec) {
  const set = new Set();
  for (const list of [spec.top10, spec.more]) {
    for (const t of list || []) {
      if (t.domain) set.add(String(t.domain).trim());
    }
  }
  return [...set];
}

/** All favicon domains: homepage tools + hub rank/more lists. */
export function collectAllFaviconDomains(root = ROOT) {
  const set = new Set();
  const toolsPath = path.join(root, "data", "tools-directory.json");
  if (fs.existsSync(toolsPath)) {
    const tools = JSON.parse(fs.readFileSync(toolsPath, "utf8"));
    for (const d of collectToolDomains(tools)) set.add(d);
  }
  const hubDir = path.join(root, "data", "hubs");
  if (fs.existsSync(hubDir)) {
    for (const f of fs.readdirSync(hubDir)) {
      if (!f.endsWith(".json") || f === "news-feeds.json") continue;
      const spec = JSON.parse(fs.readFileSync(path.join(hubDir, f), "utf8"));
      for (const d of collectHubSpecDomains(spec)) set.add(d);
    }
  }
  return [...set].sort();
}
