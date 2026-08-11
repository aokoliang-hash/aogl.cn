#!/usr/bin/env node
/**
 * Injects AI tools directory from data/tools-directory.json + data/i18n/site-tools-i18n.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { faviconSrcForHtml } from "./favicon-local.mjs";
import { slugFromUrl, toolGuidePath } from "./tool-guide-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "_multilang", "index.html");
const DATA = path.join(ROOT, "data", "tools-directory.json");
const I18N = path.join(ROOT, "data", "i18n", "site-tools-i18n.json");

const START = "<!-- TOOLS_DIRECTORY_AUTO_START -->";
const END = "<!-- TOOLS_DIRECTORY_AUTO_END -->";

const LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

const pack = JSON.parse(fs.readFileSync(I18N, "utf8"));

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toolName(t, lang) {
  if (lang === "en") return t.name_en;
  if (lang === "zh") return t.name_zh;
  const o = pack.toolDomains?.[t.domain]?.name?.[lang];
  return o != null && o !== "" ? o : t.name_en;
}

function renderTool(t) {
  const icon = faviconSrcForHtml(t.domain);
  const slug = t.slug || slugFromUrl(t.url);
  const href = toolGuidePath(slug);
  const names = LOCALES.map(
    (lang) => `                <span class="tool-tile-name lang-${lang}">${escapeHtml(toolName(t, lang))}</span>`
  ).join("\n");
  return `            <li>
              <a class="tool-tile" href="${escapeHtml(href)}">
                <span class="tool-tile-icon-wrap">
                  <img class="tool-tile-icon" src="${icon}" width="36" height="36" alt="" loading="lazy" decoding="async" />
                </span>
${names}
              </a>
            </li>`;
}

function catTitle(cat, lang) {
  if (lang === "en") return cat.title_en;
  if (lang === "zh") return cat.title_zh;
  return pack.categories?.[cat.id]?.title?.[lang] || cat.title_en;
}

function pageHeading(data, lang) {
  if (lang === "en") return data.heading_en;
  if (lang === "zh") return data.heading_zh;
  return pack.heading?.[lang] || data.heading_en;
}

function pageIntro(data, lang) {
  if (lang === "en") return data.intro_en;
  if (lang === "zh") return data.intro_zh;
  return pack.intro?.[lang] || data.intro_en;
}

const TOOLS_SUMMARY = {
  en: "Open AI tools directory (secondary bookmarks)",
  zh: "展开 AI 工具目录（辅助书签）",
  ja: "AIツール一覧を開く（補助ブックマーク）",
  ko: "AI 도구 디렉터리 펼치기（보조 북마크）",
  fr: "Ouvrir le répertoire d’outils IA (signets secondaires)",
  ru: "Открыть каталог ИИ-инструментов (вторичные закладки)",
  ar: "فتح دليل أدوات الذكاء الاصطناعي (إشارات ثانوية)",
};

const TOOLS_SECONDARY_NOTE = {
  en: "Secondary bookmarks only — not the site’s primary content. Prefer <a href=\"articles/index.html\">editorial demos</a> or <a href=\"about.html\">About</a> first.",
  zh: "仅为辅助书签，不是本站主内容。请优先看 <a href=\"articles/index.html\">原创 Demo</a> 或 <a href=\"about.html\">关于本站</a>。",
  ja: "補助ブックマークです。まずは <a href=\"articles/index.html\">編集デモ</a> または <a href=\"about.html\">About</a> を。",
  ko: "보조 북마크입니다. 먼저 <a href=\"articles/index.html\">편집 데모</a> 또는 <a href=\"about.html\">소개</a>를 보세요.",
  fr: "Signets secondaires seulement. Préférez les <a href=\"articles/index.html\">démos</a> ou <a href=\"about.html\">À propos</a>.",
  ru: "Только вспомогательные закладки. Сначала <a href=\"articles/index.html\">демо</a> или <a href=\"about.html\">О сайте</a>.",
  ar: "إشارات ثانوية فقط. ابدأ بـ <a href=\"articles/index.html\">العروض</a> أو <a href=\"about.html\">حول</a>.",
};

function render(data) {
  const headingLines = LOCALES.map(
    (lang) => `        <h2 class="page-section-title lang-${lang}">${escapeHtml(pageHeading(data, lang))}</h2>`
  ).join("\n");
  const noteLines = LOCALES.map(
    (lang) => `        <p class="tools-intro tools-intro--secondary lang-${lang}">${TOOLS_SECONDARY_NOTE[lang]}</p>`
  ).join("\n");
  const introLines = LOCALES.map(
    (lang) => `        <p class="tools-intro lang-${lang}">${escapeHtml(pageIntro(data, lang))}</p>`
  ).join("\n");
  const summaryLines = LOCALES.map(
    (lang) => `          <span class="lang-${lang}">${escapeHtml(TOOLS_SUMMARY[lang])}</span>`
  ).join("\n");

  const cats = data.categories
    .map((cat) => {
      const items = cat.tools.map(renderTool).join("\n");
      const catHeads = LOCALES.map(
        (lang) => `          <h3 class="tools-cat-heading lang-${lang}">${escapeHtml(catTitle(cat, lang))}</h3>`
      ).join("\n");
      return `        <div class="tools-category" id="tools-${escapeHtml(cat.id)}">
${catHeads}
          <ul class="tools-grid">
${items}
          </ul>
        </div>`;
    })
    .join("\n\n");

  return `      <section id="tools-directory" class="tools-directory tools-directory--secondary" tabindex="-1">
${headingLines}
${noteLines}
        <details class="tools-directory-details">
          <summary class="tools-directory-summary">
${summaryLines}
          </summary>
${introLines}
${cats}
        </details>
      </section>`;
}

function replaceMarker(html, inner) {
  const i0 = html.indexOf(START);
  const i1 = html.indexOf(END);
  if (i0 === -1 || i1 === -1 || i1 <= i0) throw new Error("TOOLS_DIRECTORY markers missing");
  return html.slice(0, i0 + START.length) + "\n" + inner + "\n\n      " + html.slice(i1);
}

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
let html = fs.readFileSync(INDEX, "utf8");
html = replaceMarker(html, render(data));
fs.writeFileSync(INDEX, html, "utf8");
console.log("Injected tools directory (7 locales)");
