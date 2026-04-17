hexo.extend.helper.register('akari_config', function () {
  const siteData = (hexo.site && hexo.site.data && hexo.site.data.akari) || {};
  const categoriesData = (hexo.site && hexo.site.data && hexo.site.data.categories) || {};
  const themeConfig = hexo.theme && hexo.theme.config ? hexo.theme.config : {};
  const siteConfig = hexo.config || {};
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
        api: 'https://api.i-meto.com/akari/daily',
        alt_text: '每日 ACG 美图',
        refresh: true
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

  const merged = merge(merge(defaults, themeConfig), siteData);

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
