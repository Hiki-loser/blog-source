/**
 * Redirect stubs for URLs that have moved.
 *
 * Rather than a plugin (hexo-generator-alias is unmaintained and writes the stub
 * into the post's own directory), the list of moves lives in
 * source/_data/redirects.yml — one line per redirect, reviewable, greppable, and
 * impossible to drift away from the rename commit that introduced it.
 *
 * `layout: false` is the important detail: Hexo emits the string verbatim, with
 * no theme wrapper, no injector and no <body>. Verified in Hexo's route refresh
 * (`if (!layout) { route.set(path, data); return path; }`).
 *
 * Each stub carries:
 *   - <meta http-equiv="refresh"> and a location.replace() for the actual jump;
 *   - a canonical pointing at the destination, so the two URLs are not treated
 *     as duplicates by a crawler that does follow the stub;
 *   - noindex, since a stub is a forwarding address, not content;
 *   - a visible link, so the page is usable with JS disabled.
 *
 * scripts/seo.js excludes every `from` path in this file from sitemap.xml.
 */

'use strict';

hexo.extend.generator.register('akari-redirects', function (locals) {
  const list = (locals.data && locals.data.redirects) || [];
  if (!Array.isArray(list) || !list.length) return [];

  const base = String((hexo.config && hexo.config.url) || '').replace(/\/+$/, '');

  return list
    .filter((entry) => entry && entry.from && entry.to)
    .map((entry) => {
      const from = String(entry.from);
      const to = String(entry.to);

      // A `from` that names a file (example.html) is emitted at that exact path.
      // Anything else is a directory URL and gets an index.html inside it — which
      // also means a `from` containing spaces (an old slug that did) still
      // resolves, since servers decode %20 back to a space when matching.
      const path = /\.[a-z0-9]+$/i.test(from)
        ? from.replace(/^\/+/, '')
        : from.replace(/^\/+/, '').replace(/\/+$/, '') + '/index.html';

      const html = [
        '<!doctype html>',
        '<html lang="zh-CN">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="robots" content="noindex, follow">',
        `<link rel="canonical" href="${base}${to}">`,
        `<meta http-equiv="refresh" content="0;url=${to}">`,
        '<title>页面已迁移</title>',
        '</head>',
        '<body>',
        `<script>location.replace(${JSON.stringify(to)} + location.hash);</script>`,
        `<p>页面已迁移到 <a href="${to}">${to}</a></p>`,
        '</body>',
        '</html>',
        '',
      ].join('\n');

      return { path, layout: false, data: html };
    });
});
