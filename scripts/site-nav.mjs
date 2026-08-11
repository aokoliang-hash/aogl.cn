/**
 * Shared primary site navigation (see docs/流量增长与栏目整改实施方案.md).
 * Primary: Originals · About · AI tools · Briefs · Games · Tech · Portal · Brands · Shopping · Life · Social · Utilities
 * Home highlights Originals (not the tools grid) for AdSense first-impression.
 */
export const NAV_LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

const PRIMARY = [
  {
    href: "articles/index.html",
    match: { context: "articles", contextAlt: "home" },
    en: "Originals",
    zh: "本站原创",
    ja: "オリジナル",
    ko: "오리지널",
    fr: "Originaux",
    ru: "Авторское",
    ar: "محتوى أصلي",
  },
  {
    href: "about.html",
    match: { file: "about.html" },
    en: "About",
    zh: "关于",
    ja: "About",
    ko: "소개",
    fr: "À propos",
    ru: "О сайте",
    ar: "حول",
  },
  {
    href: "index.html#tools-directory",
    hrefKey: "tools",
    match: { context: "tools" },
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
  {
    href: "portal.html",
    match: { file: "portal.html" },
    en: "Top sites",
    zh: "全球站点",
    ja: "主要サイト",
    ko: "주요 사이트",
    fr: "Grands sites",
    ru: "Топ сайтов",
    ar: "أبرز المواقع",
  },
  {
    href: "brands.html",
    match: { file: "brands.html" },
    en: "Brands",
    zh: "品牌",
    ja: "ブランド",
    ko: "브랜드",
    fr: "Marques",
    ru: "Бренды",
    ar: "العلامات",
  },
  {
    href: "shopping.html",
    match: { file: "shopping.html" },
    en: "Shopping",
    zh: "购物",
    ja: "ショッピング",
    ko: "쇼핑",
    fr: "Shopping",
    ru: "Шопинг",
    ar: "التسوق",
  },
  {
    href: "life.html",
    match: { file: "life.html" },
    en: "Life",
    zh: "生活",
    ja: "ライフ",
    ko: "라이프",
    fr: "Vie",
    ru: "Сервисы",
    ar: "الحياة الرقمية",
  },
  {
    href: "social.html",
    match: { file: "social.html" },
    en: "Social",
    zh: "社交",
    ja: "ソーシャル",
    ko: "소셜",
    fr: "Social",
    ru: "Соцсети",
    ar: "التواصل",
  },
  {
    href: "tools.html",
    match: { file: "tools.html" },
    en: "Utilities",
    zh: "工具",
    ja: "実用ツール",
    ko: "실용 도구",
    fr: "Utilitaires",
    ru: "Утилиты",
    ar: "أدوات مساعدة",
  },
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function label(item, lang) {
  return item[lang] || item.en;
}

function isNavActive(item, { activeFile, activeContext }) {
  const m = item.match || {};
  if (m.context && m.context === activeContext) return true;
  if (m.contextAlt && m.contextAlt === activeContext) return true;
  if (m.file && m.file === activeFile) return true;
  return false;
}

/**
 * @param {{ activeFile?: string|null, activeContext?: string|null, prefix?: string, toolsHref?: string }} opts
 */
export function navHtml(opts = {}) {
  const activeFile = opts.activeFile ?? null;
  const activeContext = opts.activeContext ?? null;
  const prefix = opts.prefix ?? "";
  const toolsHref = opts.toolsHref ?? "index.html#tools-directory";

  return NAV_LOCALES.map((lang) => {
    const lis = PRIMARY.map((item) => {
      const active = isNavActive(item, { activeFile, activeContext });
      const cls = active ? ' class="is-active"' : "";
      const href = item.hrefKey === "tools" ? toolsHref : item.href;
      return `          <li${cls}><a href="${esc(prefix + href)}">${esc(label(item, lang))}</a></li>`;
    }).join("\n");

    return `        <ul class="site-nav-list lang-${lang}">
${lis}
        </ul>`;
  }).join("\n");
}

/** Wrap nav lists in <nav> for hub/article page headers. */
export function navBlock(opts = {}) {
  return `      <nav class="site-nav" aria-label="Primary">
${navHtml(opts)}
      </nav>`;
}
