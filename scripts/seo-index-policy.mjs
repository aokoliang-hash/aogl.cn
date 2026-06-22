/**
 * Index / sitemap / AdSense thin-content policy.
 * See docs/AdSense全面整改-2026-06-22.md
 */

/** Always noindex — navigation / aggregator templates. */
export const NOINDEX_PATH_PREFIXES = ["hub-links/", "briefs/", "tool-guides/"];

/** Hub verticals + headline index — bookmark rails, not primary content. */
export const NOINDEX_STATIC_PAGES = new Set([
  "portal.html",
  "brands.html",
  "shopping.html",
  "life.html",
  "social.html",
  "tech.html",
  "games.html",
  "tools.html",
  "official-news.html",
  "guides/index.html",
]);

/** Allowed in sitemap.xml (plus all articles/*). */
export const SITEMAP_STATIC_PAGES = new Set([
  "index.html",
  "about.html",
  "changelog.html",
  "privacy.html",
  "contact.html",
]);

export const NOINDEX_ROBOTS = "noindex,follow";
export const INDEXABLE_ROBOTS = "index,follow,max-image-preview:large";

export function isNoindexPage(relativePath) {
  const p = String(relativePath || "").replace(/^\//, "");
  if (NOINDEX_PATH_PREFIXES.some((prefix) => p.startsWith(prefix))) return true;
  return NOINDEX_STATIC_PAGES.has(p);
}

export function isSitemapPage(relativePath) {
  const p = String(relativePath || "").replace(/^\//, "");
  if (isNoindexPage(p)) return false;
  if (p.startsWith("articles/") && p.endsWith(".html")) return true;
  return SITEMAP_STATIC_PAGES.has(p);
}
