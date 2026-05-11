import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/articles.json"), "utf8"));

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

const liEn = data.items
  .map(
    (it) => `          <li>
            <a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.title_en)}</a>
            <span class="reading-meta">${esc(it.meta_en)}</span>
          </li>`
  )
  .join("\n");

const liZh = data.items
  .map(
    (it) => `          <li>
            <a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.title_zh)}</a>
            <span class="reading-meta">${esc(it.meta_zh)}</span>
          </li>`
  )
  .join("\n");

const section = `      <section id="reading">
        <h2 class="page-section-title lang-en">Latest official articles</h2>
        <h2 class="page-section-title lang-zh">最新官方文章（外链）</h2>
        <p class="reading-intro lang-en">
          ${esc(introEn)}
        </p>
        <p class="reading-intro lang-zh">
          ${esc(introZh)}
        </p>

        <ul class="reading-list lang-en">
${liEn}
        </ul>

        <ul class="reading-list lang-zh">
${liZh}
        </ul>
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
