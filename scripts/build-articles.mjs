#!/usr/bin/env node
/**
 * Reads data/articles/*.json (each file = one article), writes _multilang/articles/<slug>.html and
 * replaces INDEX_ORIGINALS markers in _multilang/index.html.
 * Order: build-hubs → build-articles → build-index-pills → build-seo-locales.
 *
 * 新增文章：复制 data/articles/velmora.json，改 slug / 日期 / 各语种字段；长正文可放 data/articles/fragments/<slug>-<lang>.html
 * 并在 JSON 里用 htmlFragments 引用。layout: "hub" 为站点顶栏+深色主题；省略 layout 则为短文 privacy.css 模板。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "articles");
const OUT_DIR = path.join(ROOT, "_multilang", "articles");
const INDEX_PATH = path.join(ROOT, "_multilang", "index.html");

const LANGS = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

const SECTION_TITLE = {
  en: "Editorial notes",
  zh: "本站原创",
  ja: "編集メモ",
  ko: "편집 메모",
  fr: "Notes éditoriales",
  ru: "Редакционные заметки",
  ar: "ملاحظات تحريرية",
};

/** Carousel aria-label (matches hub Hot mix pattern). */
const ORIGINALS_ARIA = {
  en: "Editorial notes — swipe or scroll sideways for more",
  zh: "本站原创 — 横向滑动查看更多",
  ja: "編集メモ — 横にスワイプして続きを表示",
  ko: "편집 메모 — 옆으로 밀어 더 보기",
  fr: "Notes éditoriales — faites défiler horizontalement pour en voir plus",
  ru: "Редакционные заметки — прокрутите вбок, чтобы увидеть ещё",
  ar: "ملاحظات تحريرية — مرّر أفقياً لعرض المزيد",
};

const META_DOT = {
  en: " · aogl.cn",
  zh: " · 本站",
  ja: " · 当サイト",
  ko: " · 이 사이트",
  fr: " · aogl.cn",
  ru: " · aogl.cn",
  ar: " · aogl.cn",
};

const BACK_LABEL = {
  en: "← Back to home",
  zh: "← 返回首页",
  ja: "← ホームへ",
  ko: "← 홈으로",
  fr: "← Accueil",
  ru: "← На главную",
  ar: "← العودة للرئيسية",
};

/** Hub-layout article: back link to #originals */
const BACK_ORIGINALS = {
  en: "← Back to home · Editorial originals",
  zh: "← 返回首页 · 本站原创",
  ja: "← ホームへ · オリジナル",
  ko: "← 홈으로 · 오리지널",
  fr: "← Accueil · contenus originaux",
  ru: "← На главную · оригиналы",
  ar: "← الرئيسية · محتوى أصلي",
};

const META_ORIGINAL = {
  en: "aogl.cn original",
  zh: "本站原创",
  ja: "当サイトオリジナル",
  ko: "사이트 오리지널",
  fr: "Original aogl.cn",
  ru: "Оригинал aogl.cn",
  ar: "محتوى أصلي",
};

const BRAND_ALT = {
  en: "aogl.cn — personal bookmarks for generative AI tools and LLM releases",
  zh: "aogl.cn — 生成式 AI 工具与大模型动态（个人书签）",
  ja: "aogl.cn — 生成AIツールの個人用ブックマーク",
  ko: "aogl.cn — 생성형 AI 도구 개인 북마크",
  fr: "aogl.cn — signets personnels pour outils d’IA générative",
  ru: "aogl.cn — личные закладки по инструментам генеративного ИИ",
  ar: "aogl.cn — روابط شخصية لأدوات الذكاء الاصطناعي التوليدي",
};

/** [href, label] — no is-active; matches hub pages */
const HUB_NAV_LINKS = {
  en: [
    ["index.html#tools-directory", "AI frontier"],
    ["portal.html", "Top sites"],
    ["brands.html", "Brands"],
    ["shopping.html", "Shopping"],
    ["life.html", "Life"],
    ["social.html", "Social"],
    ["tech.html", "Tech"],
    ["games.html", "Games"],
    ["tools.html", "Utilities"],
  ],
  zh: [
    ["index.html#tools-directory", "AI 前沿"],
    ["portal.html", "全球站点"],
    ["brands.html", "品牌"],
    ["shopping.html", "购物"],
    ["life.html", "生活"],
    ["social.html", "社交"],
    ["tech.html", "科技"],
    ["games.html", "游戏"],
    ["tools.html", "工具"],
  ],
  ja: [
    ["index.html#tools-directory", "AI最前線"],
    ["portal.html", "主要サイト"],
    ["brands.html", "ブランド"],
    ["shopping.html", "ショッピング"],
    ["life.html", "ライフ"],
    ["social.html", "ソーシャル"],
    ["tech.html", "テック"],
    ["games.html", "ゲーム"],
    ["tools.html", "実用ツール"],
  ],
  ko: [
    ["index.html#tools-directory", "AI 최전선"],
    ["portal.html", "주요 사이트"],
    ["brands.html", "브랜드"],
    ["shopping.html", "쇼핑"],
    ["life.html", "라이프"],
    ["social.html", "소셜"],
    ["tech.html", "테크"],
    ["games.html", "게임"],
    ["tools.html", "실용 도구"],
  ],
  fr: [
    ["index.html#tools-directory", "IA — veille"],
    ["portal.html", "Grands sites"],
    ["brands.html", "Marques"],
    ["shopping.html", "Shopping"],
    ["life.html", "Vie"],
    ["social.html", "Social"],
    ["tech.html", "Tech"],
    ["games.html", "Jeux"],
    ["tools.html", "Utilitaires"],
  ],
  ru: [
    ["index.html#tools-directory", "ИИ — новинки"],
    ["portal.html", "Топ сайтов"],
    ["brands.html", "Бренды"],
    ["shopping.html", "Шопинг"],
    ["life.html", "Сервисы"],
    ["social.html", "Соцсети"],
    ["tech.html", "Техно"],
    ["games.html", "Игры"],
    ["tools.html", "Утилиты"],
  ],
  ar: [
    ["index.html#tools-directory", "أحدث الذكاء الاصطناعي"],
    ["portal.html", "أبرز المواقع"],
    ["brands.html", "العلامات"],
    ["shopping.html", "التسوق"],
    ["life.html", "الحياة الرقمية"],
    ["social.html", "التواصل"],
    ["tech.html", "التقنية"],
    ["games.html", "الألعاب"],
    ["tools.html", "أدوات مساعدة"],
  ],
};

const ARTICLE_SHELL_CSS = `
    .article-shell {
      position: relative;
      z-index: 1;
      max-width: 52rem;
      margin: 0 auto;
      padding: clamp(1rem, 4vw, 2.25rem) clamp(1rem, 3vw, 1.75rem) 3rem;
    }
    .article-shell__top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1rem;
      margin-bottom: 1.75rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .article-shell__top a {
      font-size: 0.95rem;
    }
    .article-shell__header h1 {
      margin: 0 0 0.35rem;
      font-size: clamp(1.35rem, 4vw, 1.85rem);
      line-height: 1.25;
      font-weight: 650;
    }
    .article-shell__sub {
      margin: 0 0 0.5rem;
      font-size: 1.05rem;
      color: var(--accent);
      letter-spacing: 0.02em;
    }
    .article-shell__meta {
      margin: 0 0 1.5rem;
      font-size: 0.88rem;
      color: var(--muted);
    }
    .article-shell__body {
      color: var(--text);
    }
    .article-shell__body h2 {
      margin: 2rem 0 0.75rem;
      font-size: 1.2rem;
      font-weight: 650;
      color: var(--accent);
      border-bottom: 1px solid rgba(125, 211, 252, 0.2);
      padding-bottom: 0.35rem;
    }
    .article-shell__body h2:first-of-type {
      margin-top: 0.5rem;
    }
    .article-shell__body h3 {
      margin: 1.35rem 0 0.5rem;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text);
    }
    .article-shell__body p {
      margin: 0.65rem 0;
      max-width: 48rem;
    }
    .article-shell__body ul {
      margin: 0.5rem 0 0.75rem;
      padding-left: 1.25rem;
      color: var(--muted);
    }
    .article-shell__body ul li {
      margin: 0.35rem 0;
    }
    .article-shell__body ul strong {
      color: var(--text);
    }
    .article-embed {
      margin: 1.25rem 0 1.5rem;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    }
    .article-embed iframe {
      display: block;
      width: 100%;
      height: min(70vh, 560px);
      border: none;
      vertical-align: middle;
    }
    .article-embed figcaption {
      padding: 0.5rem 0.85rem 0.65rem;
      font-size: 0.82rem;
      color: var(--muted);
      border-top: 1px solid var(--border);
      background: rgba(18, 25, 34, 0.65);
    }
    .article-table-wrap {
      margin: 1rem 0 1.25rem;
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    .article-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
    }
    .article-table th,
    .article-table td {
      padding: 0.65rem 0.85rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .article-table th {
      background: rgba(125, 211, 252, 0.08);
      color: var(--accent);
      font-weight: 600;
    }
    .article-table tr:last-child td {
      border-bottom: none;
    }
    .article-table tbody tr:hover td {
      background: rgba(125, 211, 252, 0.04);
    }
`;

const INDEX_START = "      <!-- INDEX_ORIGINALS_AUTO_START -->";
const INDEX_END = "      <!-- INDEX_ORIGINALS_AUTO_END -->";

function suffixForLang(lang) {
  if (lang === "en") return "En";
  if (lang === "zh") return "Zh";
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

function strByLang(article, lang, base) {
  const primary = base + suffixForLang(lang);
  const order = [primary, base + "En", base + "Zh"];
  for (const k of order) {
    const v = article[k];
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return "";
}

function escAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function loadArticles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const list = [];
  for (const f of files) {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
    } catch (e) {
      console.warn("Skip invalid JSON:", f, e.message);
      continue;
    }
    if (!raw || typeof raw !== "object" || !raw.slug) {
      console.warn("Skip (missing slug):", f);
      continue;
    }
    if (raw.htmlFragments && typeof raw.htmlFragments === "object") {
      for (const lang of LANGS) {
        const rel = raw.htmlFragments[lang];
        if (rel == null || String(rel).trim() === "") continue;
        const fp = path.join(DATA_DIR, String(rel).replace(/^\.?\//, ""));
        if (!fp.startsWith(DATA_DIR)) {
          console.warn("Skip fragment (path):", rel);
          continue;
        }
        if (fs.existsSync(fp)) {
          raw["body" + suffixForLang(lang)] = fs.readFileSync(fp, "utf8").trim();
        } else {
          console.warn("Missing htmlFragments file:", rel, "for", raw.slug);
        }
      }
    }
    list.push(raw);
  }
  list.sort((a, b) => String(b.datePublished || "").localeCompare(String(a.datePublished || "")));
  return list;
}

function buildJsonLd(article, titleEn, descEn) {
  const slug = article.slug;
  const canonical = `https://aogl.cn/en/articles/${slug}.html`;
  const obj = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: titleEn,
    datePublished: article.datePublished || "",
    dateModified: article.dateModified || article.datePublished || "",
    author: { "@type": "Organization", name: article.author || "aogl.cn" },
    publisher: { "@type": "Organization", name: "aogl.cn", url: "https://aogl.cn/" },
    mainEntityOfPage: canonical,
    inLanguage: "en",
    description: descEn,
  };
  return `<script type="application/ld+json">\n${JSON.stringify(obj)}\n</script>`;
}

function buildJsonLdHub(article, titleEn, subtitleEn, descEn, titleZh) {
  const slug = article.slug;
  const canonical = `https://aogl.cn/en/articles/${slug}.html`;
  const obj = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: subtitleEn || titleEn,
    alternativeHeadline: titleZh || titleEn,
    datePublished: article.datePublished || "",
    dateModified: article.dateModified || article.datePublished || "",
    author: { "@type": "Organization", name: article.author || "aogl.cn" },
    publisher: { "@type": "Organization", name: "aogl.cn", url: "https://aogl.cn/" },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    url: canonical,
    inLanguage: "mul",
    description: descEn,
    isAccessibleForFree: true,
  };
  return `<script type="application/ld+json">\n${JSON.stringify(obj)}\n</script>`;
}

function absOgImage(article) {
  const h = (article.heroImage || "").trim();
  if (!h) return "https://aogl.cn/og-default.png";
  if (h.startsWith("http://") || h.startsWith("https://")) return h;
  return `https://aogl.cn/${h.replace(/^\.?\//, "")}`;
}

function buildHubBrandBlock(prefix) {
  return LANGS.map((lang) => {
    const alt = BRAND_ALT[lang] || BRAND_ALT.en;
    return `      <h1 class="lang-${lang} brand-logo-heading">
          <a href="https://aogl.cn/" class="brand-logo-link"><img src="${prefix}logo.svg" width="336" height="56" class="brand-logo-img" alt="${escAttr(alt)}" decoding="async"></a>
        </h1>`;
  }).join("\n");
}

function buildHubNavBlock(prefix) {
  const navInner = LANGS.map((lang) => {
    const rows = HUB_NAV_LINKS[lang] || HUB_NAV_LINKS.en;
    const lis = rows
      .map(([href, label]) => `          <li><a href="${prefix}${escAttr(href)}">${escHtml(label)}</a></li>`)
      .join("\n");
    return `        <ul class="site-nav-list lang-${lang}">\n${lis}\n        </ul>`;
  }).join("\n");
  return `      <nav class="site-nav" aria-label="Primary">\n${navInner}\n      </nav>`;
}

const FOOTER_LEGAL = {
  en: [
    ["index.html#intro", "About"],
    ["changelog.html", "Changelog"],
    ["privacy.html", "Privacy"],
  ],
  zh: [
    ["index.html#intro", "关于"],
    ["changelog.html", "更新记录"],
    ["privacy.html", "隐私政策"],
  ],
  ja: [
    ["index.html#intro", "概要"],
    ["changelog.html", "更新履歴"],
    ["privacy.html", "プライバシー"],
  ],
  ko: [
    ["index.html#intro", "소개"],
    ["changelog.html", "변경 기록"],
    ["privacy.html", "개인정보"],
  ],
  fr: [
    ["index.html#intro", "À propos"],
    ["changelog.html", "Mises à jour"],
    ["privacy.html", "Confidentialité"],
  ],
  ru: [
    ["index.html#intro", "О сайте"],
    ["changelog.html", "Обновления"],
    ["privacy.html", "Конфиденциальность"],
  ],
  ar: [
    ["index.html#intro", "حول الموقع"],
    ["changelog.html", "التحديثات"],
    ["privacy.html", "الخصوصية"],
  ],
};

function buildHubFooterBlock(prefix) {
  const legal = LANGS.map((lang) => {
    const triple = FOOTER_LEGAL[lang] || FOOTER_LEGAL.en;
    return triple
      .map(
        ([href, label]) =>
          `        <a href="${prefix}${escAttr(href)}" class="footer-legal-link lang-${lang}">${escHtml(label)}</a>`,
      )
      .join("\n");
  }).join("\n");
  return `  <footer class="site-footer">
    <div class="wrap footer-wrap">
      <div class="footer-top">
        <div class="footer-lang">
          <select class="aogl-lang-select" id="aogl-lang-footer" aria-label="Language"></select>
        </div>
      </div>
      <div class="footer-watermark" aria-hidden="true">
        <img src="${prefix}footer-wordmark-outline.svg" width="448" height="92" class="footer-watermark-svg" alt="" decoding="async" loading="lazy">
      </div>
      <div class="footer-legal">
${legal}
        <span class="footer-copy">© <span id="y"></span> aogl.cn</span>
      </div>
    </div>
  </footer>`;
}

/** BCP-47 + optional dir for hub article body (SEO / typography). */
function articleShellLangAttrs(lang) {
  if (lang === "zh") return ' lang="zh-Hans"';
  if (lang === "ja") return ' lang="ja"';
  if (lang === "ko") return ' lang="ko"';
  if (lang === "fr") return ' lang="fr"';
  if (lang === "ru") return ' lang="ru"';
  if (lang === "ar") return ' lang="ar" dir="rtl"';
  return ' lang="en"';
}

function buildArticlePageHub(article) {
  const slug = article.slug;
  const P = "../";
  const dataAttrs = LANGS.map((lang) => {
    const titleVal = strByLang(article, lang, "title");
    const descVal = strByLang(article, lang, "desc");
    return `data-title-${lang}="${escAttr(titleVal)} — aogl.cn" data-desc-${lang}="${escAttr(descVal)}"`;
  }).join(" ");

  const titleEn = strByLang(article, "en", "title");
  const descEn = strByLang(article, "en", "desc");
  const subtitleEn = strByLang(article, "en", "subtitle");
  const titleZh = strByLang(article, "zh", "title");
  const ogImg = absOgImage(article);
  const ogAlt = escAttr(article.heroImageAlt || strByLang(article, "zh", "title"));

  const headBlock = `<!DOCTYPE html><html lang="en" ${dataAttrs}><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="${P}favicon.svg" type="image/svg+xml" sizes="any">
  <meta name="description" content="${escAttr(descEn)}">
  <title>${escAttr(titleEn)} — aogl.cn</title>
  <link rel="canonical" href="https://aogl.cn/en/articles/${slug}.html">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="author" content="aogl.cn">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://aogl.cn/en/articles/${slug}.html">
  <meta property="og:title" content="${escAttr(titleEn)} — aogl.cn">
  <meta property="og:description" content="${escAttr(descEn)}">
  <meta property="og:site_name" content="aogl.cn">
  <meta property="og:locale" content="en_US">
  <meta property="og:image" content="${escAttr(ogImg)}">
  <meta property="og:image:alt" content="${ogAlt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${escAttr(ogImg)}">
  <link rel="stylesheet" href="${P}css/style.css">
  <link rel="stylesheet" href="${P}css/hub.css">
  <script src="${P}js/adsense.js"></script>
  <style>${ARTICLE_SHELL_CSS}
  </style>
  ${buildJsonLdHub(article, titleEn, subtitleEn, descEn, titleZh)}
</head>`;

  const articleBlocks = LANGS.map((lang) => {
    const inner = strByLang(article, lang, "body");
    const h1t = escHtml(strByLang(article, lang, "title"));
    const sub = strByLang(article, lang, "subtitle");
    const subHtml =
      sub && String(sub).trim() !== "" ? `<p class="article-shell__sub">${escHtml(sub)}</p>` : "";
    const dateIso = escAttr(article.datePublished || "");
    const dateVis = escHtml(article.datePublished || "—");
    const metaOriginal = escHtml(META_ORIGINAL[lang] || META_ORIGINAL.en);
    const back = escHtml(BACK_ORIGINALS[lang] || BACK_ORIGINALS.en);
    const artAttrs = articleShellLangAttrs(lang);
    return `    <div class="lang-${lang}">
      <div class="article-shell__top">
        <a href="${P}index.html#originals">${back}</a>
      </div>
      <div class="article-shell__header">
        <h1>${h1t}</h1>
        ${subHtml}
        <p class="article-shell__meta"><time datetime="${dateIso}">${dateVis}</time> · ${metaOriginal}</p>
      </div>
      <article class="article-shell__body"${artAttrs}>${inner}</article>
    </div>`;
  }).join("\n");

  const body = `<body class="locale-en">
  <canvas id="bg-canvas" class="bg-canvas" aria-hidden="true"></canvas>
  <script src="${P}js/bg-canvas.js"></script>
  <script src="${P}js/i18n.js"></script>
  <header>
    <div class="head-row">
      <div class="brand">
${buildHubBrandBlock(P)}
      </div>
${buildHubNavBlock(P)}
      <div class="lang-switch">
        <select class="aogl-lang-select" id="aogl-lang-header" aria-label="Language"></select>
      </div>
    </div>
  </header>
  <main class="article-shell hub-main wrap" id="main">
${articleBlocks}
  </main>
${buildHubFooterBlock(P)}
  <script src="${P}js/hub-common.js" defer></script>
</body></html>`;

  return headBlock + body;
}

function buildArticlePageEditorial(article) {
  const slug = article.slug;
  const dataAttrs = LANGS.map((lang) => {
    const titleVal = strByLang(article, lang, "title");
    const descVal = strByLang(article, lang, "desc");
    return `data-title-${lang}="${escAttr(titleVal)} — aogl.cn" data-desc-${lang}="${escAttr(descVal)}"`;
  }).join(" ");

  const titleEn = strByLang(article, "en", "title");
  const descEn = strByLang(article, "en", "desc");

  const headBlock = `<!DOCTYPE html><html lang="en" ${dataAttrs}><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml" sizes="any">
  <meta name="description" content="${escAttr(descEn)}">
  <title>${escAttr(titleEn)} — aogl.cn</title>
  <link rel="canonical" href="https://aogl.cn/en/articles/${slug}.html">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://aogl.cn/en/articles/${slug}.html">
  <meta property="og:title" content="${escAttr(titleEn)} — aogl.cn">
  <meta property="og:description" content="${escAttr(descEn)}">
  <meta property="og:image" content="https://aogl.cn/og-default.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1536">
  <meta property="og:image:height" content="1024">
  <meta property="og:image:alt" content="aogl.cn">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://aogl.cn/og-default.png">
  <link rel="stylesheet" href="../css/privacy.css">
  ${buildJsonLd(article, titleEn, descEn)}
</head>`;

  const back = LANGS.map((lang) => `<a href="../index.html" class="lang-${lang}">${BACK_LABEL[lang]}</a>`).join("\n    ");

  const h1s = LANGS.map((lang) => {
    const h = strByLang(article, lang, "title");
    return `<h1 class="lang-${lang}">${escHtml(h)}</h1>`;
  }).join("\n  ");

  const metaLine = LANGS.map((lang) => {
    const d = strByLang(article, lang, "desc");
    return `<p class="lang-${lang} article-lead">${escHtml(d)}</p>`;
  }).join("\n  ");

  const bodies = LANGS.map((lang) => {
    const inner = strByLang(article, lang, "body");
    return `<div class="lang-${lang} article-body">${inner}</div>`;
  }).join("\n  ");

  const dateIso = escAttr(article.datePublished || "");
  const dateVis = escHtml(article.datePublished || "—");

  const body = `<body class="locale-en">
  <script src="../js/i18n.js"></script>
  <div class="top">
    ${back}
    <div class="lang-switch">
      <select class="aogl-lang-select" id="aogl-lang-article-${slug.replace(/[^a-z0-9-]/gi, "-")}" aria-label="Language"></select>
    </div>
  </div>
  ${h1s}
  <p class="article-dates lang-en"><time datetime="${dateIso}">${dateVis}</time></p>
  <p class="article-dates lang-zh"><time datetime="${dateIso}">${dateVis}</time></p>
  <p class="article-dates lang-ja"><time datetime="${dateIso}">${dateVis}</time></p>
  <p class="article-dates lang-ko"><time datetime="${dateIso}">${dateVis}</time></p>
  <p class="article-dates lang-fr"><time datetime="${dateIso}">${dateVis}</time></p>
  <p class="article-dates lang-ru"><time datetime="${dateIso}">${dateVis}</time></p>
  <p class="article-dates lang-ar"><time datetime="${dateIso}">${dateVis}</time></p>
  ${metaLine}
  ${bodies}
</body></html>`;

  return headBlock + body;
}

function buildArticlePage(article) {
  if (article.layout === "hub") return buildArticlePageHub(article);
  return buildArticlePageEditorial(article);
}

function heroSrc(article) {
  const h = (article.heroImage || "").trim();
  if (!h) return "../og-default.png";
  if (h.startsWith("http://") || h.startsWith("https://")) return h;
  if (h.startsWith("/")) return h;
  if (h.startsWith("../")) return h;
  return "../" + h.replace(/^\.?\//, "");
}

/** Home index lives at site root — teaser images must not use ../ (would escape the site folder). */
function teaserHeroSrc(article) {
  const h = (article.heroImage || "").trim();
  if (!h) return "og-default.png";
  if (h.startsWith("http://") || h.startsWith("https://")) return h;
  if (h.startsWith("/")) return h;
  return h.replace(/^\.?\//, "");
}

function buildOriginalsCards(slice) {
  return slice
    .map((a) => {
      const img = escAttr(teaserHeroSrc(a));
      const titleSpans = LANGS.map((lang) => {
        const title = strByLang(a, lang, "title");
        return `<span class="lang-${lang}">${escHtml(title)}</span>`;
      }).join("");
      const excerptSpans = LANGS.map((lang) => {
        const ex = strByLang(a, lang, "indexExcerpt");
        return `<span class="lang-${lang}">${escHtml(ex)}</span>`;
      }).join("");
      const dVis = escHtml(a.datePublished || "—");
      const metaSpans = LANGS.map((lang) => {
        return `<span class="lang-${lang}">${dVis}${META_DOT[lang]}</span>`;
      }).join("");
      return `        <li class="hub-hotmix-card">
          <a class="hub-hotmix-card-link" href="articles/${a.slug}.html" draggable="false">
            <div class="hub-hotmix-card-media">
              <img class="hub-hotmix-card-img" src="${img}" width="400" height="225" alt="" loading="lazy" decoding="async" draggable="false">
            </div>
            <div class="hub-hotmix-card-body">
              <div class="hub-hotmix-card-titles">${titleSpans}</div>
              <div class="originals-card-excerpt">${excerptSpans}</div>
              <div class="hub-hotmix-card-meta">${metaSpans}</div>
            </div>
          </a>
        </li>`;
    })
    .join("\n");
}

function originalsCarouselUl(slice) {
  const items = buildOriginalsCards(slice);
  return `        <ul class="hub-hotmix-cards hub-hotmix-cards--carousel site-originals-hotmix" role="list" aria-label="${escAttr(ORIGINALS_ARIA.en)}">
${items}
        </ul>`;
}

function buildIndexBlock(articles, max = 5) {
  const slice = articles.slice(0, max);
  if (slice.length === 0) {
    return `${INDEX_START}
      <section id="originals" class="site-originals" aria-labelledby="originals-title">
        <h2 id="originals-title" class="page-section-title lang-en">${SECTION_TITLE.en}</h2>
        <h2 class="page-section-title lang-zh">${SECTION_TITLE.zh}</h2>
        <h2 class="page-section-title lang-ja">${SECTION_TITLE.ja}</h2>
        <h2 class="page-section-title lang-ko">${SECTION_TITLE.ko}</h2>
        <h2 class="page-section-title lang-fr">${SECTION_TITLE.fr}</h2>
        <h2 class="page-section-title lang-ru">${SECTION_TITLE.ru}</h2>
        <h2 class="page-section-title lang-ar">${SECTION_TITLE.ar}</h2>
        <p class="reading-intro lang-en">No editorial notes yet.</p>
        <p class="reading-intro lang-zh">暂无原创备忘。</p>
        <p class="reading-intro lang-ja">まだメモはありません。</p>
        <p class="reading-intro lang-ko">아직 메모가 없습니다.</p>
        <p class="reading-intro lang-fr">Pas encore de notes.</p>
        <p class="reading-intro lang-ru">Пока нет заметок.</p>
        <p class="reading-intro lang-ar">لا توجد ملاحظات بعد.</p>
      </section>
${INDEX_END}`;
  }

  const titleBlock = LANGS.map((l, i) => {
    const id = i === 0 ? ' id="originals-title"' : "";
    return `        <h2${id} class="page-section-title lang-${l}">${SECTION_TITLE[l]}</h2>`;
  }).join("\n");

  const carousel = originalsCarouselUl(slice);

  return `${INDEX_START}
      <section id="originals" class="site-originals" aria-labelledby="originals-title">
${titleBlock}
${carousel}
      </section>
${INDEX_END}`;
}

function main() {
  const articles = loadArticles();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const a of articles) {
    const file = path.join(OUT_DIR, `${a.slug}.html`);
    fs.writeFileSync(file, buildArticlePage(a), "utf8");
    console.log("Wrote _multilang/articles/" + a.slug + ".html");
  }

  let index = fs.readFileSync(INDEX_PATH, "utf8");
  const re = /[\t ]*<!-- INDEX_ORIGINALS_AUTO_START -->[\s\S]*?<!-- INDEX_ORIGINALS_AUTO_END -->/;
  if (!re.test(index)) {
    throw new Error("INDEX_ORIGINALS markers missing in _multilang/index.html");
  }
  index = index.replace(re, buildIndexBlock(articles));
  fs.writeFileSync(INDEX_PATH, index, "utf8");
  console.log("Updated INDEX_ORIGINALS in _multilang/index.html (" + articles.length + " article(s))");
}

main();
