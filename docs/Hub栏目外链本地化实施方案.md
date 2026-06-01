# Hub 栏目外链本地化实施方案

> 版本：2026-06-01  
> 状态：一期 + 二期 **已实施**（2026-06-01）  
> 关联：`docs/AdSense过审改动清单.md`、`tool-guides/`、`briefs/` 已上线模式

---

## 1. 背景与目标

### 1.1 现状

| 区域 | 导航（`index.html` 57–67 行） | 页内链接 |
|------|------------------------------|----------|
| AI 前沿 `#tools-directory` | 锚点 | ✅ 已 → `tool-guides/` |
| 首页 `#cat-*` / `#reading` | 锚点 | ✅ 已 → `briefs/` |
| **portal / brands / shopping / life / social / tech / games / tools** | 已 → 各 `*.html` Hub | ❌ Hub 内仍为 `target="_blank"` 直链外站 |

Hub 页本身已有 **4 段站长编辑说明**（`data/hubs/*.json` → `editorialHtml*`），**不需**把导航改成别的 URL。

### 1.2 目标

1. Hub 内「主榜 / 更多 / 新闻列表 / Hot mix」点击后，**先进入本站简介页**（利于 SEO、降低「纯外链站」印象）。
2. 简介页文末提供 **「打开官网 / 阅读原文」** 外链（`rel="noopener noreferrer"`）。
3. 与 `briefs/`、`tool-guides/` **共用** 路径解析、i18n 语言切换、`build-seo-locales` 多语种输出。
4. **不**本地化：Hub 顶部 Google 搜索 pill、页脚、站内 Hub 互链。

### 1.3 非目标

- 不转载原文全文；不抓取存正文。
- 不为同一 URL 重复建 `briefs` + `hub-links` 两套页（见 §3.2 去重）。

---

## 2. 范围与分期

### 2.1 数据来源（`data/hubs/*.json`）

| 字段 | 含义 | 一期 | 二期 |
|------|------|------|------|
| `top10[]` | 主榜域名入口 | ✅ | — |
| `more[]` | 更多入口 | ✅ | — |
| `newsGroups[].items[]` | 每牌 3 条官方稿件 | ✅ | — |
| `hotMixItems[]` | RSS 聚合标题卡 | — | ✅（优先 `briefs`） |
| `searchTags` | 仅用于 Google pill | ❌ 保持外链 | ❌ |

约 **8 个 Hub**（含 `tools.html` 实用工具 Hub，与首页 AI 工具目录不同）：portal、brands、shopping、life、social、tech、games、tools。

### 2.2 分期交付

| 阶段 | 内容 | 产出 |
|------|------|------|
| **一期** | top10 + more + newsGroups 本地化 | `data/hub-links/`、`hub-links/*.html`、Hub 构建改 href |
| **二期** | hotMix：已有 `briefs` 的链 brief，其余进 hub-links | `sync` 去重、Hot mix 卡片改 href |
| **三期**（可选） | 从 `og:description` 拉摘要、`hub-links/index.html` 总索引 | `npm run sync-hub-links:fetch` |

---

## 3. 技术设计

### 3.1 URL 路径

- 新目录：**`hub-links/<slug>.html`**
- 与 `tool-guides/`、`briefs/` 并列，避免与根目录 `tools.html` 混淆。
- Canonical：`https://aogl.cn/en/hub-links/<slug>.html`（构建脚本与 brief 一致）。

### 3.2 去重与跳转优先级

解析函数 `resolveLocalHref(url)`（`scripts/resolve-local-link.mjs`）：

1. 规范化 URL（去 hash、尾斜杠）。
2. 若存在于 **`data/briefs/`** → `briefs/<slug>.html`（Hot mix / 与首页重复的官方稿）。
3. 否则若存在于 **`data/hub-links/`** → `hub-links/<slug>.html`。
4. 否则构建时报错/警告，sync 阶段应为每条外链生成条目。

同一 URL 只保留 **一个** JSON 源文件；`hub` / `kind` 记为数组或主+副标签。

### 3.3 数据模型 `data/hub-links/<slug>.json`

```json
{
  "slug": "apple-com",
  "url": "https://www.apple.com/",
  "name_en": "Apple",
  "name_zh": "苹果",
  "title_en": "",
  "title_zh": "",
  "domain": "apple.com",
  "hub": "brands",
  "hubs": ["brands"],
  "kind": "rank",
  "kinds": ["rank"],
  "updated": "2026-06-01"
}
```

- **rank / more**：页内 H1 用 `name_*`。
- **news / hotmix**（仅进 hub-links 时）：H1 用 `title_*`，`name_*` 可为来源品牌名。

### 3.4 简介页模板

- 样式：`css/privacy.css` + `css/brief.css` + `css/tool-guide.css`（图标头）。
- 段落：说明非官方、分类（Hub 名）、常见用途 2–3 条、主域名。
- 文末蓝框：**打开官网 / 阅读原文** + 原始 URL。
- JSON-LD：`WebPage` + `about` → `WebSite`（url 为外链）。
- AdSense：`js/adsense.js` 在 `/hub-links/` 与 brief/tool-guides 同等 gated 加载。

### 3.5 构建链（写入 `package.json` `build-site`）

```text
sync-hub-links → build-hub-link-pages → build-hubs → build-seo-locales
```

顺序说明：先 sync 生成 JSON，再 build 静态 hub-links HTML，再 build-hubs 注入本地 href，最后多语种镜像。

### 3.6 i18n 语言切换

`js/i18n.js` 的 `CONTENT_DIRS` 增加 **`hub-links`**（与 `articles`、`briefs`、`tool-guides` 同级），保证 `/aogl.cn/hub-links/xxx.html` 切换语种路径正确。

### 3.7 Hub 页改动点（`scripts/build-hub-pages.mjs`）

| 选择器 | 改动 |
|--------|------|
| `.hub-rank-link` | `href=resolveLocalHref(t.url)`，去掉列表上 `target="_blank"` |
| `.hub-more-link` | 同上 |
| `.hub-news-list a` | 同上 |
| `.hub-hotmix-card-link` | 二期：同上 |
| `.pill`（Google 搜索） | **不改** |

### 3.8 SEO

- `build-seo-locale-pages.mjs`：`multilangHubLinkPages()` 纳入 sitemap。
- 预计新增约 **300–450** 个唯一 URL（去重后）；8 语种镜像后 sitemap 条目增加，属预期。

---

## 4. 脚本清单

| 脚本 | 作用 |
|------|------|
| `scripts/hub-link-utils.mjs` | slug、简介 HTML、Hub 语境文案 |
| `scripts/resolve-local-link.mjs` | briefs + hub-links URL → 本地路径 |
| `scripts/sync-hub-links.mjs` | 从 hubs JSON 收集并写入 `data/hub-links/` |
| `scripts/build-hub-link-pages.mjs` | 输出 `_multilang/hub-links/*.html` |
| `scripts/test-i18n-paths.mjs` | 增加 `hub-links` 用例 |

---

## 5. 验收标准

### 5.1 功能

- [x] 8 个 Hub 页主榜 / 更多 / 新闻列表点击均为站内路径（无 `target="_blank"` 于列表项）。
- [x] social / games 的 Hot mix 卡片：有 brief 的 → `briefs/`；无 brief 的 → `hub-links/`。
- [x] 简介页文末外链可打开正确官网。
- [x] 右上角语言切换：简体 / 繁体 / en 等路径含 `hub-links` 子路径与 `/aogl.cn` 部署前缀。

### 5.2 构建

```bash
npm run sync-hub-links
npm run build-hub-link-pages
npm run build-hubs
npm run build-seo-locales
# 或
npm run build-site
```

### 5.3 抽测 URL（本地 WAMP）

- `http://localhost:84/aogl.cn/brands.html` → 点 Apple → `hub-links/...html`
- `http://localhost:84/aogl.cn/social.html` → Hot mix 一条 → `briefs/...` 或 `hub-links/...`
- 切换英文 → `/aogl.cn/en/hub-links/...html`

---

## 6. AdSense / 深度 / SEO（预期，非保证）

| 维度 | 全部 Hub 本地化后的预期 |
|------|-------------------------|
| **AdSense** | 较现状更易通过「低价值内容」抽检，但**不保证**；仍依赖 12 篇原创、about、等待 3–7 天再申。大量模板简介页可能被视为薄内容，故广告仍 **gated** 在正文类 URL。 |
| **站点深度** | 横向书签说明变厚；**纵向深度**仍靠 12 篇原创。 |
| **SEO** | 内链与可索引 URL 增加，长尾（品牌名+简介）有机会；模板页不宜期待条条排名。 |

---

## 7. 与现有文档同步

实施完成后更新：

- `docs/AdSense过审改动清单.md` §0 / §2.4：补充 hub-links、Hub 内链本地化。
- `site.config.json` adsense note：含 `/hub-links/`。

---

## 8. 实施记录

| 日期 | 阶段 | 说明 |
|------|------|------|
| 2026-06-01 | 文档 | 初版 |
| 2026-06-01 | 一期+二期 | 按 §3–§5 落地代码与构建 |

---

*维护：改 Hub JSON 结构或新增 Hub 时，先跑 `sync-hub-links` 再 `build-site`。*
