/**
 * Scroll reveal for article bodies.
 *
 * Extracted from an inline <script> that used to sit at the end of post.ejs.
 * Two things were wrong with that version, both fixed here:
 *
 *  1. It selected `h1, h2, h3, h4, p, pre, blockquote` across the WHOLE
 *     document, so it also put `animate-on-scroll` (which is `opacity: 0`) on
 *     the header, footer, sidebar and pagination — not just the article. Scoped
 *     to `.prose` here.
 *  2. It bailed out of nothing: if IntersectionObserver was missing, the class
 *     was still applied and the content stayed invisible forever. Now the
 *     animation is only armed when the API actually exists.
 *
 * The remaining structural weakness — that content is hidden in CSS and
 * dependent on JS to appear — is inverted in a later pass, where the CSS
 * default becomes fully visible and this script opts elements INTO the
 * animation instead of opting them out of it.
 */

(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) {
    return;
  }

  var SELECTOR = '.prose h1, .prose h2, .prose h3, .prose h4, .prose p, .prose pre, .prose blockquote';

  function init() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(SELECTOR).forEach(function (el) {
      el.classList.add('animate-on-scroll');
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
