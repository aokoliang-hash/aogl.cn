# aogl.cn 低价值内容与 SEO 优化实施方案

> **版本**：2026-06-12  
> **状态**：技术项 **已实施**（canonical 对齐、hub-links noindex、sitemap 瘦身、AdSense 收紧）  
> **关联**：[`AdSense过审改动清单.md`](./AdSense过审改动清单.md)、[`站点曝光与增长实施方案.md`](./站点曝光与增长实施方案.md)

---

## 1. 问题诊断

### 1.1 数据摘要（2026 年 6 月初）

| 来源 | 指标 | 说明 |
|------|------|------|
| GSC 网页索引 | 1,394 已索引 / 3,247 未索引 | 约 70% URL 被拒绝 |
| GSC | **529 页** canonical 冲突 | 「Google 选择的规范网页与用户指定的不同」 |
| GSC 效果 | 月点击约 **7 次** | 几乎无搜索曝光 |
| GA4 | 39 用户、互动 **21 秒** | 跳出高、自然搜索几乎为 0 |
| sitemap | **4,632** 条 URL | 远超真实「主内容」体量 |
| sitemap（2026-06-22 后） | **~248** 条 URL | 已排除 hub-links / briefs / tool-guides |
| AdSense | 低价值内容（aqqlang.com）/ aogl.cn 准备中 | 收录 ≠ 能投放 |

### 1.2 根因

1. **体量失衡**：原创 `articles/` 约 12 篇，而 `hub-links/` 约 500+ slug × 8 语 ≈ **4,000+** 模板化书签简介页。Google 将整站判为「外链导航站」。
2. **canonical 信号冲突**：根路径简体页 `canonical` 指向 `/briefs/xxx.html`，但 JSON-LD 的 `url` / `mainEntityOfPage` 仍写 `/en/briefs/xxx.html`，与 `hreflang x-default` 叠加 → GSC 529 页报错。
3. **批量上线**：5 月底 hub-links 暴增，触发大规模「已抓取 - 尚未编入索引」。
4. **AdSense 与 SEO 标准不同**：能索引的目录页仍可能因「薄内容」被拒。

---

## 2. 优化目标

| 维度 | 3 个月内目标 |
|------|----------------|
| GSC canonical 冲突 | 529 页在验证后显著下降 |
| 未索引比例 | hub-links 不再计入可索引 URL |
| sitemap | 从 ~4,600 降至 ~600 以内（去掉 hub-links） |
| AdSense | 以 articles + about 为主样本，2～4 周后再申请 |
| 自然流量 | 品牌词 + 文章长尾有稳定展示（非泛热词） |

---

## 3. 已实施的技术改动（2026-06-12）

### 3.1 canonical / JSON-LD 对齐

**文件**：`scripts/build-seo-locale-pages.mjs`

- 新增 `syncPageJsonLdToCanonical()`：构建各语言输出时，将 JSON-LD 的 `url`、`mainEntityOfPage`（含 `@id`）**强制与当前页 `<link rel="canonical">` 一致**。
- 消除根路径简体页 canonical 与 JSON-LD 指向 `/en/` 的冲突。

**验收**：抽查 `briefs/*.html`（根路径）与 `/en/briefs/*.html`，三者一致：

- `<link rel="canonical">`
- `<meta property="og:url">`
- JSON-LD `url` / `mainEntityOfPage`

### 3.2 hub-links 不再参与索引

**文件**：`scripts/build-hub-link-pages.mjs`

- 全部 hub-links 页（含索引页）改为 `<meta name="robots" content="noindex,follow">`。
- 移除 hub-links 页上的 `adsense.js` 引用。

**文件**：`scripts/build-seo-locale-pages.mjs`

- `getSitemapPages()` 排除 `hub-links/*`；`writeSitemap()` 仅写入主内容 URL。

**说明**：hub-links 仍可通过 Hub 内链访问，仅告诉 Google「不要索引这些模板页」。

### 3.3 AdSense 加载范围收紧

**文件**：`js/adsense.js`

- `isContentPrimaryPage()` **不再包含** `/hub-links/`。
- 仅在 `articles/`、`briefs/`、`tool-guides/`、`about`、`changelog` 加载发布商脚本。

**AdSense 后台**：自动广告可保持默认；版位已由 `js/adsense.js` 的 `isContentPrimaryPage()` 在代码侧限制。

### 3.4 构建与部署命令

```bash
npm run build-hub-link-pages
npm run build-brief-pages
npm run build-seo-locales
```

或全量：

```bash
npm run build-site
```

**推送到 GitHub Pages（生产环境）**

站点托管在 GitHub Pages（`CNAME` → `aogl.cn`）。部署 = 推送到 `origin main`。

```powershell
# 建议在系统 PowerShell（非 IDE 内置终端）中执行，并确保能访问 github.com（必要时开 VPN）
powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1
```

或手动：

```bash
git add -A
git commit -m "fix(seo): hub-links noindex, slim sitemap, align canonical JSON-LD"
git push origin main
```

推送成功后 1～3 分钟 GitHub Pages 会重建；可用以下命令确认线上 sitemap 已瘦身（不应再含 `hub-links`）：

```bash
curl -s https://aogl.cn/sitemap.xml | findstr /c:"hub-links"
# 应无输出
```

### 3.5 briefs / tool-guides noindex + sitemap 二次瘦身（2026-06-22）

**文件**：`scripts/build-brief-pages.mjs`、`scripts/build-tool-guide-pages.mjs`、`scripts/build-guides-index.mjs`、`js/adsense.js`、`scripts/build-seo-locale-pages.mjs`

- 全部 `briefs/`、`tool-guides/` 页改为 `<meta name="robots" content="noindex,follow">`，并移除 `adsense.js`。
- `getSitemapPages()` 排除 `briefs/`、`tool-guides/`（与 hub-links 同理）。
- `adsense.js` 仅在 `/articles/`、`about.html`、`changelog.html` 加载发布商脚本。
- `guides/index.html` 保留 `index,follow`，但不加载 AdSense。

**验收**：`sitemap.xml` 约 **248** URL；不含 `briefs/`、`tool-guides/`、`hub-links/`。

详见 [`AdSense过审建议-2026-06-22.md`](./AdSense过审建议-2026-06-22.md)。

---

## 4. 待持续运营（非一次性代码）

### 4.1 内容（AdSense 核心）

| 动作 | 频率 | 说明 |
|------|------|------|
| 原创文章 | 每月 1～2 篇 | 每篇英文 **800+ 词**，带 Demo / 截图 |
| 扩写现有 12 篇 | 已完成部分 | 见 `AdSense英文抽测记录.md` |
| 对外分享 | 每篇 1 次 | 优先 `/en/articles/`、`/en/about.html` |
| **禁止** | — | AI 批量灌水 hub-links / briefs |

### 4.2 Google Search Console

1. 部署后：**索引 → 网页 → 验证修正情况**（canonical 冲突项）。
2. 对 2～3 篇代表文章 + 首页：**网址检查 → 请求编入索引**（启动用，非日常依赖）。
3. 确认 sitemap 已提交且 URL 数下降。
4. 每周 15 分钟查看「未编入索引」原因是否从 duplicate/canonical 转为正常的 crawled-not-indexed（薄页减少后应改善）。

### 4.3 AdSense 重新申请

| 步骤 | 时间 |
|------|------|
| 部署本次技术改动 | 立即 |
| 等待 Google 重新抓取 | **2～4 周** |
| GSC canonical 报错下降后 | 再点「申请审核」 |
| 提交样本 URL | `/en/articles/*`、`/en/about.html` |

**自检清单**：

- [ ] sitemap 不含 hub-links
- [ ] hub-links 页 robots = noindex,follow
- [ ] 抽查 canonical = og:url = JSON-LD url
- [ ] 至少 8～12 篇独立文章 URL
- [ ] about / privacy / changelog / contact 可访问
- [ ] ads.txt 已授权（aogl.cn ✅）
- [ ] changelog 近周有更新

### 4.4 站外曝光（长期）

- GitHub README 英文一句 + 链到代表文章
- Reddit / HN / X：先贡献价值再带链接
- Dev.to 转载须 canonical 指回 aogl.cn

详见 [`站点曝光与增长实施方案.md`](./站点曝光与增长实施方案.md)。

---

## 5. 不建议的做法

- 未改内容就反复申请 AdSense
- 继续批量新增 hub-links（`sync-hub-links` 可维护数据，但勿扩大索引面）
- 购买外链、刷流量
- 为过审删除多语言（应对**薄页 noindex**，而非砍语言）

---

## 6. 预期时间线

| 时间 | 预期 |
|------|------|
| 1～2 周 | GSC canonical 验证通过；sitemap URL 数下降 |
| 2～4 周 | 未索引 hub-links 逐步从报告中消失；索引集中在 articles / hub 首页 |
| 1～3 月 | 品牌词与文章长尾有少量自然点击 |
| AdSense | 无保证；内容 + 技术双达标后**有机会**过审 |

---

## 7. 变更记录

| 日期 | 内容 |
|------|------|
| 2026-06-12 | 首版：诊断 + 实施 canonical 对齐、hub-links noindex、sitemap 瘦身、adsense 收紧 |
| 2026-06-01 | 见 `AdSense过审改动清单.md`（12 篇原创、首页顺序等） |

---

*过审与排名无保证，以 Google 实际抓取与审核为准。*
