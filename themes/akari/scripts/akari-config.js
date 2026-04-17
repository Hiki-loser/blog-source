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
        post_count_suffix: '篇'
      },
      tag: {
        page_title: '标签',
        title: '标签',
        subtitle: '发现更多关键词'
      },
      home: {
        latest_posts_title: '最新文章',
        view_more: '查看更多'
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

hexo.extend.helper.register('get_category_structure', function () {
  const categoriesData = (hexo.site && hexo.site.data && hexo.site.data.categories) || {};
  return categoriesData;
});
