/**
 * Inject shared primary nav into _multilang/index.html.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { navHtml } from "./site-nav.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = path.join(ROOT, "_multilang", "index.html");
const START = "<!-- SITE_NAV_AUTO_START -->";
const END = "<!-- SITE_NAV_AUTO_END -->";

let index = fs.readFileSync(INDEX_PATH, "utf8");
const navInner = navHtml({
  activeFile: "index.html",
  activeContext: "tools",
  toolsHref: "#tools-directory",
});
const block = `${START}\n${navInner}\n${END}`;

const markedRe = new RegExp(
  `${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
);
if (markedRe.test(index)) {
  index = index.replace(markedRe, block);
} else {
  index = index.replace(
    /<nav class="site-nav" aria-label="Primary">[\s\S]*?<\/nav>/,
    `<nav class="site-nav" aria-label="Primary">\n${block}\n      </nav>`,
  );
}

fs.writeFileSync(INDEX_PATH, index, "utf8");
console.log("Updated SITE_NAV in _multilang/index.html");
