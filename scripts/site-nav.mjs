/**
 * Shared primary site navigation.
 * AdSense slim (2026-08): keep content hubs only — Originals · About · Games · Tech · Life.
 * Bookmark rails (briefs, portal, tools grid, shopping…) stay reachable by URL but off primary nav.
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

  return NAV_LOCALES.map((lang) => {
    const lis = PRIMARY.map((item) => {
      const active = isNavActive(item, { activeFile, activeContext });
      const cls = active ? ' class="is-active"' : "";
      const href = item.href;
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
