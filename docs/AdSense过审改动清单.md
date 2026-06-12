# AdSense 过审改动清单（aogl.cn）

> 针对后台原因：**低价值内容（Low value content）**。  
> 与 **Search Console 收录** 无关：能索引 ≠ 能投放广告。  
> 技术项 **ads.txt 已授权** 无需再改，重点在 **可读、独有、以内容为主** 的页面比例。

---

## 0. 进度总览（2026-06-01 核对）

| 类别 | 状态 | 说明 |
|------|------|------|
| About / 隐私 / changelog | ✅ 已落地 | 各语言页 + 页脚 + sitemap；about/changelog 已接 adsense.js（由脚本 gated 加载） |
| 8 个 Hub 编辑说明 | ✅ **4 段/页** | `data/hubs/*.json` + `EDITORIAL_I18N` |
| 首页 intro / 工具区 / 四卡 / `#cat-*` lead | ✅ 已落地 | 见 §2.4 |
| 原创文章 | ✅ **12/12** | 见下方列表；2026-06-01 扩写 5 篇偏短英文 |
| 文章索引页 | ✅ | `articles/index.html`（构建生成，12 篇摘要） |
| 首页顺序 | ✅ | 「本站原创」在「关于本站」之前 + 主内容导语链向索引 |
| 广告加载范围 | ✅ | `js/adsense.js` 仅在 `/articles/`、`/briefs/`、`/tool-guides/`、`/hub-links/`、about、changelog 加载发布商脚本 |
| Hub 内链本地化 | ✅ | `hub-links/` + Hot mix 优先 `briefs/`；见 `docs/Hub栏目外链本地化实施方案.md` |
| changelog 每周一条 | ✅ | 含 2026-06-01 AdSense 准备条目 |
| 等 3～7 天再申 | ⏳ 运营项 | 本次大改后建议 **2026-06-08 前后** 再点「申请审核」 |

---

## 1. Google 在看什么（简化）

| 通过倾向 | 容易被拒 |
|----------|----------|
| 独立文章、教程、实验手记（首屏 HTML 正文） | 整站主要是外链格子 + RSS 标题列表 |
| 每页有 **站长写的说明**（筛选标准、边界、更新方式） | 多页结构相同、只有链接不同 |
| About / 隐私 / 更新记录 / 可联系纠错 | 像「空壳导航站」、找不到谁在维护 |
| 英文（及主语言）段落完整、非机翻堆砌 | 7 语 × 大量 hub = 海量相似薄页 |

**已做**：首页 `#originals` 置顶 + 主内容导语；`articles/index.html`；hub 四段编辑说明；**12 篇** Demo/手记；5 篇英文扩写至约 **600+ 词**（2026-06-01）。

**送审样本 URL**（英文厚文）：见 `docs/AdSense英文抽测记录.md` §4。

---

## 2. 必做（建议过审前全部完成）

### 2.1 增加「主内容页」数量与厚度 — ✅ 12 篇 + 索引

| 动作 | 目标 | 当前 |
|------|------|------|
| **原创文章** | 至少 **8～10 篇**，每篇 **800 字以上**（中英至少一种完整正文） | **12 篇**；英文薄篇已扩写（见抽测记录） |
| **文章索引** | 可一览全部原创 | ✅ `articles/index.html` |
| **选题** | 个人实验、Demo 说明 | 避免纯工具汇总单篇 |

**当前 12 篇文章**（`data/articles/`）：

1. `sky-plane-window-cloud-composite`  
2. `major-planets8-solar-system-textures`  
3. `in-car-view-train-window-scenery`  
4. `apartment-360-panorama-tour`  
5. `girl1-knit-contact-sheet-study`  
6. `role-girl-card-visual-study`  
7. `travel-through-parallax-phone`  
8. `monkey2-sprite-head-track`  
9. `character-turnaround-walk`  
10. `monkey-short-bts`  
11. `interactive-3d-earth`  
12. `velmora`  

```bash
npm run build-articles && npm run build-seo-locales
```

### 2.2 新增「关于本站」独立页 — ✅ 已落地

见 `_multilang/about.html`；页脚与 sitemap 已收录。

### 2.3 Hub 页编辑说明 — ✅ 已落地（4 段）

```bash
npm run build-hubs && npm run build-seo-locales
```

### 2.4 首页 — ✅（2026-06-01 增强）

| 区块 | 状态 |
|------|------|
| `#originals` 在 `#intro` **之前** | ✅ 构建脚本 `reorderIndexPutOriginalsFirst` |
| 主内容导语 + 链到 `articles/index.html` | ✅ `site-primary-lead` |
| `#intro` / 工具区 / 四卡 / `#cat-*` | ✅ 维持 |

### 2.5 过审前广告展示策略 — ✅ 代码已收紧

| 建议 | 实现 |
|------|------|
| 薄页不加载发布商脚本 | ✅ `js/adsense.js` → `isContentPrimaryPage()` |
| 文章 / about / changelog 可展示 | ✅ 上述 URL 才 `loadPublisherScript()` |
| AdSense 后台自动广告 | ⏳ 建议仍收窄版位；与代码双保险 |

---

## 3. 建议做（提高通过率）

### 3.1 英文优先 — ✅ 见抽测记录（2026-06-01 更新 12 篇字数）

### 3.2 控制「薄页」印象 — ⏳ 持续

- 对外分享多链 **https://aogl.cn/en/articles/** 与 **about**  
- 少只链 `games.html` 等纯目录  

### 3.3 changelog — ✅ 含 2026-06-01 条目

### 3.4 禁止项自查 — ⏳ 提交前勾选

---

## 4. 不建议做

- **未改内容就点「申请审核」**  
- **用 AI 批量灌水**  
- **为过审删掉多语言**  
- **Hub 工作流类长文凑篇数**  

---

## 5. 推荐执行顺序

| 阶段 | 任务 | 进度 |
|------|------|------|
| 内容 | 12 篇 + 索引 + 5 篇英文扩写 | ✅ 2026-06-01 |
| 技术 | 广告 gated + 首页顺序 | ✅ 2026-06-01 |
| 运营 | 部署上线 → **等 3～7 天** → 申请审核 | ⏳ 建议不早于 **2026-06-08** |

---

## 6. 验收自检（提交审核前勾选）

- [x] 至少 **8 篇** 可独立阅读的文章 URL（**当前 12 篇**）  
- [x] 有 **articles/index.html** 文章索引  
- [x] 有 **about** / **privacy** / **changelog**  
- [x] 每个 hub **4 段** 站长说明  
- [x] 首页原创区置顶 + 主内容导语  
- [x] **ads.txt** 已授权  
- [x] 薄页不加载 adsbygoogle（`js/adsense.js` gated）— 后台自动广告仍建议自查  
- [x] changelog 近周有更新（**2026-06-01**）  
- [x] 英文抽测见 `docs/AdSense英文抽测记录.md`  

---

## 7. 与现有文档

| 文档 | 关系 |
|------|------|
| `docs/低价值内容与SEO优化实施方案.md` | **canonical 对齐、hub-links noindex、sitemap 瘦身（2026-06-12）** |
| `docs/AdSense英文抽测记录.md` | 12 篇英文字数 + 送审 URL |
| `docs/首页原创文章与SEO实施说明.md` | 构建与 SEO |
| `docs/站点曝光与增长实施方案.md` | GSC（与 AdSense 分开） |

---

*版本：2026-06-01 · 过审无保证，以 Google 审核结果为准。*
