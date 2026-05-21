# AdSense 过审改动清单（aogl.cn）

> 针对后台原因：**低价值内容（Low value content）**。  
> 与 **Search Console 收录** 无关：能索引 ≠ 能投放广告。  
> 技术项 **ads.txt 已授权** 无需再改，重点在 **可读、独有、以内容为主** 的页面比例。

---

## 0. 进度总览（2026-05-20 核对）

| 类别 | 状态 | 说明 |
|------|------|------|
| About / 隐私 / changelog | ✅ 已落地 | 各语言页 + 页脚 + sitemap |
| 8 个 Hub 编辑说明 | ✅ **4 段/页** | `data/hubs/*.json` + `EDITORIAL_I18N` |
| 首页 intro / 工具区 / 四卡 / `#cat-*` lead | ✅ 已落地 | 见 §2.4 |
| 原创文章 | ✅ **8/8 底线** | 第 8 篇 `girl1-knit-contact-sheet-study`（2026-05-20）；可选再补 1～2 篇加厚 |
| changelog 每周一条 | ✅ 已补 | 2026-05-13～05-20 每周短讯（见 changelog.html） |
| 广告位策略 / 等 3～7 天再申 | ⏳ 运营项 | 见 §2.5、§5；英文抽测见 `docs/AdSense英文抽测记录.md` ✅ |

---

## 1. Google 在看什么（简化）

| 通过倾向 | 容易被拒 |
|----------|----------|
| 独立文章、教程、实验手记（首屏 HTML 正文） | 整站主要是外链格子 + RSS 标题列表 |
| 每页有 **站长写的说明**（筛选标准、边界、更新方式） | 多页结构相同、只有链接不同 |
| About / 隐私 / 更新记录 / 可联系纠错 | 像「空壳导航站」、找不到谁在维护 |
| 英文（及主语言）段落完整、非机翻堆砌 | 7 语 × 大量 hub = 海量相似薄页 |

**已做**：首页 `#intro`；hub 的 `editorialHtml*`（**8 个 hub 均已 4 段**）；`changelog.html`；`about.html` / `privacy.html`；首页 `tools-directory` 双段导语、四张 `.card` 扩写、四个 `#cat-*` 的 `cat-feed-lead`；**8 篇** Demo/手记 `articles/`（见下）。

**仍不足（可选）**：部分英文文章 **&lt;400 词**，可再补 1～2 篇或扩写；**广告位自查**；上线后 **等 3～7 天** 再申。勿再堆 Hub 工作流类 AI 说明文。AdSense 抽样仍以 **en/zh 长文 Demo** 为主。

**当前 8 篇文章**（`data/articles/`）：

1. `girl1-knit-contact-sheet-study` — 城市窗边米色针织（girl1 九格 + juese1–9）  
2. `role-girl-card-visual-study` — 角色卡牌视觉（白裙三视图 + 十二张定稿）  
3. `travel-through-parallax-phone` — 穿越视差手机场景  
4. `monkey2-sprite-head-track` — 猴子精灵图转头  
5. `character-turnaround-walk` — 角色四视图 / 行走循环  
6. `monkey-short-bts` — 猴子短片手记  
7. `interactive-3d-earth` — 3D 地球  
8. `velmora` — 太阳系探索器  

---

## 2. 必做（建议过审前全部完成）

### 2.1 增加「主内容页」数量与厚度 — ✅ 底线已达标（8 篇）

| 动作 | 目标 | 当前 |
|------|------|------|
| **原创文章** | 至少 **8～10 篇**，每篇 **800 字以上**（中英至少一种完整正文） | **8 篇**（`girl1-knit-contact-sheet-study` 中英 800+；可选再 +1～2 篇） |
| **选题** | 个人实验、Demo 说明（3D、短片、视差等） | 避免纯「工具官网汇总」单篇 |
| **首页** | 摘要卡片 + 全文在 `/articles/<slug>.html` | ✅ 已按 `docs/首页原创文章与SEO实施说明.md` 构建 |

```bash
# 新增文章后
npm run build-articles && npm run build-seo-locales
```

### 2.2 新增「关于本站」独立页 — ✅ 已落地

> **2026-05-19**：`_multilang/about.html` → 各语言 `about.html`；页脚「关于」指向该页；`sitemap.xml` 已收录。

| 字段 | 状态 |
|------|------|
| 谁维护 | ✅ 个人站、非商业评测 |
| 做什么 | ✅ AI 备忘 + 原创 + 外链边界 |
| 不做什么 | ✅ 不代售 / 非医疗投资建议等 |
| 如何联系 | ✅ GitHub Issues；**可选公开邮箱未加**（非必须） |
| 广告 | ✅ AdSense + 与外链无隶属；链至 privacy |

### 2.3 Hub 页编辑说明 — ✅ 已落地（4 段）

> **2026-05-19**：8 个 `data/hubs/*.json` 中英各 **4 段** `editorialHtml`；`scripts/build-hub-pages.mjs` 中 `EDITORIAL_I18N` 的 ja/ko/fr/ru/ar 同步第 4 段。已 `npm run build-hubs && npm run build-seo-locales`。

每段建议仍包含：入选标准、核对日期（如 **2026-05-19**）、明确排除项（tools 非医疗、brands 非荐股等）。

```bash
npm run build-hubs && npm run build-seo-locales
```

### 2.4 首页 `#tools-directory` 与四张 `.card` — ✅ 已落地

> **2026-05-19 核对**：母版 `_multilang/index.html` 已具备下列内容（构建后同步各语言首页）。

| 区块 | 状态 |
|------|------|
| `#intro` 关于本站 | ✅ 多段 `reading-intro` |
| `#tools-directory` | ✅ 双段 `tools-intro`（入口说明 + 收录/排除边界） |
| 四张 `.card` | ✅ 各卡多段说明 + `card-jump` |
| `#cat-news` / `#cat-rankings` / `#cat-maps` / `#cat-tips` | ✅ 均有 `cat-feed-lead`（7 语） |

细则仍可对照 `docs/站点原创内容与实施节奏.md` 做后续微调，**不作为过审阻塞项**。

### 2.5 过审前广告展示策略 — ⏳ 需你自查

| 建议 | 原因 |
|------|------|
| 可保留 `adsense.js`，但 **自动广告勿铺满** 薄页 | 审核印象「先广告后内容」 |
| 优先在 **文章页、about、changelog** 有清晰正文后再依赖自动广告 | 符合「内容为主」 |

---

## 3. 建议做（提高通过率）

### 3.1 英文优先给审核员看 — ✅ 已抽测（2026-05-20）

- 记录见 **`docs/AdSense英文抽测记录.md`**：`/en/`、about、changelog 通过；推荐送审样本 **`role-girl-card-visual-study`**、**`travel-through-parallax-phone`**。  
- 部分文章英文 **&lt;400 词**（如 `interactive-3d-earth`）结构完整但偏短，勿单独作为唯一长文样本。ja/ko 等 fragment 更短，审核若只看非中英仍可能偏薄。

### 3.2 控制「薄页」印象（不删多语，但加重主 URL） — ⏳ 持续

- **sitemap**：`build-seo-locales` 会生成；重大更新后重新构建即可。  
- GitHub README / 分享多链 **文章与 about**，少只链 `games.html` 等纯目录。

### 3.3 每周一条 `changelog` — ✅ 已补（2026-05-20）

`_multilang/changelog.html` 已含 **2026-05-13～05-20** 每周人类可读短讯（原创文章上线、About、轮播等）；构建后同步各语言 `changelog.html`。

### 3.4 禁止项自查 — ⏳ 提交前勾选

- 无版权全文转载、无误导标题、无「点此下载」壳页、无成人/赌博等违规邻域链接堆砌。

---

## 4. 不建议做

- **未改内容就点「申请审核」** → 极易再次「低价值内容」（当前仍缺 2～4 篇文章）。  
- **用 AI 批量生成上千字灌水** → 质量指南风险。  
- **为过审删掉多语言** → 不必；应 **加厚** 而非砍语言。  
- **买流量冲 AdSense** → 与政策无关且无益。  
- **Hub 工作流类长文**（如 RSS 合并说明单篇）→ 已移除；勿再以同类文体凑篇数。

---

## 5. 推荐执行顺序（约 3～4 周）

| 周 | 任务 | 进度 |
|----|------|------|
| **1** | `about.html` + 页脚 + sitemap；2 篇新文章 | about ✅；文章 ⚠️ 仅部分（现 6 篇） |
| **2** | 8 hub 加编辑段；首页 `#cat-*` lead | ✅ 已完成（hub 为 **4 段**） |
| **3** | 再 2～3 篇文章；changelog 补 4 周 | **8 篇** + changelog ✅ |
| **4** | 自测 `/en/`、文章、hub、about、privacy；**等 3～7 天** → 申请审核 | 英文抽测 ✅；广告自查 + 等 3～7 天 |

**复审前等待**：重大改动（尤其新文章）上线后 **至少 3～7 天** 再提交。

---

## 6. 验收自检（提交审核前勾选）

- [x] 至少 **8 篇** 可独立阅读的文章 URL，正文在首屏 HTML（**当前 8 篇**，含 `girl1-knit-contact-sheet-study`）  
- [x] 有 **about** 说明维护者与站点边界  
- [x] **privacy** 可访问且含第三方/广告无隶属说明  
- [x] 每个 hub 有 **3 段及以上** 站长说明（中或英）（**已为 4 段**）  
- [x] 首页有 **关于本站**（`#intro`）+ 非纯链接的工具/分类说明（`tools-directory`、`.card`、`cat-feed-lead`）  
- [x] **ads.txt** 仍为已授权（保持即可）  
- [ ] 未在几乎无正文的页面上堆满广告（AdSense 后台 / 自动广告范围 **需自查**）  
- [x] **changelog** 近几周有持续人类可读更新（**2026-05-13～05-20 每周一条**）  
- [x] 抽测 **`/en/`** 与至少 2 篇 **`/en/articles/`** 段落完整（见 `docs/AdSense英文抽测记录.md`）  

---

## 7. 与现有文档

| 文档 | 关系 |
|------|------|
| `docs/站点原创内容与实施节奏.md` | 首页与 hub 导语扩写细则 |
| `docs/首页原创文章与SEO实施说明.md` | 文章构建与 SEO |
| `docs/站点曝光与增长实施方案.md` | 自然搜索（GSC）；与 AdSense **分开** |
| `docs/AdSense英文抽测记录.md` | §6 英文 URL 抽测结果与送审样本建议 |

---

*版本：2026-05-20（第 8 篇 girl1 上线，§6 文章项已勾选）· 过审无保证，以 Google 审核结果为准。*
