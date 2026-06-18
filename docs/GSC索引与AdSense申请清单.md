# GSC 索引与 AdSense 申请清单

> **版本**：2026-06-18  
> **用途**：每周 GSC 巡检 + 原创量达标后的 AdSense 复核前自检  
> **关联**：[`流量增长与栏目整改实施方案.md`](./流量增长与栏目整改实施方案.md)

---

## 1. Google Search Console 每周巡检（约 15 分钟）

| 步骤 | 操作 | 通过标准 |
|------|------|----------|
| 1 | [GSC](https://search.google.com/search-console) → 属性 `aogl.cn` | 可正常打开 |
| 2 | **索引 → 网页** | 已编入索引的 `articles/`、`guides/`、`briefs/` URL 数量趋势稳定或上升 |
| 3 | **索引 → 网页 → 未编入索引** | `hub-links/` 大量未索引属预期（noindex）；无新增 `articles/` 误报 |
| 4 | **体验 → 核心网页指标** | 移动端无新增「差」URL 激增 |
| 5 | **设置 → 抓取统计信息** | 无连续多日抓取量归零 |
| 6 | **网址检查** 抽查 3 条 | `https://aogl.cn/en/articles/index.html`、`/en/guides/index.html`、最新 article canonical 为 `https://aogl.cn/en/...` |

### 索引异常处理

- **Alternate page with proper canonical**：确认 `build-seo-locale-pages` 已跑；根路径与 `/en/` 不重复提交 sitemap 冲突项。  
- **Crawled – currently not indexed**：薄页保持 noindex；原创文章补内链后请求「验证已修复」即可，勿批量 request indexing。  
- **Duplicate without user-selected canonical**：检查 `_multilang/` 与 locale 目录是否同一 canonical。

---

## 2. Sitemap 与构建核对

每次 `npm run build-site` 后：

```bash
# 本地检查 sitemap 是否含 guides 与最新 articles
rg "guides/index|game-girl-elena-palette|games-hub-generative" sitemap.xml
```

| 项 | 预期 |
|----|------|
| `guides/index.html` | 在 sitemap 中 |
| 新 `articles/*.html` | slug 对应 URL 存在且 `lastmod` 为发布日 |
| `hub-links/` | **不在** sitemap（或仅 noindex 页不提交） |

GSC → **站点地图** → 确认 `https://aogl.cn/sitemap.xml` 状态为「成功」。

---

## 3. AdSense 申请前自检（建议原创 ≥ 15 篇后）

本站定位：**个人书签 + 原创 Demo 手记**，非评测站、非导购站。

### 内容门槛

- [ ] `articles/index.html` 至少 **15** 篇可索引原创（含英文正文 ≥ 800 words 的代表作）  
- [ ] `guides/index.html` 下 **9+** 篇已扩写 `editorialHtml`（Claude、Cursor、Gemini、Copilot、Midjourney、Perplexity、Runway、DeepSeek、ChatGPT）  
- [ ] `about.html`、`privacy.html`、`contact.html` 可访问且与站点语言一致  
- [ ] 无「仅 RSS 标题 / 仅外链列表」作为**唯一**主内容的可索引 URL  

### 技术门槛

- [ ] `js/adsense.js` 仅在允许页面加载（已含 `/guides/`）  
- [ ] `hub-links/` 保持 `noindex,follow`  
- [ ] 移动端 PageSpeed 抽测无致命错误（见增长方案季度项）  
- [ ] 无误导性「下载破解」「投资荐股」类文案  

### 申请流程备忘

1. 使用与 GSC **同一 Google 账号**登录 [AdSense](https://www.google.com/adsense/)。  
2. 添加站点 `aogl.cn`，粘贴 AdSense 提供的验证代码（若与现有 `adsense.js` 冲突，先备份再合并）。  
3. 等待「需要审核的内容」抓取；**勿**在未改内容情况下一周内重复提交。  
4. 被拒时：对照邮件理由改**具体页面**（常见：薄内容、导航不清晰、about 不足），changelog 记录后再申。

---

## 4. 月度记录模板

| 日期 | 已索引 URL（约） | 月点击（约） | 本周动作 | 备注 |
|------|------------------|--------------|----------|------|
| 2026-06 | — | ~7 | 12 周路线实施完成 | 基线 |

---

*Google 审核与排名无保证；以 Search Console 与 AdSense 后台实际数据为准。*
