# AdSense 英文抽测记录（aogl.cn）

> 核对日期：**2026-05-20** · 依据 `docs/AdSense过审改动清单.md` §6 最后一项。  
> 方法：本地打开 `en/` 构建产物，检查 `body.locale-en` 下可见英文段落（非仅链接列表）。

---

## 1. 首页 `/en/`

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `#intro` 关于本站 | ✅ | 3 段 `reading-intro`，含维护边界与 GitHub 纠错 |
| `#tools-directory` | ✅ | 2 段 `tools-intro`（场景分组 + 收录/排除） |
| 四张 `.card` | ✅ | 各卡多段英文说明 + 跳转 |
| 四个 `#cat-*` | ✅ | 均有 `cat-feed-lead` 英文导语 |
| `#originals` 原创轮播 | ✅ | 7 张卡片标题/摘要/meta 均为英文 |
| 页脚 About / Changelog / Privacy | ✅ | 链接可达 |

**结论：通过** — 非「纯链接壳页」。

---

## 2. 支撑页

| URL | 结果 | 说明 |
|-----|------|------|
| `/en/about.html` | ✅ | 5 段：站点性质、内容与边界、不做的事、广告、联系 |
| `/en/changelog.html` | ✅ | 英文列表含 2026-05-13～05-20 每周短讯（人类可读） |
| `/en/privacy.html` | ✅ | （本次未逐字复读；§6 已勾选，维持） |

---

## 3. 文章 `/en/articles/`（7 篇英文字数粗算）

| Slug | 英文字数* | 段落/嵌入 | 抽测结论 |
|------|-----------|-----------|----------|
| `role-girl-card-visual-study` | ~680 | 多段 + 图集 + 3× MP4 | ✅ **推荐送审样本** |
| `travel-through-parallax-phone` | ~536 | 多段 + 嵌入演示 | ✅ **推荐送审样本** |
| `velmora` | ~414 | 多段 + 嵌入 | ✅ 通过 |
| `monkey-short-bts` | ~338 | 多段 + 图 | ✅ 通过 |
| `monkey2-sprite-head-track` | ~325 | 多段 + 图/说明 | ✅ 通过 |
| `character-turnaround-walk` | ~313 | 多段 + 图 | ⚠️ 偏短但结构完整 |
| `interactive-3d-earth` | ~245 | 标题层级 + iframe + 技术列表 | ⚠️ 偏短；**勿单独作为唯一长文样本** |

\* 对 `data/articles/fragments/*-en.html` 去标签后按空白分词估算。

**§6 要求「至少 2 篇」**：已抽测 **role-girl** + **travel-through** + **velmora**（3 篇），段落均在首屏 HTML `<article>` 内，非空壳。

---

## 4. 送审员可能打开的 URL（建议）

1. https://aogl.cn/en/  
2. https://aogl.cn/en/about.html  
3. https://aogl.cn/en/articles/role-girl-card-visual-study.html  
4. https://aogl.cn/en/articles/travel-through-parallax-phone.html  

可选备查：https://aogl.cn/en/changelog.html  

---

## 5. 遗留（不阻塞本次抽测勾选）

- 全站仍 **7/8 篇** 原创文章（§6 另一项未勾选）。  
- 4 篇英文 **&lt;400 词**，过审前若时间允许可各补 1～2 段「个人实验」说明（非必须才能通过抽测）。  
- 广告位密度需在 AdSense 后台 **另自查**（§6 独立项）。

---

*本记录与 `docs/AdSense过审改动清单.md` §6 同步更新。*
