/**
 * Static hub pages (门户 / 品牌 / …) from data/hubs/*.json
 *
 * SEO: generated HTML contains all outbound links and copy in the DOM (no empty shells).
 * "自动资讯": maintain news in JSON; optional future step — node fetch RSS in a separate
 * script and merge into these JSON files, then re-run: npm run build-hubs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HUB_DIR = path.join(ROOT, "data", "hubs");
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const BASE = String(SITE.siteUrl || "https://aogl.cn").replace(/\/$/, "");

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Omit empty lead paragraphs so pages stay minimal. */
function hubLeadBlock(en, zh) {
  const e = String(en ?? "").trim();
  const z = String(zh ?? "").trim();
  if (!e && !z) return "";
  return `      <p class="hub-screen-lead"><span class="lang-en">${esc(e)}</span><span class="lang-zh">${esc(z)}</span></p>
`;
}

function editorialBlocks(htmlEn, htmlZh) {
  const e = String(htmlEn ?? "").trim();
  const z = String(htmlZh ?? "").trim();
  if (!e && !z) return "";
  let out = "";
  if (e) out += `      <div class="lang-en hub-prose">${htmlEn}</div>\n`;
  if (z) out += `      <div class="lang-zh hub-prose">${htmlZh}</div>\n`;
  return out;
}

function faviconUrl(domain) {
  const d = String(domain || "").replace(/^www\./, "");
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=64`;
}

const NAV = [
  { href: "index.html#tools-directory", file: null, en: "AI tools", zh: "AI 工具" },
  { href: "portal.html", file: "portal.html", en: "Top sites", zh: "全球站点" },
  { href: "brands.html", file: "brands.html", en: "Brands", zh: "品牌" },
  { href: "shopping.html", file: "shopping.html", en: "Shopping", zh: "购物" },
  { href: "life.html", file: "life.html", en: "Life", zh: "生活" },
  { href: "social.html", file: "social.html", en: "Social", zh: "社交" },
  { href: "tech.html", file: "tech.html", en: "Tech", zh: "科技" },
  { href: "games.html", file: "games.html", en: "Games", zh: "游戏" },
];

function navHtml(activeFile) {
  function lisForLang(lang) {
    return NAV.map((n) => {
      const isActive = n.file != null && n.file === activeFile;
      const cur = isActive ? ' class="is-active"' : "";
      const label = lang === "en" ? n.en : n.zh;
      return `          <li${cur}><a href="${esc(n.href)}">${esc(label)}</a></li>`;
    }).join("\n");
  }
  return `        <ul class="site-nav-list lang-en">
${lisForLang("en")}
        </ul>
        <ul class="site-nav-list lang-zh">
${lisForLang("zh")}
        </ul>`;
}

function jsonLdItemList(name, items) {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name || it.nameEn || it.titleEn,
      url: it.url,
    })),
  };
}

function renderPage(spec, activeFile) {
  const top10 = spec.top10 || [];
  const newsGroups = spec.newsGroups || [];
  const more = spec.more || [];
  const canonical = BASE + (spec.path || `/${activeFile}`);

  const graph = [
    {
      "@type": "WebPage",
      "@id": canonical + "#webpage",
      url: canonical,
      name: spec.titleEn,
      description: spec.descEn,
      inLanguage: ["en", "zh-CN"],
      isPartOf: { "@type": "WebSite", "@id": BASE + "/#website", name: "aogl.cn", url: BASE + "/" },
    },
    jsonLdItemList(`${spec.h1En} — top 10`, top10.map((t) => ({ name: t.nameEn, url: t.url }))),
  ];

  const top10Lis = top10
    .map(
      (t, i) => `          <li class="hub-rank-item">
            <a class="hub-rank-link" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">
              <span class="hub-rank-num">${i + 1}</span>
              <img class="hub-favicon" src="${esc(faviconUrl(t.domain))}" width="40" height="40" alt="" loading="lazy" decoding="async" data-domain="${esc(t.domain)}" />
              <span class="hub-rank-text"><span class="lang-en">${esc(t.nameEn)}</span><span class="lang-zh">${esc(t.nameZh)}</span></span>
            </a>
          </li>`
    )
    .join("\n");

  const newsBlocks = newsGroups
    .map(
      (g) => `        <section class="hub-news-group" aria-labelledby="${esc(g.id)}">
          <h3 id="${esc(g.id)}" class="hub-news-group-title"><span class="lang-en">${esc(g.labelEn)}</span><span class="lang-zh">${esc(g.labelZh)}</span></h3>
          <ul class="hub-news-list">
${(g.items || [])
  .map(
    (it) => `            <li>
              <a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer"><span class="lang-en">${esc(it.titleEn)}</span><span class="lang-zh">${esc(it.titleZh)}</span></a>
              <span class="hub-news-meta">${esc(it.date || "")}</span>
            </li>`
  )
  .join("\n")}
          </ul>
        </section>`
    )
    .join("\n");

  const moreLis = more
    .map(
      (t) => `          <li class="hub-more-item">
            <a class="hub-more-link" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">
              <img class="hub-favicon hub-favicon-sm" src="${esc(faviconUrl(t.domain))}" width="28" height="28" alt="" loading="lazy" decoding="async" />
              <span class="lang-en">${esc(t.nameEn)}</span><span class="lang-zh">${esc(t.nameZh)}</span>
            </a>
          </li>`
    )
    .join("\n");

  const pageJs = spec.pageScript || `js/pages/${spec.slug}.js`;

  return `<!DOCTYPE html>
<html
  lang="en"
  data-title-en="${esc(spec.titleEn)}"
  data-title-zh="${esc(spec.titleZh)}"
  data-desc-en="${esc(spec.descEn)}"
  data-desc-zh="${esc(spec.descZh)}"
>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" sizes="any" />
  <meta name="description" content="${esc(spec.descEn)}" />
  <title>${esc(spec.titleEn)}</title>
  <link rel="canonical" href="${esc(canonical)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta name="author" content="aogl.cn" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:title" content="${esc(spec.titleEn)}" />
  <meta property="og:description" content="${esc(spec.descEn)}" />
  <meta property="og:site_name" content="aogl.cn" />
  <meta property="og:image" content="${esc(BASE + "/og-default.png")}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:locale:alternate" content="zh_CN" />
  <script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}
  </script>
  <link rel="stylesheet" href="css/style.css" />
  <link rel="stylesheet" href="css/hub.css" />
  <script src="js/adsense.js"></script>
</head>
<body class="locale-en">
  <canvas id="bg-canvas" class="bg-canvas" aria-hidden="true"></canvas>
  <script src="js/bg-canvas.js"></script>
  <script src="js/i18n.js"></script>
  <header>
    <div class="head-row">
      <div class="brand">
        <h1 class="lang-en brand-logo-heading">
          <a href="${esc(BASE)}/" class="brand-logo-link"
            ><img src="logo.svg" width="336" height="56" class="brand-logo-img" alt="aogl.cn — personal bookmarks for generative AI tools and LLM releases" decoding="async" /></a>
        </h1>
        <h1 class="lang-zh brand-logo-heading">
          <a href="${esc(BASE)}/" class="brand-logo-link"
            ><img src="logo.svg" width="336" height="56" class="brand-logo-img" alt="aogl.cn — 生成式 AI 工具与大模型动态（个人书签）" decoding="async" /></a>
        </h1>
      </div>
      <nav class="site-nav" aria-label="Primary">
${navHtml(activeFile)}
      </nav>
      <div class="lang-switch" role="group" aria-label="Language">
        <button type="button" id="btn-en" aria-pressed="true">English</button>
        <button type="button" id="btn-zh" aria-pressed="false">中文</button>
      </div>
    </div>
  </header>

  <main class="hub-main wrap" id="main">
    <article class="hub-editorial prose-block">
      <h1 class="hub-page-title"><span class="lang-en">${esc(spec.h1En)}</span><span class="lang-zh">${esc(spec.h1Zh)}</span></h1>
      <p class="hub-updated"><span class="lang-en">Updated ${esc(spec.updated)}</span><span class="lang-zh">更新 ${esc(spec.updated)}</span></p>
${editorialBlocks(spec.editorialHtmlEn, spec.editorialHtmlZh)}    </article>

    <section class="hub-screen hub-screen-rank" id="rank" aria-labelledby="hub-rank-title">
      <h2 id="hub-rank-title" class="page-section-title"><span class="lang-en">${esc(spec.rankTitleEn)}</span><span class="lang-zh">${esc(spec.rankTitleZh)}</span></h2>
${hubLeadBlock(spec.rankLeadEn, spec.rankLeadZh)}      <ol class="hub-rank-grid">
${top10Lis}
      </ol>
    </section>

    <section class="hub-screen hub-screen-news" id="news" aria-labelledby="hub-news-title">
      <h2 id="hub-news-title" class="page-section-title"><span class="lang-en">${esc(spec.newsTitleEn)}</span><span class="lang-zh">${esc(spec.newsTitleZh)}</span></h2>
${hubLeadBlock(spec.newsLeadEn, spec.newsLeadZh)}      <div class="hub-news-wrap">
${newsBlocks}
      </div>
    </section>

    <section class="hub-screen hub-screen-more" id="more" aria-labelledby="hub-more-title">
      <h2 id="hub-more-title" class="page-section-title"><span class="lang-en">${esc(spec.moreTitleEn)}</span><span class="lang-zh">${esc(spec.moreTitleZh)}</span></h2>
${hubLeadBlock(spec.moreLeadEn, spec.moreLeadZh)}      <ul class="hub-more-grid">
${moreLis}
      </ul>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-wrap">
      <div class="footer-top">
        <div class="footer-lang" role="group" aria-label="Language">
          <button type="button" id="footer-btn-en" class="footer-lang-btn" aria-pressed="true">English</button>
          <button type="button" id="footer-btn-zh" class="footer-lang-btn" aria-pressed="false">中文</button>
        </div>
      </div>
      <div class="footer-watermark" aria-hidden="true">
        <img
          src="footer-wordmark-outline.svg"
          width="448"
          height="92"
          class="footer-watermark-svg"
          alt=""
          decoding="async"
          loading="lazy"
        />
      </div>
      <div class="footer-legal">
        <a href="index.html#intro" class="footer-legal-link lang-en">About</a>
        <a href="index.html#intro" class="footer-legal-link lang-zh">关于</a>
        <a href="privacy.html" class="footer-legal-link lang-en">Privacy</a>
        <a href="privacy.html" class="footer-legal-link lang-zh">隐私政策</a>
        <span class="footer-copy">© <span id="y"></span> aogl.cn</span>
      </div>
    </div>
  </footer>
  <script src="js/hub-common.js" defer></script>
  <script src="${esc(pageJs)}" defer></script>
</body>
</html>
`;
}

function loadSpecs() {
  const files = fs.readdirSync(HUB_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const spec = JSON.parse(fs.readFileSync(path.join(HUB_DIR, f), "utf8"));
    if (!spec.slug || !spec.outFile) throw new Error(`Invalid hub spec: ${f}`);
    return spec;
  });
}

function main() {
  if (!fs.existsSync(HUB_DIR)) fs.mkdirSync(HUB_DIR, { recursive: true });
  const specs = loadSpecs();
  for (const spec of specs) {
    const html = renderPage(spec, spec.outFile);
    fs.writeFileSync(path.join(ROOT, spec.outFile), html, "utf8");
    console.log("Wrote", spec.outFile);
  }
}

main();
