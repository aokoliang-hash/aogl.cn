#!/usr/bin/env node
/**
 * Generates _multilang/contact.html from data/site-contact.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CFG_PATH = path.join(ROOT, "data", "site-contact.json");
const OUT = path.join(ROOT, "_multilang", "contact.html");

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s) {
  return esc(s);
}

function optionalLink(url, label, blank = true) {
  const u = (url || "").trim();
  if (!u) return "";
  const rel = blank ? ' target="_blank" rel="noopener noreferrer me"' : "";
  return `<a href="${escAttr(u)}"${rel}>${esc(label)}</a>`;
}

function listItem(label, inner) {
  if (!inner) return "";
  return `      <li class="contact-item">
        <span class="contact-label">${esc(label)}</span>
        <span class="contact-value">${inner}</span>
      </li>\n`;
}

function buildList(lang, cfg) {
  const email = (cfg.email || "").trim();
  const items = {
    en: {
      email: "Email",
      github: "GitHub profile",
      repo: "Site repository",
      issues: "Report a broken link (Issues)",
      facebook: "Facebook",
      twitter: "X (Twitter)",
      instagram: "Instagram",
    },
    zh: {
      email: "电子邮箱",
      github: "GitHub 主页",
      repo: "本站源码仓库",
      issues: "链接纠错 / Issue",
      facebook: "Facebook",
      twitter: "X（Twitter）",
      instagram: "Instagram",
    },
    ja: {
      email: "メール",
      github: "GitHub",
      repo: "リポジトリ",
      issues: "リンク報告（Issues）",
      facebook: "Facebook",
      twitter: "X（Twitter）",
      instagram: "Instagram",
    },
    ko: {
      email: "이메일",
      github: "GitHub",
      repo: "저장소",
      issues: "링크 신고（Issues）",
      facebook: "Facebook",
      twitter: "X（Twitter）",
      instagram: "Instagram",
    },
    fr: {
      email: "E-mail",
      github: "Profil GitHub",
      repo: "Dépôt du site",
      issues: "Signaler un lien (Issues)",
      facebook: "Facebook",
      twitter: "X (Twitter)",
      instagram: "Instagram",
    },
    ru: {
      email: "Эл. почта",
      github: "Профиль GitHub",
      repo: "Репозиторий сайта",
      issues: "Сообщить о ссылке (Issues)",
      facebook: "Facebook",
      twitter: "X (Twitter)",
      instagram: "Instagram",
    },
    ar: {
      email: "البريد الإلكتروني",
      github: "GitHub",
      repo: "مستودع الموقع",
      issues: "الإبلاغ عن رابط (Issues)",
      facebook: "Facebook",
      twitter: "X (Twitter)",
      instagram: "Instagram",
    },
  }[lang];

  let html = "";
  if (email) {
    html += listItem(
      items.email,
      `<a href="mailto:${escAttr(email)}">${esc(email)}</a>`
    );
  }
  html += listItem(items.github, optionalLink(cfg.githubProfile, cfg.githubProfile.replace(/^https?:\/\//, "")));
  html += listItem(items.repo, optionalLink(cfg.githubRepo, "aokoliang-hash/aogl.cn"));
  html += listItem(items.issues, optionalLink(cfg.githubIssues, items.issues));
  html += listItem(items.facebook, optionalLink(cfg.facebook, items.facebook));
  html += listItem(items.twitter, optionalLink(cfg.twitter, items.twitter));
  html += listItem(items.instagram, optionalLink(cfg.instagram, items.instagram));
  return html.trim() ? `    <ul class="contact-list">\n${html}    </ul>\n` : "";
}

function sameAs(cfg) {
  const urls = [
    cfg.githubProfile,
    cfg.githubRepo,
    cfg.facebook,
    cfg.twitter,
    cfg.instagram,
  ]
    .map((u) => (u || "").trim())
    .filter(Boolean);
  return urls;
}

function jsonLd(cfg) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "https://aogl.cn/en/contact.html#webpage",
        "url": "https://aogl.cn/en/contact.html",
        "name": "Contact aogl.cn",
        "description":
          "How to reach the maintainer of aogl.cn — email, GitHub, and social links.",
        "inLanguage": ["en", "zh-CN"],
        "isPartOf": { "@type": "WebSite", "name": "aogl.cn", "url": "https://aogl.cn/" },
      },
      {
        "@type": "Organization",
        "@id": "https://aogl.cn/#organization",
        "name": "aogl.cn",
        "url": "https://aogl.cn/",
        "email": (cfg.email || "").trim() || undefined,
        "sameAs": sameAs(cfg),
      },
    ],
  };
  return JSON.stringify(graph);
}

function section(lang, cfg, lead, note) {
  return `  <div class="lang-${lang}">\n    <p class="contact-lead">${lead}</p>\n${buildList(lang, cfg)}    <p class="contact-note">${note}</p>\n  </div>\n`;
}

function main() {
  const cfg = JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));
  const ld = jsonLd(cfg);

  const html = `<!DOCTYPE html><html lang="en" data-title-en="Contact — aogl.cn" data-title-zh="联系我们 — aogl.cn" data-title-ja="お問い合わせ — aogl.cn" data-title-ko="문의 — aogl.cn" data-title-fr="Contact — aogl.cn" data-title-ru="Контакты — aogl.cn" data-title-ar="اتصل بنا — aogl.cn" data-desc-en="Contact the aogl.cn maintainer: email, GitHub, and optional social profiles. Not a corporate support desk." data-desc-zh="联系 aogl.cn 维护者：邮箱、GitHub 与可选社交主页；非企业客服中心。" data-desc-ja="aogl.cn 運営者への連絡先（メール・GitHub 等）。" data-desc-ko="aogl.cn 운영자 연락처(이메일·GitHub 등)." data-desc-fr="Contacter le responsable de aogl.cn — e-mail, GitHub, réseaux." data-desc-ru="Как связаться с автором aogl.cn — почта, GitHub." data-desc-ar="كيفية التواصل مع صاحب aogl.cn — بريد وGitHub."><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="favicon.svg" type="image/svg+xml" sizes="any">
  <meta name="description" content="Contact the aogl.cn maintainer: email, GitHub, and optional social profiles. Not a corporate support desk.">
  <title>Contact — aogl.cn</title>
  <link rel="canonical" href="https://aogl.cn/en/contact.html">
  <link rel="alternate" hreflang="en" href="https://aogl.cn/en/contact.html">
  <link rel="alternate" hreflang="zh-CN" href="https://aogl.cn/contact.html">
  <link rel="alternate" hreflang="zh-Hant" href="https://aogl.cn/zh/contact.html">
  <link rel="alternate" hreflang="ja" href="https://aogl.cn/ja/contact.html">
  <link rel="alternate" hreflang="ko" href="https://aogl.cn/ko/contact.html">
  <link rel="alternate" hreflang="fr" href="https://aogl.cn/fr/contact.html">
  <link rel="alternate" hreflang="ru" href="https://aogl.cn/ru/contact.html">
  <link rel="alternate" hreflang="ar" href="https://aogl.cn/ar/contact.html">
  <link rel="alternate" hreflang="x-default" href="https://aogl.cn/en/contact.html">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://aogl.cn/en/contact.html">
  <meta property="og:title" content="Contact — aogl.cn">
  <meta property="og:description" content="Email and GitHub for the personal aogl.cn bookmark site maintainer.">
  <meta property="og:image" content="https://aogl.cn/og-default.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1536">
  <meta property="og:image:height" content="1024">
  <meta property="og:image:alt" content="aogl.cn">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://aogl.cn/og-default.png">
  <script type="application/ld+json">${ld}</script>
  <link rel="stylesheet" href="css/privacy.css">
</head>
<body class="locale-en">
  <script src="js/i18n.js"></script>
  <div class="top">
    <a href="index.html" class="lang-en">← Back to home</a>
    <a href="index.html" class="lang-zh">← 返回首页</a>
    <a href="index.html" class="lang-ja">← ホームへ</a>
    <a href="index.html" class="lang-ko">← 홈으로</a>
    <a href="index.html" class="lang-fr">← Accueil</a>
    <a href="index.html" class="lang-ru">← На главную</a>
    <a href="index.html" class="lang-ar">← العودة للرئيسية</a>
    <div class="lang-switch">
      <select class="aogl-lang-select" id="aogl-lang-contact" aria-label="Language"></select>
    </div>
  </div>
  <h1 class="lang-en">Contact</h1>
  <h1 class="lang-zh">联系我们</h1>
  <h1 class="lang-ja">お問い合わせ</h1>
  <h1 class="lang-ko">문의</h1>
  <h1 class="lang-fr">Contact</h1>
  <h1 class="lang-ru">Контакты</h1>
  <h1 class="lang-ar">اتصل بنا</h1>
  <p class="lang-en">Last updated: <span class="aogl-today"></span></p>
  <p class="lang-zh">最后更新：<span class="aogl-today"></span></p>
  <p class="lang-ja">最終更新：<span class="aogl-today"></span></p>
  <p class="lang-ko">최종 업데이트: <span class="aogl-today"></span></p>
  <p class="lang-fr">Dernière mise à jour : <span class="aogl-today"></span></p>
  <p class="lang-ru">Последнее обновление: <span class="aogl-today"></span></p>
  <p class="lang-ar">آخر تحديث: <span class="aogl-today"></span></p>
${section(
  "en",
  cfg,
  "<strong>aogl.cn</strong> is maintained by one person in spare time. Use the channels below for link corrections, takedown requests, or general notes about the site — not for vendor product support.",
  "GitHub Issues are preferred for public, traceable fixes. Email may be slower. This page does not offer phone or live chat."
)}
${section(
  "zh",
  cfg,
  "<strong>aogl.cn</strong> 由个人业余维护。可通过下列方式联系站长：链接纠错、撤下某站、或对站点本身的说明。<strong>不是</strong>各 AI 厂商的产品客服。",
  "建议优先使用 GitHub Issue（公开、可追踪）；邮件回复可能较慢。本站不提供电话或在线客服。"
)}
${section(
  "ja",
  cfg,
  "<strong>aogl.cn</strong> は個人が運営しています。リンク修正・掲載取下げ・サイトに関する連絡は下記から。各ベンダーの製品サポートではありません。",
  "修正は GitHub Issue を推奨します。メールは返信が遅れる場合があります。"
)}
${section(
  "ko",
  cfg,
  "<strong>aogl.cn</strong>은 개인이 운영합니다. 링크 수정·삭제 요청·사이트 관련 문의는 아래 채널을 이용하세요. 벤더 제품 지원이 아닙니다.",
  "GitHub Issue를 권장합니다. 이메일은 답변이 늦을 수 있습니다."
)}
${section(
  "fr",
  cfg,
  "<strong>aogl.cn</strong> est tenu par une seule personne. Utilisez les canaux ci-dessous pour signaler un lien, demander un retrait ou commenter le site — pas le support des éditeurs d’outils.",
  "Les issues GitHub sont préférées. L’e-mail peut être plus lent."
)}
${section(
  "ru",
  cfg,
  "<strong>aogl.cn</strong> ведётся одним человеком. Ниже — каналы для исправления ссылок, удаления записей и заметок о сайте. Это не поддержка продуктов вендоров.",
  "Предпочтительны GitHub Issues. Ответ по почте может занять больше времени."
)}
${section(
  "ar",
  cfg,
  "يُدار <strong>aogl.cn</strong> بشكل شخصي. استخدم القنوات أدناه لتصحيح الروابط أو طلب الإزالة أو ملاحظات عن الموقع — وليس دعم منتجات المورّدين.",
  "يُفضَّل GitHub Issues. قد يتأخر الرد على البريد."
)}
  <p class="lang-en">Editorial scope and limits: <a href="about.html">About</a> · <a href="privacy.html">Privacy</a></p>
  <p class="lang-zh">站点说明与隐私：<a href="about.html">关于本站</a> · <a href="privacy.html">隐私政策</a></p>
  <p class="lang-ja"><a href="about.html">サイトについて</a> · <a href="privacy.html">プライバシー</a></p>
  <p class="lang-ko"><a href="about.html">사이트 소개</a> · <a href="privacy.html">개인정보</a></p>
  <p class="lang-fr"><a href="about.html">À propos</a> · <a href="privacy.html">Confidentialité</a></p>
  <p class="lang-ru"><a href="about.html">О сайте</a> · <a href="privacy.html">Конфиденциальность</a></p>
  <p class="lang-ar"><a href="about.html">حول الموقع</a> · <a href="privacy.html">الخصوصية</a></p>
</body></html>
`;

  fs.writeFileSync(OUT, html, "utf8");
  console.log("Wrote _multilang/contact.html from data/site-contact.json");
}

main();
