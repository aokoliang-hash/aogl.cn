/**
 * Shared helpers for outbound headline → local brief pages.
 */
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const BRIEFS_DIR = path.join(ROOT, "data", "briefs");
export const LANGS = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

export function normalizeUrl(u) {
  try {
    const x = new URL(u);
    x.hash = "";
    return x.href.replace(/\/$/, "");
  } catch {
    return String(u || "").trim();
  }
}

export function slugFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").split(".")[0] || "site";
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const filtered = parts.filter((p) => p !== "index");
    let tail = filtered.slice(-2).join("-") || filtered[filtered.length - 1] || "post";
    const slug = `${host}-${tail}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96);
    return slug || `brief-${createHash("sha256").update(url).digest("hex").slice(0, 12)}`;
  } catch {
    return `brief-${createHash("sha256").update(String(url)).digest("hex").slice(0, 12)}`;
  }
}

export function publisherFromUrl(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    if (h.includes("openai.com")) return "OpenAI";
    if (h.includes("anthropic.com")) return "Anthropic";
    if (h.includes("deepmind.google") || h.includes("google.com")) return "Google DeepMind";
    return h;
  } catch {
    return "Publisher";
  }
}

export function briefPagePath(slug) {
  return `briefs/${slug}.html`;
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

export function strByLang(brief, lang, field) {
  if (lang === "zh") return brief[`${field}_zh`] || brief[`${field}_en`] || "";
  if (lang === "en") return brief[`${field}_en`] || brief[`${field}_zh`] || "";
  return brief[`${field}_en`] || brief[`${field}_zh`] || "";
}

export function loadCategoryData() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data", "categories.json"), "utf8"));
}

export function loadReadingData() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data", "articles.json"), "utf8"));
}

/** @returns {Map<string, { url, title_en, title_zh, meta_en, meta_zh, sectionIds: string[] }>} */
export function collectUniqueFeedItems() {
  const map = new Map();
  const cat = loadCategoryData();
  for (const sec of cat.sections || []) {
    for (const it of sec.items || []) {
      const url = normalizeUrl(it.url);
      if (!url) continue;
      const prev = map.get(url) || {
        url,
        title_en: it.title_en,
        title_zh: it.title_zh,
        meta_en: it.meta_en,
        meta_zh: it.meta_zh,
        sectionIds: [],
      };
      if (!prev.sectionIds.includes(sec.id)) prev.sectionIds.push(sec.id);
      map.set(url, prev);
    }
  }
  const reading = loadReadingData();
  for (const it of reading.items || []) {
    const url = normalizeUrl(it.url);
    if (!url) continue;
    const prev = map.get(url) || {
      url,
      title_en: it.title_en,
      title_zh: it.title_zh,
      meta_en: it.meta_en,
      meta_zh: it.meta_zh,
      sectionIds: [],
    };
    if (!prev.sectionIds.includes("reading")) prev.sectionIds.push("reading");
    map.set(url, prev);
  }
  return map;
}

export function loadAllBriefs() {
  if (!fs.existsSync(BRIEFS_DIR)) return [];
  return fs
    .readdirSync(BRIEFS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(BRIEFS_DIR, f), "utf8")))
    .filter((b) => b.slug)
    .sort((a, b) => String(b.updated || "").localeCompare(String(a.updated || "")));
}

function defaultSummary(title, publisher, lang) {
  if (lang === "zh") {
    return `「${title}」来自 ${publisher} 官方发布。本站提供中文语境下的速览，便于在书签站里快速定位话题；具体版本、定价与条款请以官网为准。`;
  }
  return `"${title}" is an official post from ${publisher}. This page adds scanning context on aogl.cn; specs, pricing, and terms remain on the publisher site.`;
}

function contextBullets(title, lang) {
  const t = title.toLowerCase();
  const items = [];
  if (/gpt|claude|gemma|codex|model/i.test(t)) {
    items.push(
      lang === "zh"
        ? "通常涉及模型能力、API 或产品形态的更新。"
        : "Often covers model capability, API, or product surface changes."
    );
  }
  if (/fund|raise|valuation|billion|series/i.test(t)) {
    items.push(
      lang === "zh"
        ? "属于公司融资或合作类通告，需以原文数字与日期为准。"
        : "Corporate funding or partnership news — verify figures on the original page."
    );
  }
  if (/safety|trust|policy|cyber/i.test(t)) {
    items.push(
      lang === "zh"
        ? "可能涉及安全、合规或可信访问策略，适合与站内「实践笔记」对照阅读。"
        : "May touch safety, compliance, or trusted-access policy — pair with our practice notes."
    );
  }
  if (items.length === 0) {
    items.push(
      lang === "zh"
        ? "建议打开原文核对发布时间、适用地区与是否需登录。"
        : "Open the original post to confirm date, regions, and sign-in requirements."
    );
  }
  if (items.length < 2) {
    items.push(
      lang === "zh"
        ? "本站不托管全文；下方按钮直达厂商页面。"
        : "Full text is not hosted here — use the button below for the publisher page."
    );
  }
  return items.slice(0, 3);
}

export function buildBriefBodyHtml(brief, lang) {
  const title = strByLang(brief, lang, "title");
  const publisher = brief.publisher || publisherFromUrl(brief.sourceUrl);
  const rawExcerpt = (lang === "zh" ? brief.excerpt_zh : brief.excerpt_en) || brief.excerpt_en || "";
  const excerpt = String(rawExcerpt).trim();
  const summary = excerpt.length > 40 ? excerpt : defaultSummary(title, publisher, lang);

  const note =
    lang === "zh"
      ? "<p class=\"brief-note\"><strong>说明：</strong>以下为 aogl.cn 根据公开标题与摘要整理的速览，非原文转载；细节以厂商页面为准。</p>"
      : "<p class=\"brief-note\"><strong>Note:</strong> Short summary on aogl.cn from public titles and excerpts — not a full republish. The publisher page is authoritative.</p>";

  const follow =
    lang === "zh"
      ? `<p>若你正在跟进 ${escHtml(publisher)} 的产品与政策动态，可先阅读本页概要，再点击下方打开官网原文核对版本号、定价与合规条款。</p>`
      : `<p>If you track ${escHtml(publisher)} releases, skim this summary first, then open the original below for exact specs, pricing, and terms.</p>`;

  const bullets = contextBullets(title, lang)
    .map((b) => `<li>${escHtml(b)}</li>`)
    .join("");
  const ul =
    lang === "zh"
      ? `<h2>阅读提示</h2><ul class="brief-bullets">${bullets}</ul>`
      : `<h2>Before you click through</h2><ul class="brief-bullets">${bullets}</ul>`;

  return `${note}<p>${escHtml(summary)}</p>${follow}${ul}`;
}

export function briefDesc(brief, lang) {
  const title = strByLang(brief, lang, "title");
  const publisher = brief.publisher || "";
  if (lang === "zh") {
    return `${title} — ${publisher} 官方动态速览（aogl.cn），含原文链接。`;
  }
  return `${title} — ${publisher} headline brief on aogl.cn with link to the original post.`;
}
