/**
 * Hub bookmark / news headline → local hub-links pages.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeUrl, slugFromUrl } from "./brief-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const HUB_LINKS_DIR = path.join(ROOT, "data", "hub-links");
export const HUB_DATA_DIR = path.join(ROOT, "data", "hubs");
export const LANGS = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

export { normalizeUrl, slugFromUrl };

export function hubLinkPath(slug) {
  return `hub-links/${slug}.html`;
}

export function escAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

export function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const HUB_LABEL = {
  portal: { en: "Global portals", zh: "全球站点" },
  brands: { en: "Global brands", zh: "品牌" },
  shopping: { en: "Shopping", zh: "购物" },
  life: { en: "Digital life", zh: "生活" },
  social: { en: "Social", zh: "社交" },
  tech: { en: "Tech", zh: "科技" },
  games: { en: "Games", zh: "游戏" },
  tools: { en: "Web utilities", zh: "实用工具" },
};

const HUB_CONTEXT = {
  portal: {
    en: "major web portals and traffic-heavy homepages",
    zh: "全球主流门户与高流量首页",
    uses_en: ["Checking a familiar homepage when news mentions traffic rankings", "Comparing regional vs global entry points", "Jumping to official newsrooms from the same rail"],
    uses_zh: ["新闻提到流量排名时快速打开熟悉首页", "对照地区门户与全球入口", "从同一书签条再进官方新闻室"],
  },
  brands: {
    en: "global consumer brand homepages and newsrooms",
    zh: "全球消费品牌官网与新闻室",
    uses_en: ["Following brand valuation or marketing headlines", "Opening IR / press releases from bookmarks", "Not investment advice — verify figures on the official site"],
    uses_zh: ["跟进品牌价值或营销类标题", "从书签进入投资者关系/新闻稿", "非投资建议——数字以官网为准"],
  },
  shopping: {
    en: "large online retailers and marketplace fronts",
    zh: "大型电商与卖场官网",
    uses_en: ["Sale season entry points (deals pages)", "Cross-border vs domestic mall comparison", "Terms, shipping, and returns live on each retailer"],
    uses_zh: ["大促季进入各站 deals 入口", "跨境与本土卖场对照", "运费与退换货条款在各商官网"],
  },
  life: {
    en: "maps, mobility, media, wallets, and travel utilities",
    zh: "地图、出行、媒体、钱包与旅行类服务",
    uses_en: ["Daily convenience apps after device reset", "Checking official product pages—not medical diagnosis", "Privacy settings on the provider app"],
    uses_zh: ["换机后重装常用生活服务", "仅作产品页入口——非医疗诊断", "隐私设置请在各 App 官网查看"],
  },
  social: {
    en: "social networks and messaging fronts",
    zh: "社交网络与消息产品官网",
    uses_en: ["Official blog headlines without scraping user feeds", "Policy or product updates from the vendor", "Account safety settings on the real domain"],
    uses_zh: ["只看官方博客标题，不抓取用户时间线", "跟进产品或政策更新", "账号安全请在真实域名上操作"],
  },
  tech: {
    en: "semiconductor and platform companies (market-cap lists)",
    zh: "半导体与平台公司（市值榜单语境）",
    uses_en: ["IR pages during GPU/supply news cycles", "Earnings and SEC filings on the corporate site", "Not a buy/sell list — do your own research"],
    uses_zh: ["GPU/产能新闻时进 IR 页面", "财报与监管文件在官网", "非买卖清单——请自行研究"],
  },
  games: {
    en: "game platforms, publishers, and official blogs",
    zh: "游戏平台、发行商与官方博客",
    uses_en: ["Patch notes and store fronts", "Following official blog RSS headlines", "No piracy or keygen links—ever"],
    uses_zh: ["补丁说明与商店页", "追官方博客 RSS 标题", "不含盗版或破解站"],
  },
  tools: {
    en: "everyday web utilities (weather, convert, QR, etc.)",
    zh: "日常网页小工具（天气、转换、二维码等）",
    uses_en: ["Monthly-use official web apps", "Read upload/retention policy before sensitive files", "Execution happens on the vendor site"],
    uses_zh: ["每月会用的官方网页版", "上传敏感文件前阅读留存政策", "实际功能在各站执行"],
  },
};

export function hubLabel(hub, lang) {
  const p = HUB_LABEL[hub] || { en: hub, zh: hub };
  return lang === "zh" ? p.zh : p.en;
}

export function displayTitle(link, lang) {
  if (link.kind === "news" || link.kind === "hotmix") {
    const t = lang === "zh" ? link.title_zh || link.title_en : link.title_en || link.title_zh;
    if (t) return t;
  }
  return lang === "zh" ? link.name_zh || link.name_en : link.name_en || link.name_zh;
}

export function linkDesc(link, lang) {
  const title = displayTitle(link, lang);
  const hub = hubLabel(link.hub, lang);
  if (lang === "zh") return `${title}（${hub}）— aogl.cn 书签简介与官网跳转。`;
  return `${title} (${hub}) — bookmark brief on aogl.cn with link to the official site.`;
}

export function buildHubLinkBodyHtml(link, lang) {
  const title = displayTitle(link, lang);
  const hub = link.hub || "portal";
  const ctx = HUB_CONTEXT[hub] || HUB_CONTEXT.portal;
  const catLabel = hubLabel(hub, lang);
  const domain = link.domain || "";

  const note =
    lang === "zh"
      ? "<p class=\"brief-note\"><strong>说明：</strong>本页为 aogl.cn Hub 书签站整理的简介，非官网全文；功能与条款以外链为准。</p>"
      : "<p class=\"brief-note\"><strong>Note:</strong> Bookmark intro on aogl.cn — not the vendor’s full site. Features and terms are on the outbound link.</p>";

  const intro =
    lang === "zh"
      ? `<p><strong>${escHtml(title)}</strong> 收录在「${escHtml(catLabel)}」Hub（${escHtml(ctx.zh)}）。便于先了解语境，再打开下方官网链接。</p>`
      : `<p><strong>${escHtml(title)}</strong> is listed on the “${escHtml(catLabel)}” hub (${escHtml(ctx.en)}). Skim here, then use the official link below.</p>`;

  const uses = (lang === "zh" ? ctx.uses_zh : ctx.uses_en)
    .map((u) => `<li>${escHtml(u)}</li>`)
    .join("");
  const usesH = lang === "zh" ? "常见用途" : "Typical uses";
  const domainP =
    lang === "zh"
      ? `<p>主域名：<code>${escHtml(domain)}</code>。请通过下方按钮访问官网获取最新页面与账户设置。</p>`
      : `<p>Primary domain: <code>${escHtml(domain)}</code>. Open the official site below for live pages and account settings.</p>`;

  return `${note}${intro}<h2>${escHtml(usesH)}</h2><ul class="brief-bullets">${uses}</ul>${domainP}`;
}

export function loadAllHubLinks() {
  if (!fs.existsSync(HUB_LINKS_DIR)) return [];
  return fs
    .readdirSync(HUB_LINKS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(HUB_LINKS_DIR, f), "utf8")))
    .filter((l) => l.slug);
}

/** Collect unique outbound URLs from hub JSON specs. */
export function collectHubOutboundItems() {
  const map = new Map();
  const files = fs.readdirSync(HUB_DATA_DIR).filter((f) => f.endsWith(".json") && f !== "news-feeds.json");

  function add(entry) {
    const url = normalizeUrl(entry.url);
    if (!url) return;
    const slug = entry.slug || slugFromUrl(url);
    const prev = map.get(url) || {
      slug,
      url,
      name_en: entry.name_en || "",
      name_zh: entry.name_zh || "",
      title_en: entry.title_en || "",
      title_zh: entry.title_zh || "",
      domain: entry.domain || "",
      hubs: [],
      kinds: [],
    };
    if (entry.name_en) prev.name_en = entry.name_en;
    if (entry.name_zh) prev.name_zh = entry.name_zh;
    if (entry.title_en) prev.title_en = entry.title_en;
    if (entry.title_zh) prev.title_zh = entry.title_zh;
    if (entry.domain) prev.domain = entry.domain;
    if (entry.hub && !prev.hubs.includes(entry.hub)) prev.hubs.push(entry.hub);
    if (entry.kind && !prev.kinds.includes(entry.kind)) prev.kinds.push(entry.kind);
    map.set(url, prev);
  }

  for (const file of files) {
    const spec = JSON.parse(fs.readFileSync(path.join(HUB_DATA_DIR, file), "utf8"));
    const hub = spec.slug;
    for (const t of spec.top10 || []) {
      add({ ...t, hub, kind: "rank" });
    }
    for (const t of spec.more || []) {
      add({ ...t, hub, kind: "more" });
    }
    for (const g of spec.newsGroups || []) {
      for (const it of g.items || []) {
        add({
          url: it.url,
          title_en: it.title_en,
          title_zh: it.title_zh,
          name_en: g.labelEn,
          name_zh: g.labelZh,
          domain: domainFromUrl(it.url),
          hub,
          kind: "news",
        });
      }
    }
    for (const it of spec.hotMixItems || []) {
      add({
        url: it.url,
        title_en: it.title_en || it.title,
        title_zh: it.title_zh || it.title,
        name_en: it.source || "",
        name_zh: it.source || "",
        domain: domainFromUrl(it.url),
        hub,
        kind: "hotmix",
      });
    }
  }
  return map;
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
