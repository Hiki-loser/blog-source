/**
 * Take the heading anchor links out of the tab order.
 *
 * hexo-renderer-marked@7 wraps every heading as:
 *
 *   <h2 id="…"><a href="#…" class="headerlink" title="…"></a>Heading text</h2>
 *
 * That anchor has no text content, so a screen reader announces it as an
 * unlabelled link — and there is one per heading, on every article. On a long
 * post that is dozens of junk tab stops between the reader and the content.
 *
 * The `id` on the heading is useful and is kept (the TOC and deep links rely on
 * it); only the redundant anchor is hidden from assistive tech and the tab
 * order. Its hover affordance is restored in style.css.
 */

'use strict';

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data || typeof data.content !== 'string' || !data.content) return data;

  data.content = data.content.replace(/<a class="headerlink"([^>]*)>/g, function (match, attrs) {
    // Idempotent: never add the attributes twice if this runs again on an
    // already-processed document.
    if (/\btabindex=/.test(attrs)) return match;
    return '<a class="headerlink" tabindex="-1" aria-hidden="true"' + attrs + '>';
  });

  return data;
});
