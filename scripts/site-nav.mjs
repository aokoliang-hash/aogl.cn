/**
 * Shared primary site navigation (see docs/流量增长与栏目整改实施方案.md).
 * Primary: Originals · AI tools · Briefs · Games · Tech · More (hub fold).
 */
export const NAV_LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

const PRIMARY = [
  {
    href: "articles/index.html",
    match: { context: "articles" },
    en: "Originals",
    zh: "本站原创",
    ja: "オリジナル",
    ko: "오리지널",
    fr: "Originaux",
    ru: "Авторское",
    ar: "محتوى أصلي",
  },
  {
    href: "index.html#tools-directory",
    hrefKey: "tools",
    match: { context: "tools", file: "index.html" },
    en: "AI tools",
    zh: "AI 工具",
    ja: "AIツール",
    ko: "AI 도구",
    fr: "Outils IA",
    ru: "ИИ‑инструменты",
    ar: "أدوات الذكاء",
  },
  {
    href: "briefs/index.html",
    match: { context: "briefs" },
    en: "Briefs",
    zh: "快讯",
    ja: "速報",
    ko: "속보",
    fr: "Brèves",
    ru: "Сводки",
    ar: "عناوين",
  },
  {
    href: "games.html",
    match: { file: "games.html" },
    en: "Games",
    zh: "游戏",
    ja: "ゲーム",
    ko: "게임",
    fr: "Jeux",
    ru: "Игры",
    ar: "الألعاب",
  },
  {
    href: "tech.html",
    match: { file: "tech.html" },
    en: "Tech",
    zh: "科技",
    ja: "テック",
    ko: "테크",
    fr: "Tech",
    ru: "Техно",
    ar: "التقنية",
  },
];

const MORE = [
  { href: "portal.html", file: "portal.html", en: "Top sites", zh: "全球站点", ja: "主要サイト", ko: "주요 사이트", fr: "Grands sites", ru: "Топ сайтов", ar: "أبرز المواقع" },
  { href: "brands.html", file: "brands.html", en: "Brands", zh: "品牌", ja: "ブランド", ko: "브랜드", fr: "Marques", ru: "Бренды", ar: "العلامات" },
  { href: "shopping.html", file: "shopping.html", en: "Shopping", zh: "购物", ja: "ショッピング", ko: "쇼핑", fr: "Shopping", ru: "Шопинг", ar: "التسوق" },
  { href: "life.html", file: "life.html", en: "Life", zh: "生活", ja: "ライフ", ko: "라이프", fr: "Vie", ru: "Сервисы", ar: "الحياة الرقمية" },
  { href: "social.html", file: "social.html", en: "Social", zh: "社交", ja: "ソーシャル", ko: "소셜", fr: "Social", ru: "Соцсети", ar: "التواصل" },
  { href: "tools.html", file: "tools.html", en: "Utilities", zh: "工具", ja: "実用ツール", ko: "실용 도구", fr: "Utilitaires", ru: "Утилиты", ar: "أدوات مساعدة" },
];

const MORE_SUMMARY = {
  en: "More",
  zh: "更多",
  ja: "その他",
  ko: "더보기",
  fr: "Plus",
  ru: "Ещё",
  ar: "المزيد",
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function label(item, lang) {
  return item[lang] || item.en;
}

function isPrimaryActive(item, { activeFile, activeContext }) {
  const m = item.match || {};
  if (m.context && m.context === activeContext) return true;
  if (m.file && m.file === activeFile) return true;
  return false;
}

function isMoreActive(item, activeFile) {
  return item.file === activeFile;
}

/**
 * @param {{ activeFile?: string|null, activeContext?: string|null, prefix?: string }} opts
 */
export function navHtml(opts = {}) {
  const activeFile = opts.activeFile ?? null;
  const activeContext = opts.activeContext ?? null;
  const prefix = opts.prefix ?? "";
  const toolsHref = opts.toolsHref ?? "index.html#tools-directory";

  return NAV_LOCALES.map((lang) => {
    const primaryLis = PRIMARY.map((item) => {
      const active = isPrimaryActive(item, { activeFile, activeContext });
      const cls = active ? ' class="is-active"' : "";
      const href = item.hrefKey === "tools" ? toolsHref : item.href;
      return `          <li${cls}><a href="${esc(prefix + href)}">${esc(label(item, lang))}</a></li>`;
    });

    const moreActive = MORE.some((item) => isMoreActive(item, activeFile));
    const moreCls = moreActive ? ' class="site-nav-more is-active"' : ' class="site-nav-more"';
    const openAttr = moreActive ? " open" : "";

    const subLis = MORE.map((item) => {
      const active = isMoreActive(item, activeFile);
      const cls = active ? ' class="is-active"' : "";
      return `              <li${cls}><a href="${esc(prefix + item.href)}">${esc(label(item, lang))}</a></li>`;
    }).join("\n");

    primaryLis.push(
      `          <li${moreCls}>
            <details class="site-nav-details"${openAttr}>
              <summary>${esc(MORE_SUMMARY[lang] || MORE_SUMMARY.en)}</summary>
              <ul class="site-nav-sub" role="list">
${subLis}
              </ul>
            </details>
          </li>`,
    );

    return `        <ul class="site-nav-list lang-${lang}">
${primaryLis.join("\n")}
        </ul>`;
  }).join("\n");
}

/** Wrap nav lists in <nav> for hub/article page headers. */
export function navBlock(opts = {}) {
  return `      <nav class="site-nav" aria-label="Primary">
${navHtml(opts)}
      </nav>`;
}
