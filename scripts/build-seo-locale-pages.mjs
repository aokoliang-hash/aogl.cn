#!/usr/bin/env node
/**
 * Multilingual sources live in _multilang/*.html (from build-hubs + manual index).
 * Generates:
 *   / (root)     — 简体中文单语（canonical = 自身）
 *   /zh/       — 繁体中文（由简体 lang-zh 经 OpenCC 转换，hreflang=zh-Hant）
 *   /en/, /ja/ … — 各语言单语
 * Run after: npm run build-hubs && npm run build-index-pills
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import OpenCC from "opencc-js/cn2t";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MULTILANG_DIR = path.join(ROOT, "_multilang");
const BASE = "https://aogl.cn";

const SUBLOCALES = ["en", "ja", "ko", "fr", "ru", "ar"];

const HTML_LANG = {
  en: "en",
  zh: "zh-CN",
  zht: "zh-Hant",
  ja: "ja",
  ko: "ko",
  fr: "fr",
  ru: "ru",
  ar: "ar",
};

const STATIC_PAGES = [
  "index.html",
  "portal.html",
  "brands.html",
  "shopping.html",
  "life.html",
  "social.html",
  "tech.html",
  "games.html",
  "tools.html",
  "privacy.html",
  "changelog.html",
];

function multilangArticlePages() {
  const dir = path.join(MULTILANG_DIR, "articles");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".html"))
    .sort()
    .map((f) => `articles/${f}`);
}

function getAllPages() {
  return [...STATIC_PAGES, ...multilangArticlePages()];
}

const toTraditional = OpenCC.Converter({ from: "cn", to: "tw" });

function urlZhCn(filename) {
  return filename === "index.html" ? `${BASE}/` : `${BASE}/${filename}`;
}
function urlZhHant(filename) {
  return filename === "index.html" ? `${BASE}/zh/` : `${BASE}/zh/${filename}`;
}
function urlEn(filename) {
  return filename === "index.html" ? `${BASE}/en/` : `${BASE}/en/${filename}`;
}
function urlLocale(loc, filename) {
  if (filename === "index.html") return `${BASE}/${loc}/`;
  return `${BASE}/${loc}/${filename}`;
}

function stripAlternateLocales($, keep) {
  $("[class*='lang-']").each((_, el) => {
    const $el = $(el);
    const cls = $el.attr("class") || "";
    const found = new Set();
    let m;
    const r = /\blang-(en|zh|ja|ko|fr|ru|ar)\b/g;
    while ((m = r.exec(cls))) found.add(m[1]);
    if (found.size === 0) return;
    if (!found.has(keep)) $el.remove();
  });
}

function rootDataAttrsForLocale($, keep) {
  const html = $("html");
  for (const code of ["en", "zh", "zht", "ja", "ko", "fr", "ru", "ar"]) {
    if (code === keep) continue;
    html.removeAttr(`data-title-${code}`);
    html.removeAttr(`data-desc-${code}`);
  }
}

/** Directory URL for this locale (e.g. /en/ or /) from the page canonical. */
function siteHomeFromCanonical(canonicalHref) {
  const u = new URL(canonicalHref);
  let p = u.pathname;
  if (/\.html$/i.test(p)) {
    p = p.replace(/\/[^/]+$/, "/");
    if (!p.startsWith("/")) p = "/" + p;
  }
  if (/\/articles\/$/i.test(p)) {
    p = p.replace(/\/articles\/$/i, "/");
  }
  if (!p.endsWith("/")) p += "/";
  u.pathname = p;
  return u.href;
}

function patchJsonLdNode(node, langTag, filename, siteHome, canonicalHref) {
  const origin = "https://aogl.cn";

  function rewriteStr(s) {
    if (typeof s !== "string" || !s.startsWith(origin)) return s;
    const homeNorm = siteHome.endsWith("/") ? siteHome : siteHome + "/";
    const homeBase = homeNorm.replace(/\/+$/, "");
    if (s.startsWith(origin + "/#")) {
      return homeBase + s.slice(origin.length);
    }
    if (s === origin + "/") {
      return homeNorm;
    }
    if (filename !== "index.html") {
      const legacyFile = `${origin}/${filename}`;
      if (s === legacyFile || s.startsWith(legacyFile + "#")) {
        const can = canonicalHref.split("#")[0];
        return can + s.slice(legacyFile.length);
      }
    }
    return s;
  }

  function walk(n) {
    if (n === null || n === undefined) return;
    if (Array.isArray(n)) {
      for (let i = 0; i < n.length; i++) {
        const v = n[i];
        if (typeof v === "string") n[i] = rewriteStr(v);
        else walk(v);
      }
      return;
    }
    if (typeof n === "object") {
      if ("inLanguage" in n) n.inLanguage = langTag;
      for (const k of Object.keys(n)) {
        if (k === "inLanguage") continue;
        const v = n[k];
        if (typeof v === "string") n[k] = rewriteStr(v);
        else walk(v);
      }
    }
  }

  walk(node);
}

function slimJsonLdScripts($, langTag, filename, siteHome, canonicalHref) {
  $("script[type='application/ld+json']").each((_, el) => {
    const $el = $(el);
    const text = $el.html();
    if (!text || !/\S/.test(text)) return;
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return;
    }
    if (data["@graph"] && Array.isArray(data["@graph"])) {
      for (const item of data["@graph"]) {
        patchJsonLdNode(item, langTag, filename, siteHome, canonicalHref);
      }
    } else {
      patchJsonLdNode(data, langTag, filename, siteHome, canonicalHref);
    }
    $el.html("\n" + JSON.stringify(data) + "\n");
  });
}

/** Single-locale pages: drop alternate og locales, trim keywords, tighten JSON-LD. */
function slimLocaleHeadExtras($, locale, filename) {
  $('meta[property="og:locale:alternate"]').remove();
  if (locale !== "en") $('meta[name="keywords"]').remove();
  const canonicalHref = $('link[rel="canonical"]').attr("href") || "";
  let siteHome = canonicalHref;
  try {
    siteHome = siteHomeFromCanonical(canonicalHref);
  } catch {
    /* keep canonicalHref */
  }
  const langTag = HTML_LANG[locale] || locale;
  slimJsonLdScripts($, langTag, filename, siteHome, canonicalHref);
}

function absolutizeAssetRefs($) {
  const attrs = ["href", "src"];
  const sameDirHtml = /^[a-z0-9_.-]+\.html(?:#.*)?$/i;
  $("link[href], script[src], img[src], a[href], source[src]").each((_, el) => {
    const $el = $(el);
    for (const a of attrs) {
      const v = $el.attr(a);
      if (v == null || v === "") continue;
      if (v.startsWith("http:") || v.startsWith("https:") || v.startsWith("mailto:") || v.startsWith("#") || v.startsWith("/"))
        continue;
      if (v.startsWith("../") || v.startsWith("./")) continue;
      if (a === "href" && (v.startsWith("javascript:") || v === "#")) continue;
      if (a === "href" && sameDirHtml.test(v)) continue;
      $el.attr(a, "/" + v.replace(/^\.?\//, ""));
    }
  });
}

/**
 * Article templates use one "../" from _multilang/articles/; output may be
 * articles/foo.html or en/articles/foo.html. Pass outDirSegment ("en", "zh", "ja", …) or "" for root zh.
 */
function rewriteArticleAssetDepth($, filename, outDirSegment = "") {
  if (!filename || !filename.includes("articles/") || !filename.endsWith(".html")) return;
  const rel = outDirSegment ? `${outDirSegment}/${filename}` : filename;
  const depth = rel.split("/").filter(Boolean).length - 1;
  const prefix = depth <= 0 ? "" : "../".repeat(depth);
  const sel = "link[href], script[src], img[src], a[href], iframe[src], source[src]";
  $(sel).each((_, el) => {
    const $el = $(el);
    for (const a of ["href", "src"]) {
      const v = $el.attr(a);
      if (v == null || v === "") continue;
      if (v.startsWith("http:") || v.startsWith("https:") || v.startsWith("mailto:") || v.startsWith("#") || v.startsWith("data:"))
        continue;
      if (v.startsWith("./")) {
        const rest = v.replace(/^\.\/+/, "");
        $el.attr(a, prefix + rest);
        continue;
      }
      if (!v.startsWith("../")) continue;
      const rest = v.replace(/^\.\.\/+/, "");
      $el.attr(a, prefix + rest);
    }
  });
}

function replaceHreflangCluster($, filename) {
  $("link[rel='alternate'][hreflang]").remove();
  const lines = [
    `  <link rel="alternate" hreflang="en" href="${urlEn(filename)}" />`,
    `  <link rel="alternate" hreflang="zh-Hant" href="${urlZhHant(filename)}" />`,
    `  <link rel="alternate" hreflang="zh-CN" href="${urlZhCn(filename)}" />`,
    `  <link rel="alternate" hreflang="ja" href="${urlLocale("ja", filename)}" />`,
    `  <link rel="alternate" hreflang="ko" href="${urlLocale("ko", filename)}" />`,
    `  <link rel="alternate" hreflang="fr" href="${urlLocale("fr", filename)}" />`,
    `  <link rel="alternate" hreflang="ru" href="${urlLocale("ru", filename)}" />`,
    `  <link rel="alternate" hreflang="ar" href="${urlLocale("ar", filename)}" />`,
    `  <link rel="alternate" hreflang="x-default" href="${urlEn(filename)}" />`,
  ].join("\n");
  const canonical = $(`link[rel='canonical']`);
  if (canonical.length) canonical.first().after(`\n${lines}\n`);
  else $("head").prepend(`${lines}\n`);
}

function applyOgLocale($, locale) {
  const ogLoc =
    locale === "en"
      ? "en_US"
      : locale === "zh"
        ? "zh_CN"
        : locale === "zht"
          ? "zh_TW"
          : locale === "ja"
            ? "ja_JP"
            : locale === "ko"
              ? "ko_KR"
              : locale === "fr"
                ? "fr_FR"
                : locale === "ru"
                  ? "ru_RU"
                  : "ar_SA";
  $('meta[property="og:locale"]').attr("content", ogLoc);
}

function applyLocaleHead($, locale, filename, canonicalHref, opts) {
  const html = $("html");
  const titleKey = locale === "zht" ? "zh" : locale;
  const title = html.attr(`data-title-${titleKey}`) || html.attr("data-title-en") || "";
  const desc = html.attr(`data-desc-${titleKey}`) || html.attr("data-desc-en") || "";

  $("title").text(title.replace(/&amp;/g, "&"));
  $('meta[name="description"]').attr("content", desc);
  $('link[rel="canonical"]').attr("href", canonicalHref);

  $('meta[property="og:url"]').attr("content", canonicalHref);
  $('meta[property="og:title"]').attr("content", title.replace(/&amp;/g, "&"));
  $('meta[property="og:description"]').attr("content", desc);
  $('meta[name="twitter:title"]').attr("content", title.replace(/&amp;/g, "&"));
  $('meta[name="twitter:description"]').attr("content", desc);

  applyOgLocale($, locale === "zht" ? "zht" : locale);
  html.attr("lang", HTML_LANG[locale] || locale);
  $("body").attr("class", opts.bodyClass || `locale-${locale}`);
  html.attr("data-aogl-lang", opts.dataLang || locale);
  if (opts.seoLocale) html.attr("data-aogl-seo-locale", "1");
  else html.removeAttr("data-aogl-seo-locale");
  replaceHreflangCluster($, filename);
  slimLocaleHeadExtras($, locale, filename);
}

function tidySeoHtml(html) {
  const re = /(<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>)/gi;
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(collapseBlankLinesOutsideBlocks(html.slice(last, m.index)));
    out.push(m[0]);
    last = m.index + m[0].length;
  }
  out.push(collapseBlankLinesOutsideBlocks(html.slice(last)));
  return out.join("");
}

function collapseBlankLinesOutsideBlocks(s) {
  return s
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n");
}

function toTraditionalOutsideScripts(html) {
  const re = /(<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>)/gi;
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    parts.push(toTraditional(html.slice(last, m.index)));
    parts.push(m[0]);
    last = m.index + m[0].length;
  }
  parts.push(toTraditional(html.slice(last)));
  return parts.join("");
}

function transformSubfolderLocale(html, locale, filename, outDirSegment) {
  const $ = cheerio.load(html, { decodeEntities: false });
  stripAlternateLocales($, locale);
  rootDataAttrsForLocale($, locale);
  absolutizeAssetRefs($);
  rewriteArticleAssetDepth($, filename, outDirSegment ?? locale);
  const can = urlLocale(locale, filename);
  applyLocaleHead($, locale, filename, can, { bodyClass: `locale-${locale}`, dataLang: locale, seoLocale: true });
  return tidySeoHtml($.root().html());
}

function transformZhTraditional(html, filename) {
  const $ = cheerio.load(html, { decodeEntities: false });
  stripAlternateLocales($, "zh");
  rootDataAttrsForLocale($, "zh");
  absolutizeAssetRefs($);
  rewriteArticleAssetDepth($, filename, "zh");
  applyLocaleHead($, "zht", filename, urlZhHant(filename), {
    bodyClass: "locale-zht",
    dataLang: "zht",
    seoLocale: true,
  });
  let out = $.root().html();
  out = toTraditionalOutsideScripts(out);
  return tidySeoHtml(out);
}

function transformRootSimplifiedZh(html, filename) {
  const $ = cheerio.load(html, { decodeEntities: false });
  stripAlternateLocales($, "zh");
  rootDataAttrsForLocale($, "zh");
  rewriteArticleAssetDepth($, filename, "");
  applyLocaleHead($, "zh", filename, urlZhCn(filename), {
    bodyClass: "locale-zh",
    dataLang: "zh",
    seoLocale: false,
  });
  return tidySeoHtml($.root().html());
}

function transformEn(html, filename) {
  return transformSubfolderLocale(html, "en", filename, "en");
}

function isMultilingualSource(s) {
  return /\blang-en\b/.test(s) && /\blang-zh\b/.test(s);
}

function bootstrapMultilangIfNeeded(filename) {
  const dest = path.join(MULTILANG_DIR, filename);
  if (fs.existsSync(dest)) return;
  const src = path.join(ROOT, filename);
  if (!fs.existsSync(src)) {
    console.warn("Missing source for bootstrap:", filename);
    return;
  }
  const h = fs.readFileSync(src, "utf8");
  if (!isMultilingualSource(h)) {
    console.warn("Skip bootstrap (not multilingual):", filename);
    return;
  }
  fs.mkdirSync(MULTILANG_DIR, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("Bootstrapped _multilang/" + filename);
}

function readMultilang(filename) {
  const p = path.join(MULTILANG_DIR, filename);
  if (!fs.existsSync(p)) throw new Error(`Missing _multilang/${filename} — run build-hubs and ensure sources exist.`);
  return fs.readFileSync(p, "utf8");
}

function isArticlePage(file) {
  return typeof file === "string" && file.startsWith("articles/");
}

function writeSitemap() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const pages = getAllPages();
  const urls = [];
  for (const file of pages) {
    const art = isArticlePage(file);
    urls.push({
      loc: urlZhCn(file),
      pr: file === "index.html" ? "1" : file === "privacy.html" || file === "changelog.html" ? "0.42" : art ? "0.65" : "0.88",
    });
    urls.push({
      loc: urlZhHant(file),
      pr: file === "index.html" ? "0.96" : file === "privacy.html" || file === "changelog.html" ? "0.36" : art ? "0.6" : "0.82",
    });
    urls.push({
      loc: urlEn(file),
      pr: file === "index.html" ? "0.98" : file === "privacy.html" || file === "changelog.html" ? "0.4" : art ? "0.64" : "0.86",
    });
    for (const loc of SUBLOCALES) {
      if (loc === "en") continue;
      urls.push({
        loc: urlLocale(loc, file),
        pr: file === "index.html" ? "0.95" : file === "privacy.html" || file === "changelog.html" ? "0.35" : art ? "0.58" : "0.8",
      });
    }
  }
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${
      u.loc.includes("/articles/") && /\.html(\?|$)/.test(u.loc)
        ? "monthly"
        : u.pr === "0.35" || u.pr === "0.36" || u.pr === "0.4" || u.pr === "0.42"
          ? u.loc.includes("changelog")
            ? "monthly"
            : "yearly"
          : "weekly"
    }</changefreq>
    <priority>${u.pr}</priority>
  </url>`
    )
    .join("\n");
  fs.writeFileSync(
    path.join(ROOT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`,
    "utf8"
  );
}

function main() {
  const pages = getAllPages();
  for (const f of pages) bootstrapMultilangIfNeeded(f);

  for (const loc of ["en", "zh", "ja", "ko", "fr", "ru", "ar"]) {
    fs.mkdirSync(path.join(ROOT, loc), { recursive: true });
  }

  for (const file of pages) {
    const html = readMultilang(file);
    const writeOut = (absPath, content) => {
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, content, "utf8");
    };
    writeOut(path.join(ROOT, "en", file), transformEn(html, file));
    writeOut(path.join(ROOT, "zh", file), transformZhTraditional(html, file));
    for (const loc of SUBLOCALES) {
      if (loc === "en") continue;
      writeOut(path.join(ROOT, loc, file), transformSubfolderLocale(html, loc, file, loc));
    }
    writeOut(path.join(ROOT, file), transformRootSimplifiedZh(html, file));
  }

  writeSitemap();
  console.log(
    "SEO: root=简体 zh, /zh/=繁体, /en/…=其他语种; sources=_multilang/*.html; wrote",
    pages.length,
    "root +",
    8 * pages.length,
    "locale outputs (en/zh/ja/ko/fr/ru/ar + root) + sitemap.xml"
  );
}

main();
