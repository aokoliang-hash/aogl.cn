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

const PAGES = [
  "index.html",
  "portal.html",
  "brands.html",
  "shopping.html",
  "life.html",
  "social.html",
  "tech.html",
  "games.html",
  "privacy.html",
];

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
  for (const code of ["en", "zh", "ja", "ko", "fr", "ru", "ar"]) {
    if (code === keep) continue;
    html.removeAttr(`data-title-${code}`);
    html.removeAttr(`data-desc-${code}`);
  }
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
      if (a === "href" && (v.startsWith("javascript:") || v === "#")) continue;
      if (a === "href" && sameDirHtml.test(v)) continue;
      $el.attr(a, "/" + v.replace(/^\.?\//, ""));
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

function transformSubfolderLocale(html, locale, filename) {
  const $ = cheerio.load(html, { decodeEntities: false });
  stripAlternateLocales($, locale);
  rootDataAttrsForLocale($, locale);
  absolutizeAssetRefs($);
  const can = urlLocale(locale, filename);
  applyLocaleHead($, locale, filename, can, { bodyClass: `locale-${locale}`, dataLang: locale, seoLocale: true });
  return tidySeoHtml($.root().html());
}

function transformZhTraditional(html, filename) {
  const $ = cheerio.load(html, { decodeEntities: false });
  stripAlternateLocales($, "zh");
  rootDataAttrsForLocale($, "zh");
  absolutizeAssetRefs($);
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
  applyLocaleHead($, "zh", filename, urlZhCn(filename), {
    bodyClass: "locale-zh",
    dataLang: "zh",
    seoLocale: false,
  });
  return tidySeoHtml($.root().html());
}

function transformEn(html, filename) {
  return transformSubfolderLocale(html, "en", filename);
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

function writeSitemap() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [];
  for (const file of PAGES) {
    urls.push({ loc: urlZhCn(file), pr: file === "index.html" ? "1" : file === "privacy.html" ? "0.42" : "0.88" });
    urls.push({ loc: urlZhHant(file), pr: file === "index.html" ? "0.96" : file === "privacy.html" ? "0.36" : "0.82" });
    urls.push({ loc: urlEn(file), pr: file === "index.html" ? "0.98" : file === "privacy.html" ? "0.4" : "0.86" });
    for (const loc of SUBLOCALES) {
      if (loc === "en") continue;
      urls.push({
        loc: urlLocale(loc, file),
        pr: file === "index.html" ? "0.95" : file === "privacy.html" ? "0.35" : "0.8",
      });
    }
  }
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.pr === "0.35" || u.pr === "0.36" || u.pr === "0.4" || u.pr === "0.42" ? "yearly" : "weekly"}</changefreq>
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
  for (const f of PAGES) bootstrapMultilangIfNeeded(f);

  for (const loc of ["en", "zh", "ja", "ko", "fr", "ru", "ar"]) {
    fs.mkdirSync(path.join(ROOT, loc), { recursive: true });
  }

  for (const file of PAGES) {
    const html = readMultilang(file);
    fs.writeFileSync(path.join(ROOT, "en", file), transformEn(html, file), "utf8");
    fs.writeFileSync(path.join(ROOT, "zh", file), transformZhTraditional(html, file), "utf8");
    for (const loc of SUBLOCALES) {
      if (loc === "en") continue;
      fs.writeFileSync(path.join(ROOT, loc, file), transformSubfolderLocale(html, loc, file), "utf8");
    }
    fs.writeFileSync(path.join(ROOT, file), transformRootSimplifiedZh(html, file), "utf8");
  }

  writeSitemap();
  console.log(
    "SEO: root=简体 zh, /zh/=繁体, /en/…=其他语种; sources=_multilang/*.html; wrote",
    PAGES.length,
    "root +",
    7 * PAGES.length,
    "locale files + sitemap.xml"
  );
}

main();
