# aogl.cn

**Live site:** [https://aogl.cn/](https://aogl.cn/) · English hub: [https://aogl.cn/en/](https://aogl.cn/en/)

Personal, non-commercial bookmarks for **generative AI tools**, official lab blogs, and RSS-backed hub pages. This repository is the **source for the static site** (HTML, CSS, data, and build scripts). It is **not** a product review site: pricing, regions, and terms always belong on vendors’ own pages.

中文：业余维护的生成式 AI 备忘站源码仓库；站点说明与反馈见下方 Issues。

---

## Why this repo exists

- Curated links to chat, image, video, code, and related tools open in a new tab.
- Multi-language UI (`zh`, `en`, `ja`, `ko`, `fr`, `ru`, `ar`) generated from `_multilang/` templates.
- Optional editorial articles under `articles/` (built from `data/articles/`).

If a link is wrong, renamed, or should be removed, please open an issue using the **Broken or outdated link** template.

---

## Build (local)

Requires **Node.js 20+**.

```bash
npm ci
npm run build-site
```

Common scripts (see `package.json`):

| Script | Purpose |
|--------|---------|
| `npm run build-hubs` | Regenerate hub HTML from `data/hubs/*.json` |
| `npm run build-articles` | Generate article pages from `data/articles/*.json` |
| `npm run build-index-pills` | Inject homepage pillar cards |
| `npm run build-seo-locales` | Emit per-locale root pages (`en/`, `ja/`, …) |

---

## Automation (GitHub Actions)

- **Weekly hub RSS** — `.github/workflows/hub-news-weekly.yml` runs `fetch-hub-news`, then `build-hubs` + `build-seo-locales`.
- **Reading list refresh** — `.github/workflows/update-reading.yml` runs `scripts/update-reading.mjs --fetch` on a schedule.

---

## Contributing

- **Broken links or wrong labels:** [open an issue](https://github.com/aokoliang-hash/aogl.cn/issues/new/choose) (use the link-report template when possible).
- **Pull requests:** small, focused changes welcome; large hub list edits are easier to track via issue first.

---

## License

`package.json` declares **ISC** for this npm package metadata. Site copy, images, and third-party trademarks remain subject to their respective owners; there is no separate `LICENSE` file in the root yet.
