#!/usr/bin/env node
/**
 * Build _multilang/tool-guides/<slug>.html — local tool intros with outbound official link.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { faviconSrcForHtml } from "./favicon-local.mjs";
import {
  LANGS,
  ROOT,
  TOOL_GUIDES_DIR,
  buildToolGuideBodyHtml,
  escAttr,
  escHtml,
  guideDesc,
  loadAllToolGuides,
  toolGuidePath,
  toolName,
  catTitle,
} from "./tool-guide-utils.mjs";
import { sitePath } from "./site-paths.mjs";
import { GTAG_SCRIPT } from "./site-head-scripts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, "_multilang", "tool-guides");
const SITE = "https://aogl.cn";

const BACK_LABEL = {
  en: "← Tools directory",
  zh: "← 工具目录",
  ja: "← ツール一覧",
  ko: "← 도구 목록",
  fr: "← Répertoire",
  ru: "← Каталог",
  ar: "← الدليل",
};

const VISIT_CTA = {
  en: "Open official site",
  zh: "打开官网",
  ja: "公式サイトへ",
  ko: "공식 사이트",
  fr: "Site officiel",
  ru: "Официальный сайт",
  ar: "الموقع الرسمي",
};

function buildJsonLd(guide, titleEn, descEn) {
  const canonical = `${SITE}/en/${toolGuidePath(guide.slug)}`;
  return `<script type="application/ld+json">\n${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: titleEn,
    description: descEn,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: "en",
    about: { "@type": "SoftwareApplication", name: titleEn, url: guide.url },
  })}\n</script>`;
}

function buildPage(guide) {
  const slug = guide.slug;
  const icon = faviconSrcForHtml(guide.domain);
  const dataAttrs = LANGS.map((lang) => {
    const titleVal = toolName(guide, lang);
    return `data-title-${lang}="${escAttr(titleVal)} — aogl.cn" data-desc-${lang}="${escAttr(guideDesc(guide, lang))}"`;
  }).join(" ");

  const titleEn = toolName(guide, "en");
  const descEn = guideDesc(guide, "en");
  const officialUrl = escAttr(guide.url);

  const headBlock = `<!DOCTYPE html><html lang="en" ${dataAttrs}><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="${sitePath("favicon.svg")}" type="image/svg+xml" sizes="any">
  <meta name="description" content="${escAttr(descEn)}">
  <title>${escAttr(titleEn)} — aogl.cn</title>
  <link rel="canonical" href="${SITE}/en/${toolGuidePath(slug)}">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE}/en/${toolGuidePath(slug)}">
  <meta property="og:title" content="${escAttr(titleEn)} — aogl.cn">
  <meta property="og:description" content="${escAttr(descEn)}">
  <meta property="og:image" content="${SITE}/og-default.png">
  <link rel="stylesheet" href="${sitePath("css/privacy.css")}">
  <link rel="stylesheet" href="${sitePath("css/brief.css")}">
  <link rel="stylesheet" href="${sitePath("css/tool-guide.css")}">
  ${GTAG_SCRIPT}
  <script src="${sitePath("js/adsense.js")}"></script>
  ${buildJsonLd(guide, titleEn, descEn)}
</head>`;

  const back = LANGS.map(
    (lang) => `<a href="${sitePath("index.html")}#tools-directory" class="lang-${lang}">${BACK_LABEL[lang]}</a>`
  ).join("\n    ");

  const h1s = LANGS.map((lang) => `<h1 class="lang-${lang}">${escHtml(toolName(guide, lang))}</h1>`).join("\n  ");

  const catBadges = LANGS.map(
    (lang) => `<p class="lang-${lang} tool-guide-cat">${escHtml(catTitle(guide, lang))}</p>`
  ).join("\n    ");

  const bodies = LANGS.map((lang) => {
    const inner = buildToolGuideBodyHtml(guide, lang);
    return `<div class="lang-${lang} article-body brief-body">${inner}</div>`;
  }).join("\n  ");

  const ctas = LANGS.map((lang) => {
    const label = VISIT_CTA[lang] || VISIT_CTA.en;
    return `<p class="lang-${lang} brief-source-cta"><a href="${officialUrl}" rel="noopener noreferrer" target="_blank">${escHtml(label)} →</a></p>`;
  }).join("\n    ");

  const body = `<body class="locale-en">
  <script src="${sitePath("js/i18n.js")}"></script>
  <div class="top">
    ${back}
    <div class="lang-switch">
      <select class="aogl-lang-select" id="aogl-lang-tool-${slug.replace(/[^a-z0-9-]/gi, "-")}" aria-label="Language"></select>
    </div>
  </div>
  <div class="tool-guide-header">
    <img class="tool-guide-icon" src="${sitePath(icon)}" width="48" height="48" alt="" loading="lazy" decoding="async">
    <div class="tool-guide-header-text">
      ${h1s}
      ${catBadges}
    </div>
  </div>
  ${bodies}
  <div class="brief-source-box">
    <p class="brief-source-label lang-en">Official website</p>
    <p class="brief-source-label lang-zh">官方网站</p>
    ${ctas}
    <p class="brief-source-url"><a href="${officialUrl}" rel="noopener noreferrer" target="_blank">${escHtml(guide.url)}</a></p>
  </div>
</body></html>`;

  return headBlock + body;
}

function main() {
  const guides = loadAllToolGuides();
  if (guides.length === 0) {
    console.warn("No tool guides — run: node scripts/sync-tool-guides.mjs");
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const g of guides) {
    fs.writeFileSync(path.join(OUT_DIR, `${g.slug}.html`), buildPage(g), "utf8");
  }
  console.log(`Built ${guides.length} tool guide pages in _multilang/tool-guides/`);
}

main();
