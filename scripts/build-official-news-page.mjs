#!/usr/bin/env node
/**
 * Builds _multilang/official-news.html — full headline index (links to local briefs).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { footerFriendLinkHtml } from "./footer-friend-link.mjs";
import {
  ROOT,
  escapeHtml,
  loadCategoryData,
  loadReadingData,
  loadSiteConfig,
  renderCategoryFeeds,
  renderOfficialNewsJsonLd,
  renderReadingSection,
} from "./official-feeds-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "_multilang", "official-news.html");
const LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

function esc(s) {
  return escapeHtml(s);
}

function footerLegal() {
  const about = LOCALES.map(
    (code) =>
      `        <a href="about.html" class="footer-legal-link lang-${code}">${esc(
        code === "en" ? "About" : code === "zh" ? "关于" : "About"
      )}</a>`
  ).join("\n");
  const contact = LOCALES.map(
    (code) =>
      `        <a href="contact.html" class="footer-legal-link lang-${code}">${esc(
        code === "en" ? "Contact" : code === "zh" ? "联系我们" : "Contact"
      )}</a>`
  ).join("\n");
  const log = LOCALES.map(
    (code) =>
      `        <a href="changelog.html" class="footer-legal-link lang-${code}">${esc(
        code === "en" ? "Changelog" : code === "zh" ? "更新记录" : "Changelog"
      )}</a>`
  ).join("\n");
  const priv = LOCALES.map(
    (code) =>
      `        <a href="privacy.html" class="footer-legal-link lang-${code}">${esc(
        code === "en" ? "Privacy" : code === "zh" ? "隐私政策" : "Privacy"
      )}</a>`
  ).join("\n");
  return about + "\n" + contact + "\n" + log + "\n" + priv + "\n" + footerFriendLinkHtml(LOCALES, esc);
}

function main() {
  const config = loadSiteConfig();
  const base = String(config.siteUrl || "https://aogl.cn").replace(/\/$/, "");
  const categories = loadCategoryData();
  const reading = loadReadingData();
  const items = reading.items || [];

  const catHtml = renderCategoryFeeds(categories, { itemLimit: 0, includeLeads: true, wrapId: "official-feeds" });
  const readingHtml = renderReadingSection(items);
  const jsonLd = renderOfficialNewsJsonLd(base, items);

  const html = `<!DOCTYPE html>
<html lang="en" data-title-en="Official AI feeds — aogl.cn" data-title-zh="官方动态速览 — aogl.cn" data-desc-en="Headlines from OpenAI, Anthropic, and Google DeepMind — local briefs on aogl.cn with links to originals." data-desc-zh="OpenAI、Anthropic、Google DeepMind 官方动态；本站速览页收录，文末链出原文。">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" sizes="any" />
  <meta name="description" content="OpenAI、Anthropic、Google DeepMind 官方动态；本站速览页收录，文末链出原文。" />
  <title>官方动态速览 — aogl.cn</title>
  <link rel="canonical" href="${esc(base)}/official-news.html" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${esc(base)}/official-news.html" />
  <meta property="og:site_name" content="aogl.cn" />
  <meta property="og:image" content="${esc(base)}/og-default.png" />
  <link rel="stylesheet" href="css/style.css" />
  <script src="js/adsense.js"></script>
  <!-- JSONLD_OFFICIAL_NEWS_START -->
${jsonLd}
  <!-- JSONLD_OFFICIAL_NEWS_END -->
</head>
<body class="locale-en">
  <script src="js/i18n.js"></script>
  <header>
    <div class="head-row wrap">
      <div class="brand">
        <h1 class="lang-en brand-logo-heading"><a href="index.html" class="brand-logo-link"><img src="logo.svg" width="336" height="56" class="brand-logo-img" alt="aogl.cn" decoding="async" /></a></h1>
        <h1 class="lang-zh brand-logo-heading"><a href="index.html" class="brand-logo-link"><img src="logo.svg" width="336" height="56" class="brand-logo-img" alt="aogl.cn" decoding="async" /></a></h1>
      </div>
      <div class="lang-switch">
        <select class="aogl-lang-select" id="aogl-lang-header" aria-label="Language"></select>
      </div>
    </div>
  </header>
  <main class="wrap">
    <p class="reading-intro lang-en"><a href="index.html">← Back to home</a> · Editorial originals stay on the homepage.</p>
    <p class="reading-intro lang-zh"><a href="index.html">← 返回首页</a> · 本站原创手记仍在首页展示。</p>
    <h1 class="page-section-title lang-en">Official AI feeds (outbound)</h1>
    <h1 class="page-section-title lang-zh">官方动态（外链索引）</h1>
    <p class="reading-intro lang-en">Title-only index from vendor blogs. We do not mirror full articles; each link opens the publisher site. For AdSense and copyright reasons this list lives on its own page.</p>
    <p class="reading-intro lang-zh">以下为各机构官网博文<strong>标题索引</strong>，本站不转载全文；点击将在新标签页打开原文。为减少首页外链密度，完整列表集中在本页。</p>
${catHtml}
${readingHtml}
  </main>
  <footer class="site-footer">
    <div class="wrap footer-wrap">
      <div class="footer-top">
        <div class="footer-lang">
          <select class="aogl-lang-select" id="aogl-lang-footer" aria-label="Language"></select>
        </div>
      </div>
      <div class="footer-legal">
${footerLegal()}
        <span class="footer-copy">© <span id="y"></span> aogl.cn</span>
      </div>
    </div>
  </footer>
</body>
</html>
`;

  fs.writeFileSync(OUT, html, "utf8");
  console.log("Wrote _multilang/official-news.html");
}

main();
