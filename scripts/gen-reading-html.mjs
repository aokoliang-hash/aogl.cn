import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/articles.json"), "utf8"));
const pack = JSON.parse(fs.readFileSync(path.join(ROOT, "data/i18n/reading-i18n.json"), "utf8"));

const LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const n = data.items.length;
const introEn = `${n} additional official links (OpenAI, Anthropic, Google DeepMind) — same sources as above, but no URL duplicated from the category news feeds.`;
const introZh = `下列 ${n} 条亦为三家官网一手文章，与上方「资讯 / 排行 / 分类 / 技巧」区块中的链接不重复（外链将离开本站）。`;

function introFor(lang) {
  if (lang === "en") return introEn;
  if (lang === "zh") return introZh;
  return String(pack.intro[lang] || introEn).replace(/\{\{count\}\}/g, String(n));
}

function titleFor(lang) {
  if (lang === "en") return "Latest official articles";
  if (lang === "zh") return "最新官方文章（外链）";
  return pack.pageTitle[lang] || "Latest official articles";
}

function renderList(lang) {
  return data.items
    .map((it) => {
      const title = lang === "zh" ? it.title_zh : it.title_en;
      const meta = lang === "zh" ? it.meta_zh : it.meta_en;
      return `          <li>
            <a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>
            <span class="reading-meta">${esc(meta)}</span>
          </li>`;
    })
    .join("\n");
}

const h2s = LOCALES.map((lang) => `        <h2 class="page-section-title lang-${lang}">${esc(titleFor(lang))}</h2>`).join("\n");
const intros = LOCALES.map(
  (lang) => `        <p class="reading-intro lang-${lang}">
          ${esc(introFor(lang))}
        </p>`
).join("\n");
const uls = LOCALES.map(
  (lang) => `        <ul class="reading-list lang-${lang}">
${renderList(lang)}
        </ul>`
).join("\n\n");

const section = `      <section id="reading">
${h2s}
${intros}

${uls}
      </section>`;

fs.writeFileSync(path.join(__dirname, "_reading-section.tmp.html"), section, "utf8");

const jsonItems = data.items.map((it, i) => ({
  "@type": "ListItem",
  position: i + 1,
  name: it.title_en,
  url: it.url,
}));

fs.writeFileSync(path.join(__dirname, "_reading-jsonld-items.tmp.json"), JSON.stringify(jsonItems, null, 2), "utf8");

console.log("Wrote tmp files, items:", n);

const INDEX_PATH = path.join(ROOT, "index.html");
const READING_START = "<!-- READING_SECTION_AUTO_START -->";
const READING_END = "<!-- READING_SECTION_AUTO_END -->";
let indexHtml = fs.readFileSync(INDEX_PATH, "utf8");
const i0 = indexHtml.indexOf(READING_START);
const i1 = indexHtml.indexOf(READING_END);
if (i0 === -1 || i1 === -1 || i1 <= i0) throw new Error("Reading markers missing");
indexHtml =
  indexHtml.slice(0, i0 + READING_START.length) +
  "\n" +
  section +
  "\n    " +
  indexHtml.slice(i1);
fs.writeFileSync(INDEX_PATH, indexHtml, "utf8");
console.log("Patched index.html reading section");

function patchJsonLd(htmlStr) {
  const JSONLD_START = "<!-- JSONLD_AUTO_START -->";
  const start = htmlStr.indexOf(JSONLD_START);
  const scriptTag = htmlStr.indexOf("<script", start);
  const jsonStart = htmlStr.indexOf("{", scriptTag);
  const scriptClose = htmlStr.indexOf("</script>", jsonStart);
  if (scriptClose === -1) throw new Error("JSON-LD script close not found");
  const jsonStr = htmlStr.slice(jsonStart, scriptClose).trim();
  const obj = JSON.parse(jsonStr);
  const itemList = obj["@graph"].find((x) => x["@type"] === "ItemList");
  if (!itemList) throw new Error("ItemList not in @graph");
  itemList.numberOfItems = n;
  itemList.itemListElement = jsonItems;
  return (
    htmlStr.slice(0, jsonStart) +
    JSON.stringify(obj, null, 2) +
    "\n" +
    htmlStr.slice(scriptClose)
  );
}

const htmlPatched = patchJsonLd(fs.readFileSync(INDEX_PATH, "utf8"));
fs.writeFileSync(INDEX_PATH, htmlPatched, "utf8");
console.log("Patched index.html JSON-LD ItemList");
