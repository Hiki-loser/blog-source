/**
 * Third-party snippets, injected rather than templated.
 *
 * The rule this follows: anything the layout must own (stylesheet order, core
 * scripts, meta) lives in layout.ejs; anything optional and config-driven lives
 * here. Turning analytics on or off then never means editing a template, and
 * nothing is emitted at all when it is off.
 *
 * Why the injector rather than an `after_render:html` filter: the injector runs
 * strictly earlier, is cached per page type, and is marker-guarded so it cannot
 * double-inject on a watch-mode re-render. A raw string replace would re-parse
 * every page and would insert twice.
 *
 * VISIT COUNTERS
 * Provider is Vercount (https://events.vercount.one), a busuanzi-compatible
 * counter that is hosted in mainland China. Plain busuanzi
 * (busuanzi.ibruce.info) is deliberately NOT used: for this site's audience it
 * is the wrong dependency — unreliable behind the GFW and prone to multi-second
 * stalls, which is exactly the class of problem that moving Tailwind off its CDN
 * was meant to solve.
 *
 * Not added at all: Cloudflare Web Analytics (cloudflareinsights.com is
 * unreachable in mainland China) and Google Analytics (blocked outright). Both
 * would render a permanently empty panel for the readers this site is for.
 */

'use strict';

const COUNT_UNITS = { vercount: 'https://events.vercount.one' };

function akariConfig() {
  return (hexo.config && hexo.config.akari) || {};
}

function statsConfig() {
  return akariConfig().stats || {};
}

hexo.extend.injector.register(
  'head_end',
  function () {
    const stats = statsConfig();
    if (!stats.enable) return '';

    const origin = COUNT_UNITS[stats.provider || 'vercount'];
    if (!origin) return '';

    // Warm the connection while the body is still parsing, so the counter
    // script does not pay a fresh DNS + TLS handshake.
    return `<link rel="preconnect" href="${origin}" crossorigin>`;
  },
  'default'
);

hexo.extend.injector.register(
  'body_end',
  function () {
    const stats = statsConfig();
    if (!stats.enable) return '';

    const provider = stats.provider || 'vercount';
    if (provider !== 'vercount') return '';

    // `defer` so a slow or unreachable counter can never block rendering or the
    // load event. The matching markup is in partial/vercount.ejs, which keeps
    // itself hidden until the counters are actually populated.
    return '<script defer src="https://events.vercount.one/js" data-akari-stats></script>';
  },
  'default'
);
