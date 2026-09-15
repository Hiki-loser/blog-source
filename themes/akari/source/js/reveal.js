/**
 * Scroll reveal for article bodies.
 *
 * This has been the source of two "the article is invisible" bugs, so the
 * mechanism is worth stating plainly:
 *
 *   1. Originally CSS hid everything (`.animate-on-scroll { opacity: 0 }`) and
 *      JS revealed it on scroll. JS failure meant no article.
 *   2. That was "fixed" by letting JS arm the animation instead. Still fatal
 *      when it went wrong — measured in Chrome, 40 elements were armed while
 *      the observer marked zero visible, leaving the whole article at
 *      opacity 0. Same outcome, one indirection later.
 *
 * The real fix was to stop animating opacity at all (see the
 * `html.reveal-armed` rules in style.css). Armed elements are offset and slide
 * into place; they are legible the entire time. The worst case for any failure
 * here is now a 20px offset, never unreadable text.
 *
 * Extracted from an inline <script> that sat at the bottom of post.ejs. Its
 * selector was document-wide, so it also shifted the header, footer and
 * sidebar around; it is scoped to direct children of `.prose` here.
 */

(function (global, document) {
  'use strict';

  // Nothing to drive the reveal without this. Arming anyway would be harmless
  // now (no opacity involved), but there is no point.
  if (!('IntersectionObserver' in global)) return;

  // Honour the reader's motion preference by never arming, so nothing shifts.
  if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SELECTOR = '.prose > h1, .prose > h2, .prose > h3, .prose > h4, .prose > p, .prose > pre, .prose > blockquote, .prose > ul, .prose > ol, .prose > figure.highlight';

  // Cap the animated set. A long article can have hundreds of block elements,
  // and the effect is only ever noticed in the first screen or two.
  var MAX_ELEMENTS = 40;

  function init() {
    var targets = Array.prototype.slice.call(document.querySelectorAll(SELECTOR), 0, MAX_ELEMENTS);
    if (!targets.length) return;

    document.documentElement.classList.add('reveal-armed');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) {
      el.classList.add('animate-on-scroll');
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
