/**
 * Lazily-built map of leaf-category path -> posts in that category, shared by
 * akari_related_posts. Memoised for the lifetime of the build; `hexo clean`
 * starts a fresh process, so it can never go stale within a run.
 */
const { merge, isIntroPost, splitCategoryName } = require('./lib/config');

let relatedIndexCache = null;

/**
 * Read source/_data/categories.yml.
 *
 * `hexo.site` is NOT where this lives. Hexo sets `this.site` on the per-render
 * Locals instance, and helpers are invoked with that instance bound as `this`
 * (hexo/dist/theme/view.js: `helpers[key].bind(locals)`). Reading `hexo.site`
 * therefore yields undefined, silently. Every helper in this file used to do
 * exactly that, so site.data.categories was always {} — combined with
 * categories.yml being unparseable, the whole category-metadata feature did
 * nothing.
 */
function categoriesDataFrom(locals) {
  const site = (locals && locals.site) || {};
  return (site.data && site.data.categories) || {};
}

/**
 * Resolve presentation metadata for a category name.
 *
 * `category.name` is the FULL path — a post with `categories: technology/database`
 * yields the category name "technology/database", and `category.parent` is
 * undefined. Every lookup here used to treat that whole string as both the top
 * key and the leaf key, so nothing ever matched and callers fell back to the raw
 * path (which is why /categories/ displayed "technology/computer science" as a
 * card title).
 *
 * Splitting on "/" makes the leaf segment the lookup key, matching the shape of
 * categories.yml.
 */
function categoryMetaFrom(locals, name) {
  const data = categoriesDataFrom(locals);
  const { topKey, leafKey } = splitCategoryName(name);

  if (!topKey) {
    return { topName: '', leafName: '', description: '', icon: 'folder' };
  }

  const topMeta = data[topKey] || {};
  const subMeta = (topMeta.subcategories && topMeta.subcategories[leafKey]) || {};

  return {
    // Fall back to the leaf segment rather than the full path, so a missing
    // entry degrades to "database" instead of "technology/database".
    topName: topMeta.name || topKey,
    leafName: subMeta.name || leafKey,
    description: subMeta.description || topMeta.description || '',
    icon: subMeta.icon || topMeta.icon || 'folder',
  };
}

hexo.extend.helper.register('akari_category_meta', function (name) {
  return categoryMetaFrom(this, name);
});

hexo.extend.helper.register('akari_config', function () {
  const locals = this;
  const siteConfig = hexo.config || {};

  /*
   * Defaults live in themes/akari/_config.yml, which Hexo loads into
   * hexo.theme.config. A site overrides any of them under the `akari:` key of its
   * OWN _config.yml, which lands in hexo.config.akari — a separate namespace Hexo
   * does not fold in for us.
   *
   * Previously the defaults were a ~160 line object right here, AND the site
   * _config.yml carried a verbatim copy of the whole `ui:` block: two copies of
   * the same strings, one silently shadowing the other.
   *
   * merge() is deliberately the theme's own, not hexo-util's deepMerge: only this
   * one replaces arrays wholesale, which is what lets a site remove a default nav
   * entry instead of having it re-appended.
   */
  const themeConfig = hexo.theme.config || {};
  const overrides = siteConfig.akari || {};
  const merged = merge(themeConfig, overrides);

  /*
   * Site metadata falls back to the root _config.yml, which is exactly why it is
   * not a literal in the theme YAML — it depends on the site.
   */
  merged.site = merged.site || {};
  const site = merged.site;
  site.title = site.title || siteConfig.title || 'Hexo';
  site.subtitle = site.subtitle || siteConfig.subtitle || '';
  site.description = site.description || siteConfig.description || '';
  site.author = site.author || siteConfig.author || 'John Doe';
  site.language = site.language || siteConfig.language || 'zh-CN';
  if (site.since == null) site.since = new Date().getFullYear();

  // Accept either a YAML list or a comma-separated string.
  site.keywords = Array.isArray(site.keywords)
    ? site.keywords
    : String(site.keywords || '')
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  merged.footer = merged.footer || {};
  if (merged.footer.since == null) merged.footer.since = site.since;

  // Attached rather than read from the theme config: it comes from
  // source/_data/categories.yml, not from either _config.yml.
  merged.categories = categoriesDataFrom(locals);

  return merged;
});

/**
 * Whether a post is a category cover article. The rule itself lives in
 * lib/config.js so that this helper, akari_category_cards and the category page
 * cannot disagree — the predicate used to be written out three times.
 */
hexo.extend.helper.register('akari_is_intro_post', function (post) {
  // Every helper is bound onto the locals, so the merged config is reachable
  // from here. The previous version read only the site override
  // (hexo.config.akari) and so ignored any theme-level default.
  const akari = this.akari_config ? this.akari_config() : {};
  const suffix = (akari.category && akari.category.intro_suffix) || '-intro';
  return isIntroPost(post, suffix);
});

/**
 * Deterministically order a Hexo term collection (site.tags, site.categories).
 *
 * Why this exists: Hexo reads post source files in parallel, so terms are
 * created in whatever order those reads happen to complete. Iterating the
 * collection directly therefore yields a DIFFERENT order on every clean build —
 * running `hexo clean && hexo generate` four times produced four different tag
 * clouds. For a static site that means the sidebar and tag cloud reshuffle on
 * every deploy, and the generated HTML can never be meaningfully diffed (which
 * is exactly the safety net used to verify template refactors).
 *
 * Default order is post count descending (most-used terms lead — right for a
 * tag cloud or the category sidebar), then by name for a total order. Pass
 * 'name' as the second argument for a pure alphabetical order, which is what
 * an individual article's own tag/category chips want.
 *
 * The name comparison is deliberately a plain code-unit comparison rather than
 * localeCompare: it has to be byte-identical on every machine regardless of
 * which ICU data the local Node was built with.
 */
/**
 * Posts sharing a given post's leaf category.
 *
 * post.ejs used to derive this by filtering ALL of site.posts inside the
 * template, once per article — O(posts²) across a build. Here the grouping is
 * built once and memoised for the rest of the run.
 *
 * Implemented as a lazily-memoised helper rather than a `before_generate` filter
 * on purpose: a filter that mutates documents at before_generate does NOT
 * survive, because Hexo re-materialises `locals` afterwards (verified — the
 * property was absent on every document at after_generate). Hexo's own `prev` /
 * `next` are assigned inside the post *generator*, on the very object that
 * becomes `page`, which is why they persist. Rendering time is the one moment
 * the data is guaranteed to be final and stable, so the cache is built there.
 */
hexo.extend.helper.register('akari_related_posts', function (post) {
  if (!post) return [];

  // Module-scoped so it survives across renders. `this` inside a helper is the
  // per-render locals object, so memoising there would rebuild every time.
  //
  // NOTE: helpers are bound with `this` = the Locals instance
  // (hexo/dist/theme/view.js: `helpers[key].bind(locals)`), and that instance is
  // where `.site` lives (hexo/dist/hexo/index.js sets `this.site` on the Locals
  // class, NOT on the Hexo object). `hexo.site` is undefined — a mistake the
  // pre-existing helpers in this file make as well.
  if (!relatedIndexCache) {
    const site = (this && this.site) || {};
    const model = site.posts || hexo.locals.get('posts') || [];
    const all = typeof model.toArray === 'function' ? model.toArray() : [];
    const byLeaf = new Map();

    all.forEach((item) => {
      const categories = item.categories && item.categories.length ? item.categories.toArray() : [];
      if (!categories.length) return;
      const leaf = categories[categories.length - 1];
      const key = String(leaf.path || leaf.name || '');
      if (!key) return;
      if (!byLeaf.has(key)) byLeaf.set(key, []);
      byLeaf.get(key).push(item);
    });

    byLeaf.forEach((list) => list.sort((a, b) => {
      const byDate = new Date(b.date) - new Date(a.date);
      if (byDate !== 0) return byDate;
      const pathA = String(a.path || '');
      const pathB = String(b.path || '');
      return pathA < pathB ? -1 : (pathA > pathB ? 1 : 0);
    }));

    relatedIndexCache = byLeaf;
  }

  const categories = post.categories && post.categories.length ? post.categories.toArray() : [];
  if (!categories.length) return [];

  const leaf = categories[categories.length - 1];
  const key = String(leaf.path || leaf.name || '');
  if (!key) return [];

  return (relatedIndexCache.get(key) || [])
    .filter((other) => String(other.path || '') !== String(post.path || ''));
});

/**
 * Build-time site statistics: post count, total words, last update.
 *
 * Computed from locals at build time rather than fetched, so unlike the visit
 * counters these are always present — no network, no third party, nothing to be
 * blocked. Memoised for the run.
 *
 * Word counting handles CJK and Latin separately: counting whitespace-separated
 * tokens would report a Chinese article as a handful of "words", which is
 * meaningless. CJK characters are counted individually; runs of Latin letters
 * count as one word each. Code blocks are excluded, since their contents say
 * nothing about how much was actually written.
 */
let buildStatsCache = null;

hexo.extend.helper.register('akari_build_stats', function () {
  if (buildStatsCache) return buildStatsCache;

  const model = (this.site && this.site.posts) || hexo.locals.get('posts') || [];
  const posts = typeof model.toArray === 'function' ? model.toArray() : [];

  const CJK = /[㐀-䶿一-鿿豈-﫿぀-ヿ]/g;
  const LATIN = /[A-Za-z][A-Za-z'-]*/g;

  let words = 0;
  let latest = 0;

  posts.forEach((post) => {
    const raw = String(post.content || '')
      .replace(/<figure class="highlight[\s\S]*?<\/figure>/g, ' ') // code blocks
      .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
      .replace(/<[^>]*>/g, ' ');

    const cjk = raw.match(CJK);
    const latin = raw.match(LATIN);
    words += (cjk ? cjk.length : 0) + (latin ? latin.length : 0);

    const stamp = new Date(post.updated || post.date).getTime();
    if (stamp > latest) latest = stamp;
  });

  buildStatsCache = {
    posts: posts.length,
    words,
    lastUpdated: latest ? new Date(latest) : null
  };

  return buildStatsCache;
});

hexo.extend.helper.register('akari_sort_terms', function (collection, mode) {
  let list = [];

  if (Array.isArray(collection)) {
    list = collection.slice();
  } else if (collection && typeof collection.toArray === 'function') {
    list = collection.toArray();
  } else if (collection && typeof collection.forEach === 'function') {
    collection.forEach((item) => list.push(item));
  }

  const byNameOnly = mode === 'name';

  return list.slice().sort((a, b) => {
    if (!byNameOnly) {
      const byCount = (b.length || 0) - (a.length || 0);
      if (byCount !== 0) {
        return byCount;
      }
    }

    const nameA = String(a.name || '');
    const nameB = String(b.name || '');
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
});

hexo.extend.helper.register('akari_category_cards', function () {
  // Helpers are bound to the per-render locals, which is where `.site` lives.
  const locals = this;
  const akari = this.akari_config ? this.akari_config() : {};
  const suffix = (akari.category && akari.category.intro_suffix) || '-intro';
  const introOnly = (akari.category && akari.category.intro_only) !== false;

  const categoriesModel = (locals.site && locals.site.categories) || [];
  const categories = typeof categoriesModel.toArray === 'function' ? categoriesModel.toArray() : categoriesModel;

  const cards = categories
    .map((category) => {
      const postsModel = category && category.posts ? category.posts : [];
      const posts = typeof postsModel.toArray === 'function' ? postsModel.toArray() : postsModel;
      // Shared with the sidebar and the category page's own fallback, so all
      // four lookup sites cannot disagree about the key shape again.
      const meta = categoryMetaFrom(locals, category.name);

      let introPost = null;
      posts.forEach((post) => {
        if (isIntroPost(post, suffix)) {
          if (!introPost || new Date(post.date) > new Date(introPost.date)) {
            introPost = post;
          }
        }
      });

      return {
        path: category.path,
        slug: category.slug,
        key: category.name,
        name: meta.leafName || category.name,
        groupName: meta.topName,
        description: meta.description,
        icon: meta.icon,
        introPost,
        postCount: Number(category.length || posts.length || 0)
      };
    })
    .filter((card) => (introOnly ? Boolean(card.introPost) : true))
    .sort((a, b) => {
      const aTime = a.introPost ? new Date(a.introPost.date).getTime() : 0;
      const bTime = b.introPost ? new Date(b.introPost.date).getTime() : 0;
      return bTime - aTime;
    });

  return cards;
});

hexo.extend.helper.register('get_category_structure', function () {
  return categoriesDataFrom(this);
});
