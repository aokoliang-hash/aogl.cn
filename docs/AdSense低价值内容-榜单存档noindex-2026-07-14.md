# AdSense 低价值内容 · 榜单存档 noindex（2026-07-14）

> **背景**：Google AdSense 再次以「低价值内容」拒绝 `aogl.cn`（所有权已验证）。  
> **动作**：把 **28 篇榜单/图表/新闻存档** 从搜索主面与 sitemap 中拿开，让审核面只看到 Demo / 制作手记。

## 1. 技术改动

| 项 | 实现 |
|----|------|
| 存档 slug 名单 | `scripts/seo-index-policy.mjs` → `ARTICLE_ARCHIVE_NOINDEX_SLUGS` |
| 文章页 robots | 存档 → `noindex,follow`；Demo → 仍可索引 |
| sitemap | `isSitemapPage()` 排除上述文章 |
| 首页 `#originals` 轮播 | **仅** primary Demo |
| `articles/index.html` | **仅**列出 primary Demo（约 19 篇） |
| AdSense | 存档页不注入 `adsense.js`；`js/adsense.js` 遇 `noindex` meta 也不请求广告 |
| Hub 卡片 | **保留**（Hub 本身已 noindex），人类仍可从 tech/games 打开存档 |

## 2. 仍保持 index 的文章（示例）

- Demo：地球、车厢视窗、Elena、monkey、全景、插画流程等  
- 编辑向：`pc-standalone-games-recommendations-2026`、`apple-iphone-17-pro-buy-guide-20260601`、`ai-animation-clinical-scene-20260708` 等  

完整名单以 `ARTICLE_ARCHIVE_NOINDEX_SLUGS` 的**补集**为准。

## 3. 构建

```bash
npm run build-articles
npm run build-seo-locales
```

（Hub 卡无需改源数据；存档 URL 仍存在，只是 noindex。）

## 4. 复审前还要做

1. **再写 5～8 篇**带 `original/` 素材、英/中厚文（≥800 EN 词）  
2. Search Console **重新提交 sitemap**，等抓取 **7～14 天**  
3. **不要立刻**点「申请审核」  
4. 送审样本只链 Demo 厚文 + about + `articles/index`

## 5. 本周原创选题建议

见同次对话交付的选题列表（角色迭代实录 / WebGL 笔记 / 短视频分镜等）。

---

*过审无保证。关联：`docs/AdSense过审建议-2026-06-22.md`、`docs/AdSense全面整改-2026-06-22.md`*
