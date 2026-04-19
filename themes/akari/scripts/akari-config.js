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
        refresh: true
      },
      background_image: {
        enable: true,
        api: 'https://uapis.cn/api/v1/random/image?category=landscape'
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
        toggle_music: '切换音乐播放器'
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

  return fileName.endsWith(suffix) || slug.endsWith(suffix);
});

hexo.extend.helper.register('akari_category_cards', function () {
  const siteConfig = hexo.config || {};
  const akari = siteConfig.akari || {};
  const categoriesData = (hexo.site && hexo.site.data && hexo.site.data.categories) || {};
  const suffix = (akari.category && akari.category.intro_suffix) || '-intro';
  const introOnly = (akari.category && akari.category.intro_only) !== false;

  const postsModel = (hexo.site && hexo.site.posts) || [];
  const posts = typeof postsModel.toArray === 'function' ? postsModel.toArray() : postsModel;
  const cardMap = new Map();

  function isIntro(post) {
    if (!post) {
      return false;
    }

    const source = String(post.source || '');
    const sourceName = source.split('/').pop() || '';
    const fileName = sourceName.replace(/\.[^/.]+$/, '');
    const slug = String(post.slug || '');

    return fileName.endsWith(suffix) || slug.endsWith(suffix);
  }

  function resolveCategoryMeta(chain) {
    const top = chain[0] || {};
    const leaf = chain[chain.length - 1] || {};
    const topKey = String(top.name || '');
    const leafKey = String(leaf.name || '');
    const topMeta = categoriesData[topKey] || {};
    const subMeta = (topMeta.subcategories && topMeta.subcategories[leafKey]) || {};

    return {
      topName: topMeta.name || topKey,
      leafName: subMeta.name || leafKey,
      description: subMeta.description || topMeta.description || '',
      icon: subMeta.icon || topMeta.icon || 'folder'
    };
  }

  posts.forEach((post) => {
    if (!post || !post.categories || typeof post.categories.toArray !== 'function') {
      return;
    }

    const chain = post.categories.toArray();
    if (!chain.length) {
      return;
    }

    const leaf = chain[chain.length - 1];
    const key = String(leaf.path || leaf.name || '');

    if (!key) {
      return;
    }

    const meta = resolveCategoryMeta(chain);

    if (!cardMap.has(key)) {
      cardMap.set(key, {
        path: leaf.path,
        slug: leaf.slug,
        key: leaf.name,
        name: meta.leafName,
        groupName: meta.topName,
        description: meta.description,
        icon: meta.icon,
        introPost: null,
        postCount: 0
      });
    }

    const card = cardMap.get(key);
    card.postCount += 1;

    if (isIntro(post)) {
      if (!card.introPost || new Date(post.date) > new Date(card.introPost.date)) {
        card.introPost = post;
      }
    }
  });

  const cards = Array.from(cardMap.values())
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
