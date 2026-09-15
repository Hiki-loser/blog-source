/**
 * sitemap.xml.
 *
 * Hand-rolled rather than delegating to hexo-generator-sitemap for one concrete
 * reason: that plugin cannot know about this theme's redirect stubs or
 * `noindex` pages, so it would advertise URLs that are explicitly marked "do not
 * index". A sitemap that contradicts the pages' own robots directives is worse
 * than no sitemap.
 *
 * Excluded here:
 *   - anything with `noindex` in its front-matter;
 *   - every path listed in source/_data/redirects.yml, which are 302-style
 *     stubs that only exist to forward old links (see scripts/redirects.js);
 *   - the 404 page and any route that is not a rendered document.
 *
 * The feed (atom.xml) is linked from every page via partial/seo.ejs instead, and
 * does not belong in a sitemap.
 */

'use strict';

hexo.extend.generator.register('akari-sitemap', function (locals) {
  // NOTE: `locals` here is `hexo.locals.toObject()`, which contains
  // posts/pages/categories/tags/data — but NOT `config`. Reading
  // `locals.config.url` silently yields undefined and the generator returns
  // nothing at all. Verified by dumping the keys at runtime.
  const base = String((hexo.config && hexo.config.url) || '').replace(/\/+$/, '');
  if (!base) {
    // Without a site URL there is no such thing as an absolute sitemap entry.
    return [];
  }

  const redirects = (locals.data && locals.data.redirects) || [];
  const redirectedPaths = new Set(
    redirects.map((r) => String(r.from || '').replace(/^\/+/, '').replace(/\/+$/, ''))
  );

  const seen = new Set();
  const entries = [];

  const add = (path, updated) => {
    if (!path) return;
    const clean = String(path).replace(/^\/+/, '');
    if (!clean || seen.has(clean)) return;
    if (redirectedPaths.has(clean.replace(/\/+$/, ''))) return;
    seen.add(clean);
    entries.push({ path: clean, updated: updated || null });
  };

  const isNoIndex = (item) => Boolean(item && item.noindex);

  (locals.posts && locals.posts.toArray() || []).forEach((post) => {
    if (isNoIndex(post)) return;
    add(post.path, post.updated || post.date);
  });

  (locals.pages && locals.pages.toArray() || []).forEach((page) => {
    if (isNoIndex(page)) return;
    // source/example.md and similar stray files render as `example.html`.
    if (page.path && page.path.endsWith('.html') && !page.path.includes('/')) return;
    add(page.path, page.updated || page.date);
  });

  // Listing pages. Enumerated explicitly rather than by walking hexo.route(),
  // which would drag in CSS, JS and images.
  add('archives/', null);

  const termPaths = (collection) => {
    const list = collection && collection.toArray ? collection.toArray() : [];
    list.forEach((term) => add(term.path, null));
  };
  termPaths(locals.tags);
  termPaths(locals.categories);

  if (!entries.length) return [];

  // Sorted by path so the file is byte-identical between builds. `locals.posts`
  // has no stable order (Hexo reads source files in parallel), and a sitemap
  // that reshuffles on every deploy is pure diff noise.
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const urls = entries
    .map((entry) => {
      const lines = ['  <url>', `    <loc>${base}/${entry.path}</loc>`];
      if (entry.updated) {
        const iso = new Date(entry.updated).toISOString();
        lines.push(`    <lastmod>${iso}</lastmod>`);
      }
      lines.push('  </url>');
      return lines.join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');

  return [
    {
      path: 'sitemap.xml',
      // layout: false emits the string verbatim — no theme wrapper, no injector.
      layout: false,
      data: xml,
    },
  ];
});
