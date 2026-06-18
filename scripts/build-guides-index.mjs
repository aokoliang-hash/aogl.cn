#!/usr/bin/env node
/**
 * Build _multilang/guides/index.html — tool-guides directory with site nav.
 * See docs/流量增长与栏目整改实施方案.md
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { navBlock } from "./site-nav.mjs";
import { GTAG_SCRIPT } from "./site-head-scripts.mjs";
import { loadAllToolGuides, LANGS, escAttr, escHtml } from "./tool-guide-utils.mjs";
import { footerFriendLinkHtml } from "./footer-friend-link.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "_multilang", "guides");
const P = "/";

const H1 = {
  en: "AI tool guides & workflow notes",
  zh: "AI 工具攻略与工作流备忘",
  ja: "AIツールガイド",
  ko: "AI 도구 가이드",
  fr: "Guides outils IA",
  ru: "Гайды по ИИ‑инструментам",
  ar: "أدلة أدوات الذكاء الاصطناعي",
};

const LEAD = {
  en: "Personal bookmark workflows for Claude, Cursor, Midjourney, ChatGPT, and 50+ generative AI tools—official links plus maintainer notes, not paid reviews. Full categorized list: <a href=\"/index.html#tools-directory\">AI tools on the home page</a>. Playable demos: <a href=\"/articles/index.html\">editorial articles</a>.",
  zh: "Claude、Cursor、Midjourney、ChatGPT 等 50+ 生成式 AI 工具的个人书签与工作流备忘，附官方入口，非商业评测。完整分类见<a href=\"/index.html#tools-directory\">首页 AI 工具</a>；可玩 Demo 见<a href=\"/articles/index.html\">原创文章</a>。",
  ja: "ホームの AI ツール一覧にある各製品の個人メモと公式リンクです（有料レビューではありません）。<a href=\"/index.html#tools-directory\">ホームの AI ツール</a>・<a href=\"/articles/index.html\">編集記事</a>も参照。",
  ko: "홈 AI 도구 목록의 각 제품에 대한 개인 메모와 공식 링크입니다(유료 리뷰 아님). <a href=\"/index.html#tools-directory\">홈 AI 도구</a>·<a href=\"/articles/index.html\">편집 글</a> 참고.",
  fr: "Notes d’usage personnel et liens officiels pour chaque outil du répertoire d’accueil — pas d’avis sponsorisés. Liste complète : <a href=\"/index.html#tools-directory\">outils IA sur l’accueil</a> ; démos : <a href=\"/articles/index.html\">articles éditoriaux</a>.",
  ru: "Личные заметки и официальные ссылки по каждому инструменту из каталога на главной — не платные обзоры. Полный список: <a href=\"/index.html#tools-directory\">ИИ на главной</a>; демо: <a href=\"/articles/index.html\">статьи</a>.",
  ar: "ملاحظات استخدام شخصية وروابط رسمية لكل أداة في دليل الصفحة الرئيسية — وليست مراجعات مدفوعة. القائمة الكاملة: <a href=\"/index.html#tools-directory\">أدوات الذكاء في الرئيسية</a>؛ العروض: <a href=\"/articles/index.html\">مقالات تحريرية</a>.",
};

const CAT_FALLBACK = {
  en: "Other tools",
  zh: "其他工具",
  ja: "その他",
  ko: "기타",
  fr: "Autres",
  ru: "Прочее",
  ar: "أخرى",
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

function groupGuides(guides) {
  const map = new Map();
  for (const g of guides) {
    const key = g.category_id || "other";
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        titleEn: g.category_title_en || CAT_FALLBACK.en,
        titleZh: g.category_title_zh || CAT_FALLBACK.zh,
        items: [],
      });
    }
    map.get(key).items.push(g);
  }
  return [...map.values()].sort((a, b) => a.titleEn.localeCompare(b.titleEn));
}

function brandBlock() {
  return LANGS.map((code) => {
    const alt = BRAND_ALT[code] || BRAND_ALT.en;
    return `        <h1 class="lang-${code} brand-logo-heading">
          <a href="${P}" class="brand-logo-link"><img src="${P}logo.svg" width="336" height="56" class="brand-logo-img" alt="${escAttr(alt)}" decoding="async"></a>
        </h1>`;
  }).join("\n");
}

function categorySection(cat) {
  const h2 = LANGS.map(
    (lang) =>
      `          <span class="lang-${lang}">${escHtml(lang === "zh" ? cat.titleZh : cat.titleEn)}</span>`,
  ).join("");
  const lis = cat.items
    .map((g) => {
      const names = LANGS.map(
        (lang) =>
          `              <span class="lang-${lang}">${escHtml(lang === "zh" ? g.name_zh || g.name_en : g.name_en)}</span>`,
      ).join("");
      return `        <li class="guides-index-item">
          <a href="${P}tool-guides/${escAttr(g.slug)}.html">${names}</a>
        </li>`;
    })
    .join("\n");
  return `      <section class="guides-index-cat" aria-labelledby="guides-cat-${escAttr(cat.id)}">
        <h2 id="guides-cat-${escAttr(cat.id)}" class="page-section-title guides-index-cat-title">${h2}</h2>
        <ul class="guides-index-list" role="list">
${lis}
        </ul>
      </section>`;
}

function main() {
  const guides = loadAllToolGuides();
  if (guides.length === 0) {
    console.warn("No tool guides — run: npm run sync-tool-guides");
    return;
  }

  const groups = groupGuides(guides);
  const count = guides.length;
  const lastmod = new Date().toISOString().slice(0, 10);

  const dataAttrs = LANGS.map((lang) => {
    const title = H1[lang] || H1.en;
    const desc = LEAD[lang].replace(/<[^>]+>/g, "").slice(0, 160);
    return `data-title-${lang}="${escAttr(title)} — aogl.cn" data-desc-${lang}="${escAttr(desc)}"`;
  }).join(" ");

  const h1Block = LANGS.map((lang) => `        <h1 class="lang-${lang} hub-page-title">${escHtml(H1[lang])}</h1>`).join("\n");
  const leadBlock = LANGS.map(
    (lang) => `        <p class="lang-${lang} hub-prose guides-index-lead">${LEAD[lang]} (${count})</p>`,
  ).join("\n");

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: H1.en,
    description: LEAD.en.replace(/<[^>]+>/g, ""),
    url: "https://aogl.cn/en/guides/index.html",
    inLanguage: "mul",
    numberOfItems: count,
    isPartOf: { "@type": "WebSite", name: "aogl.cn", url: "https://aogl.cn/" },
  });

  const footerLegal = LANGS.map((lang) => {
    const links =
      lang === "zh"
        ? [
            ["about.html", "关于"],
            ["contact.html", "联系"],
            ["changelog.html", "更新"],
          ]
        : [
            ["about.html", "About"],
            ["contact.html", "Contact"],
            ["changelog.html", "Changelog"],
          ];
    return links
      .map(
        ([href, label]) =>
          `        <a href="${P}${escAttr(href)}" class="footer-legal-link lang-${lang}">${escHtml(label)}</a>`,
      )
      .join("\n");
  }).join("\n");
  const friend = footerFriendLinkHtml(LANGS, escHtml);

  const html = `<!DOCTYPE html><html lang="en" ${dataAttrs}><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="${P}favicon.svg" type="image/svg+xml" sizes="any">
  <meta name="description" content="${escAttr(LEAD.en.replace(/<[^>]+>/g, "").slice(0, 160))}">
  <title>${escAttr(H1.en)} — aogl.cn</title>
  <link rel="canonical" href="https://aogl.cn/en/guides/index.html">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="author" content="aogl.cn">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://aogl.cn/en/guides/index.html">
  <meta property="og:title" content="${escAttr(H1.en)} — aogl.cn">
  <meta property="og:description" content="${escAttr(LEAD.en.replace(/<[^>]+>/g, "").slice(0, 160))}">
  <meta property="og:site_name" content="aogl.cn">
  <meta property="og:image" content="https://aogl.cn/og-default.png">
  <link rel="stylesheet" href="${P}css/style.css">
  <link rel="stylesheet" href="${P}css/hub.css">
  <link rel="stylesheet" href="${P}css/article-hub.css">
  ${GTAG_SCRIPT}
  <script src="${P}js/adsense.js"></script>
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body class="locale-en">
  <canvas id="bg-canvas" class="bg-canvas" aria-hidden="true"></canvas>
  <script src="${P}js/bg-canvas.js"></script>
  <script src="${P}js/i18n.js"></script>
  <header>
    <div class="head-row">
      <div class="brand">
${brandBlock()}
      </div>
${navBlock({ prefix: P, activeContext: "tools" })}
      <div class="lang-switch">
        <select class="aogl-lang-select" id="aogl-lang-header" aria-label="Language"></select>
      </div>
    </div>
  </header>
  <main class="hub-main wrap guides-index-main" id="main">
    <article class="hub-editorial prose-block">
      <p class="lang-en guides-index-back"><a href="${P}index.html#tools-directory">← Home · AI tools</a></p>
      <p class="lang-zh guides-index-back"><a href="${P}index.html#tools-directory">← 返回首页 · AI 工具</a></p>
      <p class="lang-ja guides-index-back"><a href="${P}index.html#tools-directory">← ホーム · AIツール</a></p>
      <p class="lang-ko guides-index-back"><a href="${P}index.html#tools-directory">← 홈 · AI 도구</a></p>
      <p class="lang-fr guides-index-back"><a href="${P}index.html#tools-directory">← Accueil · outils IA</a></p>
      <p class="lang-ru guides-index-back"><a href="${P}index.html#tools-directory">← Главная · ИИ‑инструменты</a></p>
      <p class="lang-ar guides-index-back"><a href="${P}index.html#tools-directory">← الرئيسية · أدوات الذكاء</a></p>
${h1Block}
      <p class="hub-updated lang-en">Updated ${lastmod}</p>
      <p class="hub-updated lang-zh">更新 ${lastmod}</p>
      <p class="hub-updated lang-ja">更新 ${lastmod}</p>
      <p class="hub-updated lang-ko">업데이트 ${lastmod}</p>
      <p class="hub-updated lang-fr">Mise à jour ${lastmod}</p>
      <p class="hub-updated lang-ru">Обновлено ${lastmod}</p>
      <p class="hub-updated lang-ar">تحديث ${lastmod}</p>
${leadBlock}
    </article>
    <div class="guides-index-sections">
${groups.map(categorySection).join("\n")}
    </div>
  </main>
  <footer class="site-footer">
    <div class="wrap footer-wrap">
      <div class="footer-top">
        <div class="footer-lang">
          <select class="aogl-lang-select" id="aogl-lang-footer" aria-label="Language"></select>
        </div>
      </div>
      <div class="footer-watermark" aria-hidden="true">
        <img src="${P}footer-wordmark-outline.svg" width="448" height="92" class="footer-watermark-svg" alt="" decoding="async" loading="lazy">
      </div>
      <div class="footer-legal">
${footerLegal}
${friend}
        <span class="footer-copy">© <span id="y"></span> aogl.cn</span>
      </div>
    </div>
  </footer>
  <script src="${P}js/hub-common.js" defer></script>
</body></html>`;

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "index.html"), html, "utf8");
  console.log(`Wrote _multilang/guides/index.html (${count} tool guides, ${groups.length} categories)`);
}

main();
