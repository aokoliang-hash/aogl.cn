# 首页原创文章与 SEO — 具体实施说明（aogl.cn）

> 适用当前仓库：**静态 HTML**、**`_multilang/*.html` 母版**、`npm run build-seo-locales` 多语言输出、`inject-index-pills` 仅替换首页 **INDEX_PILLS** 注释区间。  
> 目标：后台写的**原创**能稳定收录、独立 URL、与 RSS/外链区**不抢意**，且便于你长期维护。

---

## 1. 设计原则（先做这几条）

| 原则 | 说明 |
|------|------|
| **一文一 URL** | 正文放在**独立页面**（如 `/articles/xxx.html`），首页只放**摘要 + 链接**。避免长文只堆在 `index.html` 里、没有 canonical 承载页。 |
| **正文进首屏 HTML** | 爬虫与无 JS 环境应能直接读到标题与主体。避免「首页壳 + 纯前端拉全文」作为唯一呈现方式。 |
| **canonical 唯一** | 每篇文章页 `<link rel="canonical">` 指向自己；不在多个路径上重复同一全文。 |
| **结构化数据** | 文章页使用 **`BlogPosting` 或 `Article`** JSON-LD（见 §7）；首页列表可用 `ItemList` 指向各文 URL（可选）。 |
| **与广告区关系** | 若有 AdSense：长原创放在**文章页**或首页**独立成段**的区块（你们已有「编辑说明」类要求），避免整页只有链接列表。 |

---

## 2. 信息架构（推荐）

### 2.1 URL 与目录（推荐默认）

| 用途 | 路径 | 说明 |
|------|------|------|
| 文章母版（多语言合一） | `_multilang/articles/<slug>.html` | 与 `privacy.html` / `changelog.html` 同模式：`lang-en` … `lang-ar` 分块。 |
| 简体根站输出 | `/articles/<slug>.html` | `build-seo-locales` 从母版生成（与现有逻辑一致）。 |
| 各语言输出 | `/en/articles/<slug>.html`、`/zh/articles/<slug>.html` 等 | 需在构建里为 `articles/*.html` 做子路径（见 §6）。 |
| 首页入口 | `_multilang/index.html` 内固定 **注释区间** | 只放最近 N 篇的**标题、日期、摘要、链接**（见 §5）。 |

若暂时不做 `/en/articles/`，可**第一阶段只做中文**：仅 `_multilang/articles/*.html` 含 `lang-zh`，其它语言块留空或英文摘要，由 `stripAlternateLocales` 剥掉——但长期仍建议七语同结构，利于 `hreflang`。

### 2.2 与「原创资源」目录 `original/` 的关系

- 仓库内 **`original/`** 当前多为图片/实验页，**不宜**当作文章 CMS 存储路径。  
- 建议：**文章元数据与正文**放在 **`data/articles/`**（JSON/Markdown），构建产物进 `_multilang/articles/`；**图片**仍放 `original/` 或 `images/articles/`，文中用绝对路径或根相对路径引用。

---

## 3. 内容模型（后台导出建议）

### 3.1 每篇最小字段（JSON 示例）

```json
{
  "slug": "first-party-note-2026",
  "datePublished": "2026-05-15",
  "dateModified": "2026-05-15",
  "author": "aogl.cn",
  "titleZh": "本站第一篇原创备忘",
  "titleEn": "First editorial note",
  "descZh": "说明写作目的与信息边界，约 150 字以内，供 meta description 与首段一致。",
  "descEn": "One or two sentences for meta description.",
  "bodyZh": "<p>段落 HTML…</p>",
  "bodyEn": "<p>English paragraphs…</p>",
  "heroImage": "",
  "indexExcerptZh": "首页卡片用 1～2 句，纯文本或允许少量 <strong>。",
  "indexExcerptEn": "1–2 sentences for the home teaser."
}
```

- **`slug`**：小写字母、数字、连字符；与文件名一致。  
- **`body*`**：允许安全子集的 HTML（后台白名单消毒），构建时 **`esc()`** 或模板侧统一转义，避免 XSS。  
- **`indexExcerpt*`**：与正文不重复过长；首页列表用。

### 3.2 可选：Markdown 源

- 若后台更易出 Markdown：放 `data/articles/<slug>.md` + frontmatter（`title`, `date`, `description`），构建时用 **`marked`** 或 **`markdown-it`** 转 HTML（需加依赖）。当前仓库无 Markdown 依赖，**首版用 JSON + HTML 片段最省事**。

---

## 4. 首页集成（具体落点）

### 4.1 在 `_multilang/index.html` 增加「只给脚本替换」的区间

在 **`#pillars`** 上方或 `#intro` 下方（与产品一致即可），插入**成对注释**，避免被 `inject-index-pills` 以外的脚本误伤：

```html
      <!-- INDEX_ORIGINALS_AUTO_START -->
      <section id="originals" class="site-originals" aria-labelledby="originals-title">
        <h2 id="originals-title" class="page-section-title lang-zh">本站原创</h2>
        <!-- 构建脚本写入：各 lang 的列表或留空占位 -->
      </section>
      <!-- INDEX_ORIGINALS_AUTO_END -->
```

- **禁止**把全文写死在首页；列表项结构示例：

```html
<article class="original-teaser">
  <h3 class="lang-zh"><a href="articles/slug.html">标题</a></h3>
  <p class="meta lang-zh">2026-05-15</p>
  <p class="lang-zh">摘要一句。</p>
</article>
```

### 4.2 与 `inject-index-pills.mjs` 的关系

- `inject-index-pills.mjs` **只**替换 `INDEX_PILLS_AUTO_*` 之间内容；**原创区块用独立 marker**（如上 `INDEX_ORIGINALS_*`），新建 `scripts/inject-index-originals.mjs` 或在统一 **`build-articles.mjs`** 末尾写首页片段，二选一即可。

---

## 5. 新增构建流水线（推荐脚本职责）

新建 **`scripts/build-articles.mjs`**（名称可自定），建议职责：

1. 读取 **`data/articles/*.json`**（或单文件 `data/articles.json` 数组）。  
2. 按 slug 生成 **`_multilang/articles/<slug>.html`**：  
   - `<head>`：`title`、`meta description`、`canonical`（英文母版 canonical 用 `https://aogl.cn/en/articles/slug.html` 或与现站一致策略）、`og:*`。  
   - `<body>`：七语 `hub-prose` 或 `reading-intro` 风格块 + 正文。  
   - 可选：`<script type="application/ld+json">` **BlogPosting**（§7）。  
3. 根据「最近 N 条」生成 **`INDEX_ORIGINALS`** 片段，**字符串替换**写回 `_multilang/index.html`。  
4. 若存在 **`articles/sitemap` 需求**：追加 `data/articles/sitemap-chunk.xml` 或在主 `sitemap.xml` 生成逻辑里合并（§6）。

**执行顺序建议**（写入 `package.json`）：

```json
"build-articles": "node scripts/build-articles.mjs",
"build-site": "npm run build-hubs && npm run build-articles && npm run build-index-pills && npm run build-seo-locales"
```

> 注意：`build-index-pills` 若总在 `build-articles` **之后**运行，则 pills 不会被文章脚本覆盖；若文章脚本在 pills **之后**跑，需保证不破坏 `INDEX_PILLS` 区间。

---

## 6. 扩展 `build-seo-locale-pages.mjs`（必须改的点）

当前 `PAGES` 为**单层文件名**列表；文章在子目录 **`articles/<slug>.html`** 时需二选一：

**方案 A（推荐）**：`PAGES` 改为支持子路径，例如：

```js
const PAGES = [
  "index.html",
  "portal.html",
  // …
  "changelog.html",
  // 文章：显式列出或由 glob 生成
  "articles/slug-one.html",
  "articles/slug-two.html",
];
```

- `urlZhCn("articles/foo.html")` 需得到 `https://aogl.cn/articles/foo.html`（在 `urlZhCn` / `urlLocale` 中把 `articles/` 前缀保留）。当前实现是 `` `${BASE}/${filename}` ``，**已满足**，只需把带斜杠的 `filename` 放进 `PAGES` 并确认 **`absolutizeAssetRefs`** 不会错误改写 `articles/` 下链接（现逻辑对子目录一般仍加 `/` 前缀，需做一次联调）。

**方案 B**：文章不放进 `PAGES`，单独维护 **`sitemap-articles.xml`** + `robots.txt` 中 `Sitemap:` 多行——适合文章量很大时。

**sitemap**：与 `changelog` 类似，文章 URL 的 `priority` 可略高于工具页、低于首页（例如 `0.65`），`changefreq` 用 `monthly` 或 `yearly`。

---

## 7. 结构化数据（文章页模板片段）

每篇 **`_multilang/articles/<slug>.html`** 的英文 canonical 示例下，可增加（字段用构建时注入）：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "First editorial note",
  "datePublished": "2026-05-15",
  "dateModified": "2026-05-15",
  "author": { "@type": "Organization", "name": "aogl.cn" },
  "publisher": { "@type": "Organization", "name": "aogl.cn", "url": "https://aogl.cn/" },
  "mainEntityOfPage": "https://aogl.cn/en/articles/first-party-note-2026.html",
  "inLanguage": "en",
  "description": "One or two sentences…"
}
</script>
```

- 多语言：可为每个 locale 输出一页时把 **`inLanguage`**、**`mainEntityOfPage`** 改成该语言 URL；或只在一语详述、其它语言用 `WebPage` 简化——**优先至少中英文各一段合法 JSON-LD**。  
- 生成后跑现有 **`slimJsonLdScripts`** 会改写 `@id` 等，需**联调** `patchJsonLdNode` 是否误伤 `BlogPosting`（必要时在 `slimLocaleHeadExtras` 里跳过 `articles` 路径或扩展 `patchJsonLdNode`）。

---

## 8. 多语言与 `hreflang`

- 母版 `_multilang/articles/<slug>.html` 保留 **`data-title-*` / `data-desc-*`**（与 `changelog` 一致），交给 **`applyLocaleHead`**。  
- **`replaceHreflangCluster`** 已为任意 `filename` 生成 alternates；确保 **`canonical`** 与各语言 URL 一致。  
- 若暂只做中文：母版仅 `lang-zh` 有正文，构建后英文目录是否生成空壳——建议**要么七语都有一句摘要**，要么英文 **noindex**（`meta robots`）——后者需改构建逻辑，一般**不推荐**；更简单是英文也用短摘要占位。

---

## 9. 后台 CMS 对接清单（给你或外包）

| 项 | 要求 |
|----|------|
| 导出格式 | JSON 数组文件或每篇一 JSON，字段见 §3。 |
| HTML 消毒 | 后台只允许 `p, br, strong, em, a, ul, ol, li, h2, h3, code, pre` 等；`a` 强制 `rel="noopener noreferrer"`、`target="_blank"` 按站规。 |
| 图片 | 提供 `https://aogl.cn/...` 绝对 URL 或站根相对路径；宽高可选，利于 CLS。 |
| 发布 | Webhook 或 CI：推送到 Git 后执行 `npm run build-site`（含 `build-articles`），再部署静态文件。 |
| 回滚 | Git revert + 重建；不在服务器上手改生成 HTML。 |

---

## 10. 发布前检查清单（SEO）

- [ ] 每篇有**唯一** `canonical`。  
- [ ] `title` 与 `h1` 主关键词一致但不堆砌。  
- [ ] `meta description` 与首段大意一致，**约 70～160 字（中文可略宽）**。  
- [ ] 首页仅摘要，**正文只在文章页**。  
- [ ] 文章页 JSON-LD 无语法错误（[Rich Results Test](https://search.google.com/test/rich-results)）。  
- [ ] `sitemap.xml` 含新 URL（或子 sitemap 已声明）。  
- [ ] 站内从首页 `#originals`、相关 `#cat-*` 或 `changelog` **至少一条内链**指向新文（冷启动）。  
- [ ] Lighthouse：LCP 图片 `loading`/`fetchpriority` 按需设置。

---

## 11. 与《站点原创内容与实施节奏》的衔接

- **§6 第 3 周**「500～800 字短文」：直接对应 **`articles/<slug>.html`** 正文长度与内链推广。  
- **§6 第 4 周** Search Console：针对**文章 URL** 与首页摘要展现，调 `title` / `description` / `data-desc-*`。  
- **`changelog.html`**：每批上线文章可在母版里加一条「新增原创：…」 human note。

---

## 12. 实施顺序（建议工单拆分）

1. 定 URL：`/articles/<slug>.html` + 多语言子路径策略。  
2. 加 `data/articles/` 示例 JSON + 一篇示例 `_multilang/articles/*.html` 手写对齐设计。  
3. 实现 `build-articles.mjs`（读 JSON → 写母版文章页 + 写 `INDEX_ORIGINALS`）。  
4. 扩展 `PAGES` 或子 sitemap；`npm run build-seo-locales` 全量通过。  
5. 联调 JSON-LD 与 `slimJsonLdScripts`。  
6. 接入 CI / 后台发布命令；文档本页入 `README` 或内部 wiki 链接。

---

*文档版本：v1 · 与仓库实现无自动绑定；落地 `build-articles.mjs` 后可将「待实现」改为「已实现」并补提交记录。*
