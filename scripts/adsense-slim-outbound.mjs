#!/usr/bin/env node
/**
 * One-shot AdSense home/article outbound cleanup helpers.
 * - Slim #pillars on homepage
 * - Strip google.com/search SEO pills from article fragments
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = path.join(ROOT, "_multilang", "index.html");
const FRAG_DIR = path.join(ROOT, "data", "articles", "fragments");

function slimPillars() {
  let html = fs.readFileSync(INDEX, "utf8");
  const pillarsStart = html.indexOf('<section id="pillars"');
  const pillsStart = html.indexOf("<!-- INDEX_PILLS_AUTO_START -->");
  if (pillarsStart === -1 || pillsStart === -1) {
    throw new Error("pillars / INDEX_PILLS markers missing");
  }

  const slim = `      <section id="pillars" class="site-bookmarks-pillars site-bookmarks-pillars--slim">
        <p class="reading-intro site-primary-lead site-primary-lead--secondary lang-en">Hub bookmark rails and RSS walls were removed from the homepage for AdSense review. Browse <a href="articles/index.html">editorial demos</a> or <a href="about.html">About</a>.</p>
        <p class="reading-intro site-primary-lead site-primary-lead--secondary lang-zh">为降低首页外链密度，已去掉书签分区与短讯墙。请看 <a href="articles/index.html">原创 Demo</a> 或 <a href="about.html">关于本站</a>。</p>
        <p class="reading-intro site-primary-lead site-primary-lead--secondary lang-ja">ホームのブックマーク壁を削除しました。<a href="articles/index.html">編集デモ</a> または <a href="about.html">About</a> へ。</p>
        <p class="reading-intro site-primary-lead site-primary-lead--secondary lang-ko">홈 북마크 벽을 제거했습니다. <a href="articles/index.html">편집 데모</a> 또는 <a href="about.html">소개</a>.</p>
        <p class="reading-intro site-primary-lead site-primary-lead--secondary lang-fr">Les rails de signets ont été retirés de l’accueil. Voir <a href="articles/index.html">démos</a> ou <a href="about.html">À propos</a>.</p>
        <p class="reading-intro site-primary-lead site-primary-lead--secondary lang-ru">Закладки с главной убраны. Смотрите <a href="articles/index.html">демо</a> или <a href="about.html">О сайте</a>.</p>
        <p class="reading-intro site-primary-lead site-primary-lead--secondary lang-ar">أُزيلت جدران الإشارات من الصفحة الرئيسية. راجع <a href="articles/index.html">العروض</a> أو <a href="about.html">حول</a>.</p>
      </section>
`;

  html = html.slice(0, pillarsStart) + slim + html.slice(pillsStart);
  fs.writeFileSync(INDEX, html, "utf8");
  console.log("Slimmed #pillars on homepage");
}

function stripGooglePills() {
  let changed = 0;
  for (const f of fs.readdirSync(FRAG_DIR)) {
    if (!f.endsWith(".html")) continue;
    const p = path.join(FRAG_DIR, f);
    let t = fs.readFileSync(p, "utf8");
    const before = t;
    t = t.replace(
      /\s*<a class="pill" href="https:\/\/www\.google\.com\/search\?[^"]*"[^>]*>[^<]*<\/a>/g,
      ""
    );
    t = t.replace(
      /\s*<div class="pill-row hub-pill-row article-seo-pills"[^>]*>\s*<\/div>/g,
      ""
    );
    if (t !== before) {
      fs.writeFileSync(p, t, "utf8");
      changed += 1;
    }
  }
  console.log(`Stripped Google SEO pills from ${changed} fragment files`);
}

slimPillars();
stripGooglePills();
