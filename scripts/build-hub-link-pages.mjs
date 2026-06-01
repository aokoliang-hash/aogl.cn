#!/usr/bin/env node
/**
 * Build _multilang/hub-links/<slug>.html
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { faviconSrcForHtml } from "./favicon-local.mjs";
import {
  LANGS,
  ROOT,
  buildHubLinkBodyHtml,
  displayTitle,
  escAttr,
  escHtml,
  hubLabel,
  hubLinkPath,
  linkDesc,
  loadAllHubLinks,
} from "./hub-link-utils.mjs";
import { sitePath } from "./site-paths.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, "_multilang", "hub-links");
const SITE = "https://aogl.cn";

const BACK = {
  en: "← Hub",
  zh: "← 返回 Hub",
  ja: "← Hub",
  ko: "← Hub",
  fr: "← Hub",
  ru: "← Hub",
  ar: "← Hub",
};

const CTA = {
  en: "Open official site",
  zh: "打开官网",
  ja: "公式サイト",
  ko: "공식 사이트",
  fr: "Site officiel",
  ru: "Официальный сайт",
  ar: "الموقع الرسمي",
};

function buildJsonLd(link, titleEn, descEn) {
  const canonical = `${SITE}/en/${hubLinkPath(link.slug)}`;
  return `<script type="application/ld+json">\n${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: titleEn,
    description: descEn,
    url: canonical,
    mainEntityOfPage: canonical,
    about: { "@type": "WebSite", url: link.url },
  })}\n</script>`;
}

function buildPage(link) {
  const slug = link.slug;
  const hub = link.hub || "portal";
  const dataAttrs = LANGS.map((lang) => {
    const t = displayTitle(link, lang);
    return `data-title-${lang}="${escAttr(t)} — aogl.cn" data-desc-${lang}="${escAttr(linkDesc(link, lang))}"`;
  }).join(" ");

  const titleEn = displayTitle(link, "en");
  const descEn = linkDesc(link, "en");
  const officialUrl = escAttr(link.url);
  const backHub = `${hub}.html`;

  const head = `<!DOCTYPE html><html lang="en" ${dataAttrs}><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="${sitePath("favicon.svg")}" type="image/svg+xml" sizes="any">
  <meta name="description" content="${escAttr(descEn)}">
  <title>${escAttr(titleEn)} — aogl.cn</title>
  <link rel="canonical" href="${SITE}/en/${hubLinkPath(slug)}">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE}/en/${hubLinkPath(slug)}">
  <meta property="og:title" content="${escAttr(titleEn)} — aogl.cn">
  <meta property="og:description" content="${escAttr(descEn)}">
  <meta property="og:image" content="${SITE}/og-default.png">
  <link rel="stylesheet" href="${sitePath("css/privacy.css")}">
  <link rel="stylesheet" href="${sitePath("css/brief.css")}">
  <link rel="stylesheet" href="${sitePath("css/tool-guide.css")}">
  <script src="${sitePath("js/adsense.js")}"></script>
  ${buildJsonLd(link, titleEn, descEn)}
</head>`;

  const back = LANGS.map(
    (lang) => `<a href="${sitePath(backHub)}" class="lang-${lang}">${BACK[lang]}</a>`
  ).join("\n    ");

  const h1s = LANGS.map((lang) => `<h1 class="lang-${lang}">${escHtml(displayTitle(link, lang))}</h1>`).join("\n  ");
  const cats = LANGS.map((lang) => `<p class="lang-${lang} tool-guide-cat">${escHtml(hubLabel(hub, lang))}</p>`).join("\n    ");
  const bodies = LANGS.map((lang) => `<div class="lang-${lang} article-body brief-body">${buildHubLinkBodyHtml(link, lang)}</div>`).join("\n  ");
  const ctas = LANGS.map((lang) => {
    const label = CTA[lang] || CTA.en;
    return `<p class="lang-${lang} brief-source-cta"><a href="${officialUrl}" rel="noopener noreferrer" target="_blank">${escHtml(label)} →</a></p>`;
  }).join("\n    ");

  const body = `<body class="locale-en">
  <script src="${sitePath("js/i18n.js")}"></script>
  <div class="top">
    ${back}
    <div class="lang-switch">
      <select class="aogl-lang-select" id="aogl-lang-hublink-${slug.replace(/[^a-z0-9-]/gi, "-")}" aria-label="Language"></select>
    </div>
  </div>
  <div class="tool-guide-header">
    <img class="tool-guide-icon" src="${sitePath(faviconSrcForHtml(link.domain))}" width="48" height="48" alt="" loading="lazy" decoding="async">
    <div class="tool-guide-header-text">${h1s}${cats}</div>
  </div>
  ${bodies}
  <div class="brief-source-box">
    <p class="brief-source-label lang-en">Official website</p>
    <p class="brief-source-label lang-zh">官方网站</p>
    ${ctas}
    <p class="brief-source-url"><a href="${officialUrl}" rel="noopener noreferrer" target="_blank">${escHtml(link.url)}</a></p>
  </div>
</body></html>`;

  return head + body;
}

function main() {
  const links = loadAllHubLinks();
  if (!links.length) {
    console.warn("No hub-links — run: node scripts/sync-hub-links.mjs");
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const l of links) {
    fs.writeFileSync(path.join(OUT_DIR, `${l.slug}.html`), buildPage(l), "utf8");
  }
  console.log(`Built ${links.length} hub-link pages in _multilang/hub-links/`);
}

main();
