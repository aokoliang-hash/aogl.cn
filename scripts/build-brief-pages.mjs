#!/usr/bin/env node
/**
 * Build _multilang/briefs/<slug>.html — local SEO summaries with outbound source link.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  BRIEFS_DIR,
  LANGS,
  ROOT,
  briefDesc,
  briefPagePath,
  buildBriefBodyHtml,
  escAttr,
  escHtml,
  loadAllBriefs,
  strByLang,
} from "./brief-utils.mjs";
import { sitePath } from "./site-paths.mjs";
import { GTAG_SCRIPT } from "./site-head-scripts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, "_multilang", "briefs");
const SITE = "https://aogl.cn";

const BACK_LABEL = {
  en: "← Home",
  zh: "← 返回首页",
  ja: "← ホーム",
  ko: "← 홈",
  fr: "← Accueil",
  ru: "← Главная",
  ar: "← الرئيسية",
};

const SOURCE_CTA = {
  en: "Read original on",
  zh: "阅读原文（",
  ja: "原文を読む（",
  ko: "원문 보기（",
  fr: "Lire l’original sur",
  ru: "Читать оригинал на",
  ar: "قراءة الأصل على",
};

function buildJsonLd(brief, titleEn, descEn) {
  const canonical = `${SITE}/en/briefs/${brief.slug}.html`;
  const obj = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: titleEn,
    description: descEn,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: "en",
    isBasedOn: brief.sourceUrl,
    citation: brief.sourceUrl,
    publisher: { "@type": "Organization", name: "aogl.cn", url: `${SITE}/` },
    author: { "@type": "Organization", name: brief.publisher || "aogl.cn" },
    dateModified: brief.updated || "",
  };
  return `<script type="application/ld+json">\n${JSON.stringify(obj)}\n</script>`;
}

function buildBriefPage(brief) {
  const slug = brief.slug;
  const dataAttrs = LANGS.map((lang) => {
    const titleVal = strByLang(brief, lang, "title");
    const descVal = briefDesc(brief, lang);
    return `data-title-${lang}="${escAttr(titleVal)} — aogl.cn" data-desc-${lang}="${escAttr(descVal)}"`;
  }).join(" ");

  const titleEn = strByLang(brief, "en", "title");
  const descEn = briefDesc(brief, "en");
  const publisher = escHtml(brief.publisher || "");
  const sourceUrl = escAttr(brief.sourceUrl);

  const headBlock = `<!DOCTYPE html><html lang="en" ${dataAttrs}><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="${sitePath("favicon.svg")}" type="image/svg+xml" sizes="any">
  <meta name="description" content="${escAttr(descEn)}">
  <title>${escAttr(titleEn)} — aogl.cn</title>
  <link rel="canonical" href="${SITE}/en/briefs/${slug}.html">
  <meta name="robots" content="noindex,follow">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE}/en/briefs/${slug}.html">
  <meta property="og:title" content="${escAttr(titleEn)} — aogl.cn">
  <meta property="og:description" content="${escAttr(descEn)}">
  <meta property="og:image" content="${SITE}/og-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="${sitePath("css/privacy.css")}">
  <link rel="stylesheet" href="${sitePath("css/brief.css")}">
  ${GTAG_SCRIPT}
  ${buildJsonLd(brief, titleEn, descEn)}
</head>`;

  const back = LANGS.map(
    (lang) => `<a href="${sitePath("index.html")}#reading" class="lang-${lang}">${BACK_LABEL[lang]}</a>`
  ).join("\n    ");

  const h1s = LANGS.map((lang) => {
    const h = strByLang(brief, lang, "title");
    return `<h1 class="lang-${lang}">${escHtml(h)}</h1>`;
  }).join("\n  ");

  const metaLines = LANGS.map((lang) => {
    const m = strByLang(brief, lang, "meta");
    return `<p class="lang-${lang} article-lead brief-meta">${escHtml(m)}</p>`;
  }).join("\n  ");

  const bodies = LANGS.map((lang) => {
    const inner = buildBriefBodyHtml(brief, lang);
    return `<div class="lang-${lang} article-body brief-body">${inner}</div>`;
  }).join("\n  ");

  const sourceBoxes = LANGS.map((lang) => {
    const label = SOURCE_CTA[lang] || SOURCE_CTA.en;
    const close = lang === "zh" || lang === "ja" || lang === "ko" ? "）→" : " →";
    const text =
      lang === "zh" || lang === "ja" || lang === "ko"
        ? `${label}${publisher}${close}`
        : `${label} ${publisher} →`;
    return `<p class="lang-${lang} brief-source-cta"><a href="${sourceUrl}" rel="noopener noreferrer" target="_blank">${escHtml(text)}</a></p>`;
  }).join("\n  ");

  const body = `<body class="locale-en">
  <script src="${sitePath("js/i18n.js")}"></script>
  <div class="top">
    ${back}
    <div class="lang-switch">
      <select class="aogl-lang-select" id="aogl-lang-brief-${slug.replace(/[^a-z0-9-]/gi, "-")}" aria-label="Language"></select>
    </div>
  </div>
  ${h1s}
  ${metaLines}
  ${bodies}
  <div class="brief-source-box">
    <p class="brief-source-label lang-en">Original publisher page</p>
    <p class="brief-source-label lang-zh">原文出处</p>
    ${sourceBoxes}
    <p class="brief-source-url"><a href="${sourceUrl}" rel="noopener noreferrer" target="_blank">${escHtml(brief.sourceUrl)}</a></p>
  </div>
</body></html>`;

  return headBlock + body;
}

function buildBriefIndex(briefs) {
  const rows = briefs
    .map((b) => {
      const href = escAttr(briefPagePath(b.slug));
      const en = escHtml(strByLang(b, "en", "title"));
      const zh = escHtml(strByLang(b, "zh", "title"));
      const meta = escHtml(b.publisher || "");
      return `        <li>
          <a href="${href}"><span class="lang-en">${en}</span><span class="lang-zh">${zh}</span></a>
          <span class="brief-index-meta">${meta}</span>
        </li>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en" data-title-en="Official headline briefs — aogl.cn" data-title-zh="官方动态速览 — aogl.cn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="${sitePath("favicon.svg")}" type="image/svg+xml" sizes="any">
  <meta name="description" content="Local brief pages for OpenAI, Anthropic, and DeepMind headlines — summaries on aogl.cn with links to originals.">
  <title>Official headline briefs — aogl.cn</title>
  <link rel="canonical" href="${SITE}/en/briefs/">
  <meta name="robots" content="noindex,follow">
  <link rel="stylesheet" href="${sitePath("css/privacy.css")}">
  <link rel="stylesheet" href="${sitePath("css/brief.css")}">
  <script src="${sitePath("js/i18n.js")}"></script>
</head>
<body class="locale-en">
  <div class="top">
    <a href="../index.html" class="lang-en">← Home</a>
    <a href="../index.html" class="lang-zh">← 返回首页</a>
    <div class="lang-switch">
      <select class="aogl-lang-select" id="aogl-lang-brief-index" aria-label="Language"></select>
    </div>
  </div>
  <h1 class="lang-en">Official headline briefs</h1>
  <h1 class="lang-zh">官方动态速览</h1>
  <p class="lang-en article-lead">${briefs.length} summaries on this site; each page links to the publisher’s original post.</p>
  <p class="lang-zh article-lead">共 ${briefs.length} 条本站速览；每页文末提供阅读原文外链。</p>
  <ul class="brief-index-list">
${rows}
  </ul>
</body>
</html>`;
}

function main() {
  const briefs = loadAllBriefs();
  if (briefs.length === 0) {
    console.warn("No brief JSON in data/briefs — run: node scripts/sync-brief-articles.mjs");
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const b of briefs) {
    fs.writeFileSync(path.join(OUT_DIR, `${b.slug}.html`), buildBriefPage(b), "utf8");
  }
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), buildBriefIndex(briefs), "utf8");
  console.log(`Built ${briefs.length} brief pages + index in _multilang/briefs/`);
}

main();
