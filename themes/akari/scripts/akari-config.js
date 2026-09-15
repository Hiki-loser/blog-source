/**
 * Lazily-built map of leaf-category path -> posts in that category, shared by
 * akari_related_posts. Memoised for the lifetime of the build; `hexo clean`
 * starts a fresh process, so it can never go stale within a run.
 */
let relatedIndexCache = null;

hexo.extend.helper.register('akari_config', function () {
  const categoriesData = (hexo.site && hexo.site.data && hexo.site.data.categories) || {};
  const siteConfig = hexo.config || {};
  const rootAkariConfig = siteConfig.akari || {};
  const currentYear = new Date().getFullYear();

  const defaults = {
    site: {
      title: siteConfig.title || 'Hexo',
      subtitle: siteConfig.subtitle || '',
      description: siteConfig.description || '',
      keywords: [],
      author: siteConfig.author || 'John Doe',
      author_description: '保持热爱，奔赴山海',
      avatar: '/img/avatar.svg',
      language: siteConfig.language || 'zh-CN',
      since: currentYear
    },
    nav: [
      { name: '首页', path: '/' },
      { name: '归档', path: '/archives' },
      { name: '分类', path: '/categories' },
      { name: '标签', path: '/tags' },
      { name: '关于', path: '/about' }
    ],
    social: {},
    home: {
      featured_count: 3,
      intro_only: true,
      daily_image: {
        enable: true,
        api: 'https://uapis.cn/api/v1/random/image?category=acg&type=pc',
        alt_text: '每日 ACG 美图',
        refresh: true,
        // Give up and show the placeholder if the image has not loaded in time.
        // The API redirects twice to reach the file, so this has to allow for
        // more than a single request would.
        timeout: 8000,
        // Honour the browser's data-saver / slow-connection signal. The image
        // is 7680x4320; the download and the decode are both real costs.
        skip_on_save_data: true
      },
      background_image: {
        enable: true,
        api: 'https://uapis.cn/api/v1/random/image?category=landscape',
        // Home page only, and there is deliberately no cache_ttl option: this
        // API's image cannot be cached by any client-side means. See the header
        // of source/js/api-image.js for the tested reasons before adding one.
        // It is scoped to the home page precisely because of that.
        skip_on_save_data: true
      },
      stats: {
        enable: true
      }
    },
    dark_mode: {
      enable: true,
      default: 'auto'
    },
    music: {
      enable: false,
      type: 'netease',
      playlist_id: '',
      auto: false,
      custom_html: ''
    },
    comment: {
      enable: false,
      type: 'giscus',
      giscus: {
        repo: '',
        repo_id: '',
        category: '',
        category_id: ''
      },
      valine: {
        appId: '',
        appKey: ''
      },
      utterances: {
        repo: ''
      }
    },
    // Site-wide search. The index itself is produced by hexo-generator-searchdb
    // (configured under `search:` in the ROOT _config.yml — that plugin reads
    // its own top-level key, not this theme namespace). This block only
    // controls the front-end dialog and where it fetches from.
    search: {
      enable: true,
      // Resolved through url_for() so a non-root `root` config keeps working.
      path: '/search.json',
      // Fetched on first dialog open, never on page load.
      max_results: 20
    },
    footer: {
      since: currentYear,
      additional: ''
    },
    ui: {
      archive: {
        page_title: '归档',
        title: '文章归档',
        subtitle: '记录每一刻的思考与成长'
      },
      category: {
        page_title: '分类',
        title: '分类',
        subtitle: '探索不同主题的文章',
        post_count_suffix: '篇',
        cover_section_title: '分类导览',
        cover_section_subtitle: '仅展示各分类的介绍文章，点击进入查看该分类全部内容',
        enter_category: '进入分类',
        back_to_categories: '返回分类页',
        posts_title: '分类文章',
        intro_badge: '封面文章',
        empty_hint: '暂无可展示的分类封面文章，请为分类添加后缀为 -intro 的文章。',
        empty_posts: '该分类下暂无文章。'
      },
      tag: {
        page_title: '标签',
        title: '标签',
        subtitle: '发现更多关键词',
        post_count_suffix: '篇',
        back_to_tags: '返回标签页',
        posts_title: '标签文章',
        empty_posts: '该标签下暂无文章。'
      },
      home: {
        latest_posts_title: '最新文章',
        view_more: '查看更多',
        empty_posts: '暂无文章，开始创作吧。',
        stats: {
          posts: '总文章',
          intro_posts: '分类封面',
          categories: '分类数',
          tags: '标签数'
        }
      },
      sidebar: {
        social_title: '关注我',
        categories_title: '分类',
        tags_title: '标签'
      },
      profile: {
        posts: '文章',
        categories: '分类',
        tags: '标签'
      },
      pagination: {
        prev: '上一页',
        next: '下一页'
      },
      post: {
        back: '返回',
        prev_post: '上一篇',
        next_post: '下一篇',
        permalink: '本文链接：',
        copyright_prefix: '版权声明：本博客所有文章除特别声明外，均采用 ',
        copyright_suffix: ' 许可协议。转载请注明出处！'
      },
      comments: {
        title: '评论',
        valine_placeholder: '留下你的评论吧～',
        utterances_label: '💬 评论',
        incomplete_hint: '评论功能已开启，但配置尚不完整，请补全 _config.yml 中 akari.comment 配置。'
      },
      footer: {
        all_rights_reserved: 'All rights reserved.',
        powered_by: 'Powered by',
        theme_name: 'Akari Theme'
      },
      actions: {
        refresh_image: '刷新图片',
        toggle_dark_mode: '切换深色模式',
        menu: '菜单',
        search: '搜索',
        toggle_music: '切换音乐播放器',
        skip_to_content: '跳到主要内容',
        back_to_top: '回到顶部',
        search_placeholder: '搜索文章…',
        search_empty: '没有找到匹配的文章',
        search_hint: '输入关键词，Esc 关闭',
        search_loading: '正在加载索引…'
      },
      daily_image: {
        fallback_text: 'ACG Daily Image'
      }
    },
    categories: {}
  };

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function merge(base, source) {
    const output = Array.isArray(base) ? base.slice() : { ...base };

    Object.keys(source || {}).forEach((key) => {
      const baseValue = output[key];
      const sourceValue = source[key];

      if (isPlainObject(baseValue) && isPlainObject(sourceValue)) {
        output[key] = merge(baseValue, sourceValue);
      } else if (Array.isArray(sourceValue)) {
        output[key] = sourceValue.slice();
      } else if (sourceValue !== undefined) {
        output[key] = sourceValue;
      }
    });

    return output;
  }

  const merged = merge(defaults, rootAkariConfig);

  merged.site.keywords = Array.isArray(merged.site.keywords)
    ? merged.site.keywords
    : String(merged.site.keywords || '')
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  merged.categories = categoriesData;

  return merged;
});

hexo.extend.helper.register('akari_is_intro_post', function (post) {
  const siteConfig = hexo.config || {};
  const suffix =
    ((siteConfig.akari || {}).category && (siteConfig.akari || {}).category.intro_suffix) || '-intro';

  if (!post) {
    return false;
  }

  const source = String(post.source || '');
  const sourceName = source.split('/').pop() || '';
  const fileName = sourceName.replace(/\.[^/.]+$/, '');
  const slug = String(post.slug || '');
  const path = String(post.path || '');
  const pathSegment = path.split('/').filter(Boolean).pop() || '';

  return fileName.endsWith(suffix) || slug.endsWith(suffix) || pathSegment.endsWith(suffix);
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
  const siteConfig = hexo.config || {};
  const akari = siteConfig.akari || {};
  const categoriesData = (hexo.site && hexo.site.data && hexo.site.data.categories) || {};
  const suffix = (akari.category && akari.category.intro_suffix) || '-intro';
  const introOnly = (akari.category && akari.category.intro_only) !== false;

  const categoriesModel = (hexo.site && hexo.site.categories) || [];
  const categories = typeof categoriesModel.toArray === 'function' ? categoriesModel.toArray() : categoriesModel;

  function isIntro(post) {
    if (!post) {
      return false;
    }

    const source = String(post.source || '');
    const sourceName = source.split('/').pop() || '';
    const fileName = sourceName.replace(/\.[^/.]+$/, '');
    const slug = String(post.slug || '');
    const path = String(post.path || '');
    const pathSegment = path.split('/').filter(Boolean).pop() || '';

    return fileName.endsWith(suffix) || slug.endsWith(suffix) || pathSegment.endsWith(suffix);
  }

  function resolveCategoryMeta(topKey, leafKey) {
    const topMeta = categoriesData[topKey] || {};
    const subMeta = (topMeta.subcategories && topMeta.subcategories[leafKey]) || {};

    return {
      topName: topMeta.name || topKey,
      leafName: subMeta.name || leafKey,
      description: subMeta.description || topMeta.description || '',
      icon: subMeta.icon || topMeta.icon || 'folder'
    };
  }

  const cards = categories
    .map((category) => {
      const postsModel = category && category.posts ? category.posts : [];
      const posts = typeof postsModel.toArray === 'function' ? postsModel.toArray() : postsModel;
      const parent = category && category.parent ? category.parent : null;
      const topKey = String((parent && parent.name) || category.name || '');
      const leafKey = String(category.name || '');
      const meta = resolveCategoryMeta(topKey, leafKey);

      let introPost = null;
      posts.forEach((post) => {
        if (isIntro(post)) {
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
  const categoriesData = (hexo.site && hexo.site.data && hexo.site.data.categories) || {};
  return categoriesData;
});
