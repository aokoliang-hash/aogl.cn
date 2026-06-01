/**
 * AI tools directory → local tool guide pages.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeUrl, slugFromUrl } from "./brief-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const TOOL_GUIDES_DIR = path.join(ROOT, "data", "tool-guides");
export const TOOLS_DATA = path.join(ROOT, "data", "tools-directory.json");
export const LANGS = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

export { slugFromUrl, normalizeUrl };

export function toolGuidePath(slug) {
  return `tool-guides/${slug}.html`;
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

export function loadToolsDirectory() {
  return JSON.parse(fs.readFileSync(TOOLS_DATA, "utf8"));
}

export function loadAllToolGuides() {
  if (!fs.existsSync(TOOL_GUIDES_DIR)) return [];
  return fs
    .readdirSync(TOOL_GUIDES_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOOL_GUIDES_DIR, f), "utf8")))
    .filter((t) => t.slug)
    .sort((a, b) => String(a.name_en || "").localeCompare(String(b.name_en || "")));
}

export function toolName(guide, lang) {
  if (lang === "zh") return guide.name_zh || guide.name_en;
  if (lang === "en") return guide.name_en || guide.name_zh;
  return guide.name_en || guide.name_zh;
}

export function catTitle(guide, lang) {
  if (lang === "zh") return guide.category_title_zh || guide.category_title_en;
  if (lang === "en") return guide.category_title_en;
  return guide.category_title_en;
}

const CAT_CONTEXT = {
  "chat-llm": {
    en: "chat assistants and frontier large language models",
    zh: "对话助手与前沿大语言模型",
    uses_en: ["Everyday Q&A, drafting, and brainstorming", "Multimodal chat when the product supports images or files", "Trying vendor-specific models before API integration"],
    uses_zh: ["日常问答、起草与头脑风暴", "支持图片/文件时的多模态对话", "接 API 前先体验厂商模型"],
  },
  image: {
    en: "text-to-image and creative generation tools",
    zh: "文生图与创意生成工具",
    uses_en: ["Concept art, marketing visuals, and storyboards", "Style exploration with prompt iteration", "Exporting assets for further edit in design apps"],
    uses_zh: ["概念图、营销视觉与分镜", "用提示词迭代探索风格", "导出素材到设计软件继续精修"],
  },
  video: {
    en: "AI video generation and avatar products",
    zh: "AI 视频生成与数字人产品",
    uses_en: ["Short clips from text or image prompts", "Talking-head or localized dubbing workflows", "Rapid prototypes before full production"],
    uses_zh: ["文字/图片生成短视频", "口播、配音或本地化视频流程", "正式拍摄前的快速样片"],
  },
  coding: {
    en: "AI-assisted coding environments and agents",
    zh: "AI 编程辅助与智能体环境",
    uses_en: ["Inline completion and refactors in the IDE", "Repo-aware Q&A and small feature scaffolding", "Pairing with your existing Git workflow"],
    uses_zh: ["IDE 内补全与重构", "结合仓库上下文的问答与小功能脚手架", "配合现有 Git 工作流使用"],
  },
  audio: {
    en: "music, voice, and podcast AI tools",
    zh: "音乐、语音与播客类 AI 工具",
    uses_en: ["Text-to-speech and voice cloning (where permitted)", "Generative music beds or demos", "Transcription and edit-by-text podcast tools"],
    uses_zh: ["文字转语音与（合规前提下）声音克隆", "生成音乐片段或 Demo", "播客转写与按文本剪辑"],
  },
  search: {
    en: "AI-native search and literature assistants",
    zh: "AI 搜索与文献辅助工具",
    uses_en: ["Questions that need cited web sources", "Academic or market research with summaries", "Comparing answers across multiple pages quickly"],
    uses_zh: ["需要引用来源的检索问题", "学术或行业调研摘要", "快速对比多个网页观点"],
  },
  writing: {
    en: "writing, notes, and slide AI features",
    zh: "写作、笔记与演示文稿 AI 功能",
    uses_en: ["Long-form outlines and tone rewrites", "Meeting notes tied to docs", "Auto-generated decks from bullet points"],
    uses_zh: ["长文提纲与语气改写", "会议记录同步到文档", "由要点生成演示文稿"],
  },
  "platform-api": {
    en: "model APIs, hosting, and inference platforms",
    zh: "模型 API、托管与推理平台",
    uses_en: ["Shipping features on OpenAI-compatible or vendor SDKs", "Choosing models by latency, cost, and license", "Running open-weight models via hosted endpoints"],
    uses_zh: ["用官方或兼容 SDK 上线功能", "按延迟、成本与许可选型", "通过托管端点跑开源权重模型"],
  },
};

export function guideDesc(guide, lang) {
  const name = toolName(guide, lang);
  const cat = catTitle(guide, lang);
  if (lang === "zh") {
    return `${name}（${cat}）— aogl.cn 工具简介与官网跳转。`;
  }
  return `${name} (${cat}) — short guide on aogl.cn with link to the official site.`;
}

export function buildToolGuideBodyHtml(guide, lang) {
  const name = toolName(guide, lang);
  const catId = guide.category_id || "chat-llm";
  const ctx = CAT_CONTEXT[catId] || CAT_CONTEXT["chat-llm"];
  const catLabel = catTitle(guide, lang);
  const domain = guide.domain || "";

  const note =
    lang === "zh"
      ? "<p class=\"brief-note\"><strong>说明：</strong>本页为 aogl.cn 书签站整理的工具简介，非厂商官方文档；功能与价格以官网为准。</p>"
      : "<p class=\"brief-note\"><strong>Note:</strong> Bookmark-style intro on aogl.cn — not the vendor’s official docs. Features and pricing are on their site.</p>";

  const intro =
    lang === "zh"
      ? `<p><strong>${escHtml(name)}</strong> 归类在「${escHtml(catLabel)}」，属于${escHtml(ctx.zh)}。本站收录便于从首页目录快速了解用途，再一键打开官网注册或使用。</p>`
      : `<p><strong>${escHtml(name)}</strong> is listed under “${escHtml(catLabel)}” (${escHtml(ctx.en)}). This page helps you decide whether to open the official site from our directory.</p>`;

  const uses = (lang === "zh" ? ctx.uses_zh : ctx.uses_en)
    .map((u) => `<li>${escHtml(u)}</li>`)
    .join("");
  const usesHeading = lang === "zh" ? "常见用途" : "Typical uses";
  const domainLine =
    lang === "zh"
      ? `<p>主域名：<code>${escHtml(domain)}</code>。若你已使用该工具，建议通过下方按钮访问官网以获取最新模型列表与账户设置。</p>`
      : `<p>Primary domain: <code>${escHtml(domain)}</code>. Use the button below for the live product, model list, and account settings.</p>`;

  return `${note}${intro}<h2>${escHtml(usesHeading)}</h2><ul class="brief-bullets">${uses}</ul>${domainLine}`;
}

export function collectToolsFromDirectory() {
  const data = loadToolsDirectory();
  const map = new Map();
  for (const cat of data.categories || []) {
    for (const tool of cat.tools || []) {
      const url = normalizeUrl(tool.url);
      const slug = tool.slug || slugFromUrl(url);
      const prev = map.get(url) || {
        slug,
        url,
        name_en: tool.name_en,
        name_zh: tool.name_zh,
        domain: tool.domain,
        category_ids: [],
        category_title_en: cat.title_en,
        category_title_zh: cat.title_zh,
      };
      if (!prev.category_ids.includes(cat.id)) {
        prev.category_ids.push(cat.id);
        if (!prev.category_title_en) prev.category_title_en = cat.title_en;
        if (!prev.category_title_zh) prev.category_title_zh = cat.title_zh;
      }
      map.set(url, prev);
    }
  }
  return map;
}
