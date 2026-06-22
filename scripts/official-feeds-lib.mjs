/**
 * Shared renderers for homepage category feeds + official-news page.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { briefPagePath, loadAllBriefs, slugFromUrl } from "./brief-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");

export const LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loadCategoryData() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data", "categories.json"), "utf8"));
}

export function loadReadingData() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data", "articles.json"), "utf8"));
}

export function loadCategoryHeadings() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data", "i18n", "category-headings.json"), "utf8"));
}

export function loadSiteConfig() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
}

const CAT_LEADS = {
  "cat-news": {
    lead_en: "RSS-style headlines on model releases, policy, and safety — not a live newsroom.",
    lead_zh: "本块为站内 RSS 拉取摘要：偏模型与产品发布、政策与安全通告；更新频率取决于上游 feed，非实时新闻站。",
  },
  "cat-rankings": {
    lead_en: "Rankings and picks focused on fit-for-purpose tools, not affiliate roundups.",
    lead_zh: "侧重榜单解读、场景化选型与「够用就好」的性价比讨论；与带货或刷榜无关。",
  },
  "cat-maps": {
    lead_en: "Articles on architecture and roadmaps — complements the tool directory above.",
    lead_zh: "与上方「工具分类导航」呼应：这里收的是文章里谈架构、路线图与对比的内容，便于和纯官网入口对照阅读。",
  },
  "cat-tips": {
    lead_en: "Practical notes on prompts, evals, cost, and production pitfalls.",
    lead_zh: "偏实践笔记：提示词、评测、成本、安全与落地踩坑；适合已有基础、准备接 API 或上生产的读者。",
  },
};

export function editorialArticleSlugs() {
  const dir = path.join(ROOT, "data", "articles");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
    .filter((a) => a.slug)
    .sort((a, b) => String(b.datePublished || "").localeCompare(String(a.datePublished || "")));
}

function sectionHeading(sec, lang, headings) {
  if (lang === "en") return sec.heading_en;
  if (lang === "zh") return sec.heading_zh;
  return headings[sec.id]?.[lang] || sec.heading_en;
}

function itemTitle(it, lang) {
  if (lang === "en") return it.title_en;
  if (lang === "zh") return it.title_zh;
  return it.title_en;
}

function itemMeta(it, lang) {
  if (lang === "en") return it.meta_en;
  if (lang === "zh") return it.meta_zh;
  return it.meta_en;
}

function previewHeading(base, lang, shown, total) {
  if (shown >= total || shown <= 0) return base;
  const note = {
    en: ` (top ${shown} on home)`,
    zh: `（首页预览 ${shown} 条）`,
    ja: `（トップ ${shown} 件）`,
    ko: `（홈 미리보기 ${shown}건）`,
    fr: ` (${shown} en accueil)`,
    ru: ` (на главной ${shown})`,
    ar: ` (${shown} على الصفحة الرئيسية)`,
  };
  return base + (note[lang] || note.en);
}

function itemBriefHref(it) {
  const slug = it.slug || slugFromUrl(it.url);
  return briefPagePath(slug);
}

export function renderCategoryList(items, lang) {
  return items
    .map(
      (it) => `          <li>
            <a href="${escapeHtml(itemBriefHref(it))}">${escapeHtml(itemTitle(it, lang))}</a>
            <span class="article-meta">${escapeHtml(itemMeta(it, lang))}</span>
          </li>`
    )
    .join("\n");
}

export function renderCategoryFeeds(data, options = {}) {
  const {
    itemLimit = 0,
    moreHref = "briefs/index.html",
    includeLeads = true,
    wrapId = "feeds",
  } = options;
  const headings = loadCategoryHeadings();

  const inner = data.sections
    .map((sec) => {
      const total = sec.items.length;
      const shown = itemLimit > 0 ? Math.min(itemLimit, total) : total;
      const items = itemLimit > 0 ? sec.items.slice(0, itemLimit) : sec.items;

      const h2s = LOCALES.map((lang) => {
        const h = previewHeading(sectionHeading(sec, lang, headings), lang, shown, total);
        return `          <h2 class="cat-feed-title lang-${lang}">${escapeHtml(h)}</h2>`;
      }).join("\n");

      const leadPack = CAT_LEADS[sec.id] || {};
      const leads = includeLeads
        ? LOCALES.map((lang) => {
            const text =
              lang === "en"
                ? leadPack.lead_en || "Headlines from official blogs — open a local brief, then the publisher link inside."
                : lang === "zh"
                  ? leadPack.lead_zh || leadPack.lead_en
                  : leadPack.lead_en;
            return `          <p class="reading-intro cat-feed-lead lang-${lang}">${escapeHtml(text)}</p>`;
          }).join("\n")
        : "";

      const uls = LOCALES.map(
        (lang) => `          <ul class="article-list compact lang-${lang}">
${renderCategoryList(items, lang)}
          </ul>`
      ).join("\n");

      const more =
        itemLimit > 0 && total > shown
          ? LOCALES.map((lang) => {
              const label = {
                en: `View all ${total} briefs →`,
                zh: `查看全部 ${total} 条速览 →`,
                ja: `速覧 ${total} 件を見る →`,
                ko: `요약 ${total}건 전체 보기 →`,
                fr: `Voir les ${total} résumés →`,
                ru: `Все ${total} кратких обзоров →`,
                ar: `عرض كل ${total} ملخصًا →`,
              };
              return `          <p class="cat-feed-more lang-${lang}"><a href="${escapeHtml(moreHref)}#${escapeHtml(sec.id)}">${escapeHtml(label[lang] || label.en)}</a></p>`;
            }).join("\n")
          : "";

      return `        <section id="${escapeHtml(sec.id)}" class="cat-feed" tabindex="-1">
${h2s}
${leads}
${uls}
${more}
        </section>`;
    })
    .join("\n\n");

  return `      <div class="cat-feeds-wrap" id="${escapeHtml(wrapId)}" tabindex="-1">
${inner}
      </div>`;
}

export function renderReadingList(items, lang) {
  return items
    .map(
      (it) => `          <li>
            <a href="${escapeHtml(itemBriefHref(it))}">${escapeHtml(lang === "zh" ? it.title_zh : it.title_en)}</a>
            <span class="reading-meta">${escapeHtml(lang === "zh" ? it.meta_zh : it.meta_en)}</span>
          </li>`
    )
    .join("\n");
}

export function renderReadingSection(items) {
  const n = items.length;
  const introEn = `${n} official headlines (OpenAI, Anthropic, Google DeepMind). Each opens a brief on aogl.cn; the original post is linked inside the page.`;
  const introZh = `共 ${n} 条三家官网动态；点击进入本站速览页，文末再链出原文。`;

  const h2s = LOCALES.map((lang) => {
    const title =
      lang === "en"
        ? "Latest official articles (local briefs)"
        : lang === "zh"
          ? "最新官方文章（本站速览）"
          : "Latest official articles (local briefs)";
    return `        <h2 class="page-section-title lang-${lang}">${escapeHtml(title)}</h2>`;
  }).join("\n");

  const intros = LOCALES.map((lang) => {
    const text = lang === "en" ? introEn : lang === "zh" ? introZh : introEn;
    return `        <p class="reading-intro lang-${lang}">${escapeHtml(text)}</p>`;
  }).join("\n");

  const uls = LOCALES.map(
    (lang) => `        <ul class="reading-list lang-${lang}">
${renderReadingList(items, lang)}
        </ul>`
  ).join("\n\n");

  return `      <section id="reading">
${h2s}
${intros}

${uls}
      </section>`;
}

export function renderReadingTeaser(readingCount, categoryCount) {
  const intros = LOCALES.map((lang) => {
    const text =
      lang === "en"
        ? `${categoryCount} categorized headlines and ${readingCount} additional official links are on a separate page so the home screen stays focused on our 12 editorial notes.`
        : lang === "zh"
          ? `首页仅保留本站原创手记与工具目录；另有 ${categoryCount} 组分类短讯与 ${readingCount} 条官方文章索引，已移至「官方动态」专页（外链集中列出，便于核对）。`
          : `${readingCount} official links moved to the official feeds page.`;
    return `        <p class="reading-intro lang-${lang}">${escapeHtml(text)} <a href="official-news.html">${escapeHtml(lang === "zh" ? "前往官方动态页 →" : "Official feeds page →")}</a></p>`;
  }).join("\n");

  return `      <section id="reading" class="reading-teaser">
        <h2 class="page-section-title lang-en">Official AI headlines</h2>
        <h2 class="page-section-title lang-zh">官方动态（外链专页）</h2>
${intros}
      </section>`;
}

export function renderHomeJsonLd(siteUrl) {
  const base = siteUrl.replace(/\/$/, "");
  const articles = editorialArticleSlugs();
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "aogl.cn",
      url: `${base}/`,
      image: `${base}/og-default.png`,
      logo: `${base}/logo.svg`,
      description:
        "Personal editorial demos and production notes on aogl.cn — WebGL, video, and illustration archives.",
      inLanguage: ["zh-CN", "en"],
    },
    {
      "@type": "ItemList",
      "@id": `${base}/#editorial-list`,
      name: "Editorial articles on aogl.cn",
      numberOfItems: articles.length,
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.titleZh || a.titleEn || a.slug,
        url: `${base}/articles/${a.slug}.html`,
      })),
    },
  ];
  return `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}\n</script>`;
}

export function renderOfficialNewsJsonLd(siteUrl, readingItems) {
  const base = siteUrl.replace(/\/$/, "");
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${base}/briefs/#webpage`,
      url: `${base}/briefs/`,
      name: "Official AI headline briefs — aogl.cn",
      isPartOf: { "@id": `${base}/#website` },
    },
    {
      "@type": "ItemList",
      "@id": `${base}/briefs/#reading-list`,
      name: "Official AI lab reading list (local briefs)",
      numberOfItems: readingItems.length,
      itemListElement: readingItems.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.title_en,
        url: `${base}/${briefPagePath(it.slug || slugFromUrl(it.url))}`,
      })),
    },
  ];
  return `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}\n</script>`;
}
