# Knight-pray.github.io

Personal research blog built with Hugo and deployed to GitHub Pages by `.github/workflows/hugo.yml` on every push to `main`. The theme (Minimal Scholar v4) is a port of my former Blogger theme and lives in this repo (`layouts/`, `assets/css/main.css`, `assets/js/main.js`); there is no external theme module.

## Writing a post

```bash
hugo new posts/my-post/index.md
```

Front matter fields are listed in `archetypes/default.md`. `categories` takes the most specific category from `data/taxonomy.yaml` (e.g. `["Battery"]`); the group page (Materials) picks it up automatically. `tags` are free-form and shown as `#tag`. A `featured.jpg` (or `cover.*`, `thumbnail.*`) next to `index.md` becomes the list thumbnail and the social preview image.

Bilingual content follows the Blogger theme's convention: anything marked Korean or English is filtered by the 한 / 한·영 / EN toggle, unmarked content always shows.

- Blocks: `{{< ko >}} … {{< /ko >}}` and `{{< en >}} … {{< /en >}}` (Markdown works inside)
- Single paragraph, heading, list or table: `{.ko}` / `{.en}` on the next line (headings: `## 제목 {.ko}`)
- Inline: `{{< ko inline >}}…{{< /ko >}}`
- English title: `title_en` in front matter (the old `한글 || English` title also works)

Math (`$…$`, `$$…$$`) is rendered by KaTeX and fenced code by highlight.js, both loaded only on posts that need them. `content/posts/theme-guide/` is a draft reference post showing all of this; it is never published.

## Categories

Edit `data/taxonomy.yaml` (groups, English display names, Korean names). A new group also needs `content/categories/<slug>/_index.md` so its menu link works before it has posts.

## Comments

Comments use giscus and stay hidden until configured: enable Discussions on this repository, install the giscus GitHub App, generate the values at giscus.app, and fill in `[params.giscus]` in `hugo.toml`.

## Local preview

Hugo extended 0.123.7 (the version pinned in CI):

```bash
hugo server -D
```
