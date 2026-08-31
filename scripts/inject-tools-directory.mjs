#!/usr/bin/env node
/**
 * Injects AI tools directory as DISPLAY-ONLY name tiles (no outbound / tool-guide links).
 * AdSense: avoid homepage looking like a link directory.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { faviconSrcForHtml } from "./favicon-local.mjs";

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
  const names = LOCALES.map(
    (lang) => `                <span class="tool-tile-name lang-${lang}">${escapeHtml(toolName(t, lang))}</span>`
  ).join("\n");
  return `            <li>
              <div class="tool-tile tool-tile--display" role="listitem">
                <span class="tool-tile-icon-wrap">
                  <img class="tool-tile-icon" src="${icon}" width="36" height="36" alt="" loading="lazy" decoding="async" />
                </span>
${names}
              </div>
            </li>`;
}

function catTitle(cat, lang) {
  if (lang === "en") return cat.title_en;
  if (lang === "zh") return cat.title_zh;
  return pack.categories?.[cat.id]?.title?.[lang] || cat.title_en;
}

const HEADING = {
  en: "AI tools (names only)",
  zh: "AI 工具名录（仅展示）",
  ja: "AIツール名（表示のみ）",
  ko: "AI 도구 이름（표시만）",
  fr: "Outils IA (noms seulement)",
  ru: "ИИ-инструменты (только названия)",
  ar: "أدوات الذكاء (أسماء فقط)",
};

const NOTE = {
  en: "Display-only reference list — <strong>no outbound links</strong>. Primary content is <a href=\"articles/index.html\">editorial demos</a>.",
  zh: "仅展示工具名称，<strong>不含外链</strong>。主内容请看 <a href=\"articles/index.html\">原创 Demo</a>。",
  ja: "名称のみ表示。<strong>外部リンクなし</strong>。主内容は <a href=\"articles/index.html\">編集デモ</a>。",
  ko: "이름만 표시.<strong>외부 링크 없음</strong>. 주 콘텐츠는 <a href=\"articles/index.html\">편집 데모</a>.",
  fr: "Liste indicative — <strong>sans liens sortants</strong>. Contenu principal : <a href=\"articles/index.html\">démos</a>.",
  ru: "Только названия — <strong>без внешних ссылок</strong>. Основное: <a href=\"articles/index.html\">демо</a>.",
  ar: "عرض الأسماء فقط — <strong>بدون روابط خارجية</strong>. المحتوى الأساسي: <a href=\"articles/index.html\">العروض</a>.",
};

const SUMMARY = {
  en: "Show tool name list (no links)",
  zh: "展开工具名录（无链接）",
  ja: "ツール名を表示（リンクなし）",
  ko: "도구 이름 펼치기（링크 없음）",
  fr: "Afficher les noms (sans liens)",
  ru: "Показать названия (без ссылок)",
  ar: "عرض الأسماء (بدون روابط)",
};

function render(data) {
  const headingLines = LOCALES.map(
    (lang) => `        <h2 class="page-section-title lang-${lang}">${escapeHtml(HEADING[lang])}</h2>`
  ).join("\n");
  const noteLines = LOCALES.map(
    (lang) => `        <p class="tools-intro tools-intro--secondary lang-${lang}">${NOTE[lang]}</p>`
  ).join("\n");
  const summaryLines = LOCALES.map(
    (lang) => `          <span class="lang-${lang}">${escapeHtml(SUMMARY[lang])}</span>`
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
console.log("Injected tools directory as display-only (no links)");
