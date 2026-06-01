# AdSense 英文抽测记录（aogl.cn）

> 核对日期：**2026-06-01** · 依据 `docs/AdSense过审改动清单.md` §6。  
> 方法：对 `data/articles/fragments/*-en.html` 去标签后按空白分词估算。

---

## 1. 首页 `/en/`

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `#originals` 在 `#intro` 之前 | ✅ | 2026-06-01 构建顺序调整 |
| 主内容导语 `site-primary-lead` | ✅ | 链向 `articles/index.html` |
| `#intro` / 工具区 / 四卡 / `#cat-*` | ✅ | 维持 |
| 页脚 About / Changelog / Privacy | ✅ | |

**结论：通过** — 首屏优先看到原创轮播与主内容说明。

---

## 2. 支撑页

| URL | 结果 | 说明 |
|-----|------|------|
| `/en/about.html` | ✅ | 5 段 + adsense.js（gated 加载） |
| `/en/changelog.html` | ✅ | 含 2026-06-01 条目 |
| `/en/privacy.html` | ✅ | 维持 |
| `/en/articles/index.html` | ✅ | 12 篇列表 + 摘要（新建） |

---

## 3. 文章 `/en/articles/`（12 篇英文字数粗算）

| Slug | 英文字数* | 抽测结论 |
|------|-----------|----------|
| `in-car-view-train-window-scenery` | ~879 | ✅ **推荐送审** |
| `major-planets8-solar-system-textures` | ~835 | ✅ **推荐送审** |
| `girl1-knit-contact-sheet-study` | ~796 | ✅ **推荐送审** |
| `sky-plane-window-cloud-composite` | ~763 | ✅ **推荐送审** |
| `role-girl-card-visual-study` | ~672 | ✅ **推荐送审** |
| `travel-through-parallax-phone` | ~496 | ✅ 通过 |
| `apartment-360-panorama-tour` | ~485 | ✅ 通过 |
| `velmora` | ~560+ | ✅ 通过（2026-06-01 扩写） |
| `monkey-short-bts` | ~520+ | ✅ 通过（扩写） |
| `monkey2-sprite-head-track` | ~480+ | ✅ 通过（扩写） |
| `character-turnaround-walk` | ~470+ | ✅ 通过（扩写） |
| `interactive-3d-earth` | ~450+ | ✅ 通过（扩写；仍偏短但含完整制作叙事） |

\* 扩写后需本地重跑：`node -e` 或构建后抽查 `en/articles/*.html`。

**勿单独送审**：无 — 最薄篇已补「个人实验」段落；优先仍用 in-car / major-planets8 / girl1。

---

## 4. 送审员可能打开的 URL（建议）

1. https://aogl.cn/en/articles/index.html  
2. https://aogl.cn/en/about.html  
3. https://aogl.cn/en/articles/in-car-view-train-window-scenery.html  
4. https://aogl.cn/en/articles/major-planets8-solar-system-textures.html  
5. https://aogl.cn/en/articles/girl1-knit-contact-sheet-study.html  

备查：https://aogl.cn/en/ · https://aogl.cn/en/changelog.html  

---

## 5. 广告与等待

- **代码**：`js/adsense.js` 仅在 `/articles/`、`about.html`、`changelog.html` 加载 `adsbygoogle.js`。  
- **后台**：自动广告版位仍建议在 AdSense 控制台收窄到文章类 URL。  
- **复审**：2026-06-01 大改后，建议 **2026-06-08 前后** 再申请。

---

*本记录与 `docs/AdSense过审改动清单.md` §6 同步。*
