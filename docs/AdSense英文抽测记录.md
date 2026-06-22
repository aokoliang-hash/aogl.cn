# AdSense 英文抽测记录（aogl.cn）

> 核对日期：**2026-06-22** · 依据 [`AdSense过审建议-2026-06-22.md`](./AdSense过审建议-2026-06-22.md)。  
> 方法：对 `data/articles/fragments/*-en.html` 去标签后按空白分词估算。

---

## 1. 首页 `/en/`

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `#originals` 在 `#intro` 之前 | ✅ | 15 篇轮播 |
| 主内容导语 `site-primary-lead` | ✅ | 链向 `articles/index.html` |
| 页脚 About / Changelog / Privacy | ✅ | |

---

## 2. 支撑页

| URL | 结果 | 说明 |
|-----|------|------|
| `/en/about.html` | ✅ | adsense gated |
| `/en/changelog.html` | ✅ | 含 2026-06-22 整改条目 |
| `/en/articles/index.html` | ✅ | 15 篇列表 |

---

## 3. 文章 `/en/articles/`（15 篇英文字数，2026-06-22）

| Slug | 英文字数* | 抽测结论 |
|------|-----------|----------|
| `in-car-view-train-window-scenery` | ~912 | ✅ 推荐送审 |
| `major-planets8-solar-system-textures` | ~877 | ✅ 推荐送审 |
| `girl1-knit-contact-sheet-study` | ~825 | ✅ 推荐送审 |
| `sky-plane-window-cloud-composite` | ~800 | ✅ 推荐送审 |
| `game-girl-elena-sea-wind-reference` | ~957 | ✅ 推荐送审 |
| `travel-through-parallax-phone` | ~957 | ✅ |
| `apartment-360-panorama-tour` | ~834 | ✅ |
| `velmora` | ~919 | ✅ |
| `monkey-short-bts` | ~877 | ✅ |
| `monkey2-sprite-head-track` | ~873 | ✅ |
| `character-turnaround-walk` | ~884 | ✅ |
| `interactive-3d-earth` | ~891 | ✅ |
| `games-hub-generative-art-workflow` | 921 | ✅ 2026-06-22 扩写 |
| `game-girl-elena-palette-ritual-notes` | 864 | ✅ 2026-06-22 扩写 |
| `role-girl-card-visual-study` | 832 | ✅ 2026-06-22 扩写 |

\* 本地 `py -3` 脚本去标签分词；带 `+` 为扩写后粗算下限。

---

## 4. 送审样本 URL

1. https://aogl.cn/en/articles/index.html  
2. https://aogl.cn/en/about.html  
3. https://aogl.cn/en/articles/in-car-view-train-window-scenery.html  
4. https://aogl.cn/en/articles/major-planets8-solar-system-textures.html  
5. https://aogl.cn/en/articles/game-girl-elena-sea-wind-reference.html  

备查：https://aogl.cn/en/changelog.html

---

## 5. 广告与 sitemap（2026-06-22）

| 项 | 状态 |
|----|------|
| `adsense.js` 加载范围 | 仅 `/articles/`、`about.html`、`changelog.html` |
| `briefs/` | `noindex,follow`，**不在 sitemap** |
| `tool-guides/` | `noindex,follow`，**不在 sitemap** |
| `hub-links/` | `noindex,follow`，**不在 sitemap** |
| 建议复审日 | **不早于 2026-07-06** |

---

*与 `docs/AdSense过审建议-2026-06-22.md` §7 同步。*
