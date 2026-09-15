# Akari

A Hexo theme. Dark mode, local search, TOC-friendly typography, and no runtime
CDN dependency.

Akari is not published to npm and is not a fork of anything — it lives in
`themes/akari/` of this repository and is versioned with it. To use it, copy the
directory into another Hexo site's `themes/` and set `theme: akari`.

## Requirements

- Hexo 8.x
- Node >= 20
- `hexo-renderer-ejs` and `hexo-renderer-marked` (the theme uses EJS layouts,
  and a filter adjusts the heading anchors marked produces)

The theme has no build step of its own. The compiled stylesheet it consumes is
built by the *site*, from `themes/akari/assets/`:

```
themes/akari/assets/tokens.css       design tokens — the only file with colour values
themes/akari/assets/tailwind.src.css Tailwind entry point
themes/akari/source/css/tailwind.css build OUTPUT, committed
themes/akari/source/css/style.css    hand-written CSS, consumes the tokens
```

`npm run build:css` (PostCSS: import → Tailwind v3 → autoprefixer → cssnano)
produces the committed `tailwind.css`. Rebuild it whenever `tokens.css`,
`tailwind.config.js`, or any class name changes; CI fails the deploy if the
committed file is out of date.

## Layout structure

`layout/layout.ejs` is the only file containing `<!DOCTYPE html>`. Hexo wraps
every other layout with it automatically — a layout resolves to `layout` unless
it declares its own, so no child layout needs a `layout:` key. Deleting that file
silently unwraps the entire theme.

Each child layout renders its own `<main>` content only:

| Layout | Route | Notes |
|---|---|---|
| `index.ejs` | `/`, `/page/N/` | home + pagination, widest column |
| `post.ejs` | an article | cover, TOC-friendly prose, prev/next, related |
| `page.ejs` | `/about/`, `/quiz/` | generic page |
| `archive.ejs` | `/archives/**` | timeline |
| `category.ejs` | `/categories/**` | card grid on the index, post list on a term |
| `tag.ejs` | `/tags/**` | tag cloud on the index, post list on a term |

Page type is derived in `layout.ejs` from the locals Hexo actually sets
(`__post`, `archive`, `tag`, `category`, `layout`, `__index`) — not guessed.

## Configuration

All theme options and defaults live in `themes/akari/scripts/akari-config.js`.
Override any of them under the `akari:` key of the site's `_config.yml`; the
merge is shallow for arrays, so replacing `nav` means supplying the whole list.

Notable keys: `site`, `nav`, `social`, `home.daily_image`,
`home.background_image`, `search`, `stats`, `dark_mode`, `music`, `comment`,
`footer`, `ui` (all display strings).

Plugins the theme expects at the site level:

- `hexo-generator-searchdb` — produces `search.json` for the search dialog
  (configured under the site's own `search:` key, not under `akari:`)
- `hexo-generator-feed` — produces `atom.xml`, offered as the subscription link

## Theme scripts

`scripts/` is loaded by Hexo at startup. Each file is one concern:

| File | Responsibility |
|---|---|
| `akari-config.js` | config merge + the helpers every layout calls |
| `inject.js` | third-party snippets (visit counters), config-gated |
| `seo.js` | `sitemap.xml` |
| `redirects.js` | redirect stubs, from `source/_data/redirects.yml` |
| `stable-output.js` | makes generated data files byte-reproducible |
| `heading-anchors.js` | takes `marked`'s heading anchors out of the tab order |

## Things worth knowing before changing anything

These are all load-bearing decisions with a comment at the point of use
explaining the reasoning at length. Summarised here so they are not undone by
accident:

- **No CDN at runtime.** Tailwind is compiled locally. It used to load
  `cdn.tailwindcss.com`, which is unreachable from mainland China and compiled
  CSS in the browser, so the site was unstyled for its actual readers. Do not
  reintroduce it, and treat any new third-party runtime dependency the same way.
- **The random-image backdrop loads on the home page only**, and cannot be
  cached. See the header of `source/js/api-image.js` for the tested reasons
  before attempting to add caching.
- **Dark mode is a token swap.** `style.css` contains no colour literals and no
  `.dark` override blocks; every colour comes from `assets/tokens.css`.
- **Scroll reveal animates position, never opacity.** Two earlier versions made
  articles invisible when JS failed or the observer did not fire. Do not
  reintroduce opacity there.
- **Cases differ only one way.** `tools/verify-taxonomy.js` fails the build on
  tags or categories that differ only by letter case, because they collide on
  case-insensitive filesystems and make builds non-reproducible.

## Tools

Run from the site root:

```
node tools/verify-class-coverage.js public   # no Tailwind class was purged
node tools/verify-taxonomy.js                # no case-colliding tags/categories
node tools/test-api-image.js                 # image loader behaviour
node tools/serve-public.js [port]            # serve public/ as production would
```

## Licence

MIT
