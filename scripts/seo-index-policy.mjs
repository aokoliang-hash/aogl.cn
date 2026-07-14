/**
 * Index / sitemap / AdSense thin-content policy.
 * See docs/AdSense全面整改-2026-06-22.md · docs/AdSense低价值内容-榜单存档noindex-2026-07-14.md
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

/**
 * Ranking / chart / news-archive articles: keep as human bookmarks + Hub cards,
 * but remove from search + sitemap + AdSense primary surface (low-value signal).
 * Demo / production notes / editorial guides stay indexable.
 */
export const ARTICLE_ARCHIVE_NOINDEX_SLUGS = new Set([
  "aicpb-global-ai-rankings-202604",
  "aicpb-global-ai-website-rankings-202606-20260708",
  "amazon-bestsellers-electronics-20260629",
  "amazon-bestsellers-electronics-us-20260601",
  "amazon-bestsellers-fashion-us-20260601",
  "amazon-prime-day-2026-deals-20260601",
  "apple-store-ios-games-cn-20260601",
  "brand-finance-global-500-2026",
  "facebook-us-pages-emplifi-20250617",
  "fortune-china-tech-50-2026",
  "google-trends-us-daily-rss-20260624",
  "google-trends-us-search-ranking-20260622",
  "ign-new-games-2026-20260703",
  "instagram-popular-20260601",
  "interbrand-best-global-brands-2026-20260703",
  "ios-266-beta-2-macworld-20260629",
  "nvidia-halos-robotics-physical-ai-20260622",
  "openai-broadcom-jalapeno-inference-chip-20260624",
  "playstation-studios-bungie-update-20260626",
  "sensor-tower-mobile-games-january-2026",
  "sensor-tower-state-of-ai-2026",
  "steam-charts-bestsellers-most-played",
  "steam-charts-weekly-us-20260707",
  "top-online-marketplaces-gmv-2026-20260707",
  "world-cup-2026-turkey-usmnt-20260626",
  "world-ev-sales-may-2026-20260707",
  "youtube-fifa-creator-cup-20260629",
  "youtube-trending-trailers-us-20260622",
]);

/** Allowed in sitemap.xml (plus indexable articles/*). */
export const SITEMAP_STATIC_PAGES = new Set([
  "index.html",
  "about.html",
  "changelog.html",
  "privacy.html",
  "contact.html",
]);

export const NOINDEX_ROBOTS = "noindex,follow";
export const INDEXABLE_ROBOTS = "index,follow,max-image-preview:large";

export function articleSlugFromPath(relativePath) {
  const p = String(relativePath || "").replace(/^\//, "");
  const m = /^articles\/([^/]+)\.html$/i.exec(p);
  return m ? m[1] : "";
}

export function isArchiveArticleSlug(slug) {
  return ARTICLE_ARCHIVE_NOINDEX_SLUGS.has(String(slug || "").trim());
}

export function isNoindexPage(relativePath) {
  const p = String(relativePath || "").replace(/^\//, "");
  if (NOINDEX_PATH_PREFIXES.some((prefix) => p.startsWith(prefix))) return true;
  if (NOINDEX_STATIC_PAGES.has(p)) return true;
  const slug = articleSlugFromPath(p);
  if (slug && slug !== "index" && isArchiveArticleSlug(slug)) return true;
  return false;
}

export function isSitemapPage(relativePath) {
  const p = String(relativePath || "").replace(/^\//, "");
  if (isNoindexPage(p)) return false;
  if (p.startsWith("articles/") && p.endsWith(".html")) return true;
  return SITEMAP_STATIC_PAGES.has(p);
}
