#!/usr/bin/env node
/**
 * Build _multilang/hub-links/<slug>.html
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { faviconSrcForHtml } from "./favicon-local.mjs";
import {
  HUB_ORDER,
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
  sortHubLinks,
} from "./hub-link-utils.mjs";
import { sitePath } from "./site-paths.mjs";
import { GTAG_SCRIPT } from "./site-head-scripts.mjs";

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
  ${GTAG_SCRIPT}
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

function buildHubLinkIndex(links) {
  const sorted = sortHubLinks(links);
  const byHub = new Map();
  for (const l of sorted) {
    const h = l.hub || "portal";
    if (!byHub.has(h)) byHub.set(h, []);
    byHub.get(h).push(l);
  }

  const sections = HUB_ORDER.filter((h) => byHub.has(h))
    .map((hub) => {
      const items = byHub
        .get(hub)
        .map((l) => {
          const href = escAttr(hubLinkPath(l.slug));
          const titleSpans = LANGS.map((lang) => {
            const t = escHtml(displayTitle(l, lang));
            return `<span class="lang-${lang}">${t}</span>`;
          }).join("");
          const meta = escHtml(l.domain || "");
          return `          <li>
            <a href="${href}">${titleSpans}</a>
            <span class="brief-index-meta">${meta}</span>
          </li>`;
        })
        .join("\n");
      const hubTitles = LANGS.map(
        (lang) => `        <h2 class="hub-index-hub-title lang-${lang}">${escHtml(hubLabel(hub, lang))}</h2>`,
      ).join("\n");
      return `${hubTitles}
        <ul class="brief-index-list hub-index-list">
${items}
        </ul>`;
    })
    .join("\n");

  const dataAttrs = LANGS.map((lang) => {
    const title =
      lang === "zh"
        ? "Hub 书签简介索引"
        : lang === "en"
          ? "Hub bookmark briefs index"
          : "Hub bookmark briefs — aogl.cn";
    const desc =
      lang === "zh"
        ? `${links.length} 条 Hub 外链简介，按栏目分组；每页链至官网。`
        : `${links.length} hub bookmark briefs grouped by category; each page links to the official site.`;
    return `data-title-${lang}="${escAttr(title)} — aogl.cn" data-desc-${lang}="${escAttr(desc)}"`;
  }).join(" ");

  return `<!DOCTYPE html><html lang="en" ${dataAttrs}><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="${sitePath("favicon.svg")}" type="image/svg+xml" sizes="any">
  <meta name="description" content="Index of local hub bookmark briefs on aogl.cn — grouped by portal, brands, shopping, and other hubs.">
  <title>Hub bookmark briefs — aogl.cn</title>
  <link rel="canonical" href="${SITE}/en/hub-links/">
  <meta name="robots" content="index,follow">
  <link rel="stylesheet" href="${sitePath("css/privacy.css")}">
  <link rel="stylesheet" href="${sitePath("css/brief.css")}">
  <script src="${sitePath("js/i18n.js")}"></script>
</head>
<body class="locale-en">
  <div class="top">
    ${LANGS.map((lang) => {
      const label = lang === "zh" ? "← 返回首页" : "← Home";
      return `<a href="${sitePath("index.html")}" class="lang-${lang}">${label}</a>`;
    }).join("\n    ")}
    <div class="lang-switch">
      <select class="aogl-lang-select" id="aogl-lang-hub-index" aria-label="Language"></select>
    </div>
  </div>
  ${LANGS.map((lang) => {
    const h1 = lang === "zh" ? "Hub 书签简介索引" : "Hub bookmark briefs";
    return `<h1 class="lang-${lang}">${h1}</h1>`;
  }).join("\n  ")}
  ${LANGS.map((lang) => {
    const lead =
      lang === "zh"
        ? `共 ${links.length} 条简介页，按 Hub 栏目分组。点击条目进入本站摘要，文末可打开官网。`
        : `${links.length} brief pages grouped by hub category. Open a row for context, then use the official link on that page.`;
    return `<p class="lang-${lang} article-lead">${lead}</p>`;
  }).join("\n  ")}
  <div class="hub-index-sections">
${sections}
  </div>
</body></html>`;
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
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), buildHubLinkIndex(links), "utf8");
  console.log(`Built ${links.length} hub-link pages + index in _multilang/hub-links/`);
}

main();
