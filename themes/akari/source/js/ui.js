/**
 * Small shared UI behaviours: mobile menu, dark-mode button state, reading
 * progress and back-to-top.
 *
 * The mobile menu toggle used to be a three-line inline <script> in header.ejs
 * that just did classList.toggle('hidden'). That left the button with an
 * aria-label but no aria-expanded and no aria-controls, so assistive technology
 * could not tell whether the menu was open, and the page behind it kept
 * scrolling. Doing it here gives one place to keep that state honest.
 */

(function (global, document) {
  'use strict';

  var prefersReducedMotion = global.matchMedia
    && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Mobile menu ─────────────────────────────────────────────────────── */

  function initMobileMenu() {
    var button = document.getElementById('mobile-menu-button');
    var menu = document.getElementById('mobile-menu');
    if (!button || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('hidden', !open);
      button.setAttribute('aria-expanded', String(open));
      // Stops the page behind the open menu from scrolling.
      document.body.classList.toggle('nav-open', open);
    }

    setOpen(false);

    button.addEventListener('click', function () {
      setOpen(menu.classList.contains('hidden'));
    });

    // Escape closes it, as it does for every other disclosure on the page.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !menu.classList.contains('hidden')) {
        setOpen(false);
        button.focus();
      }
    });
  }

  /* ── Dark mode button state ──────────────────────────────────────────── */

  /*
   * The toggle is a button that reflects a binary mode, so it should expose
   * aria-pressed. dark-mode.js owns the actual class, so this observes that
   * rather than duplicating the logic.
   */
  function initDarkToggleState() {
    var button = document.getElementById('dark-mode-toggle');
    if (!button) return;

    function sync() {
      button.setAttribute('aria-pressed', String(document.documentElement.classList.contains('dark')));
    }

    sync();

    new MutationObserver(sync).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  /* ── Reading progress (post pages only) ──────────────────────────────── */

  function initReadingProgress() {
    var bar = document.getElementById('reading-progress');
    if (!bar) return;

    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - doc.clientHeight;
      var ratio = scrollable > 0 ? doc.scrollTop / scrollable : 0;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, ratio)) + ')';
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      global.requestAnimationFrame(update);
    }

    update();
    global.addEventListener('scroll', onScroll, { passive: true });
    global.addEventListener('resize', onScroll, { passive: true });
  }

  /* ── Back to top ─────────────────────────────────────────────────────── */

  function initBackToTop() {
    var button = document.getElementById('back-to-top');
    if (!button) return;

    var ticking = false;

    function update() {
      ticking = false;
      button.classList.toggle('is-visible', global.scrollY > 400);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      global.requestAnimationFrame(update);
    }

    update();
    global.addEventListener('scroll', onScroll, { passive: true });

    button.addEventListener('click', function () {
      // scroll-behavior: smooth is disabled under reduced motion, and passing
      // 'smooth' here would override that preference.
      global.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ── Visit counters ──────────────────────────────────────────────────── */

  /*
   * The counter script is a third party (Vercount). Poll briefly for the
   * counters to be populated, and only then reveal the container. If they never
   * arrive — blocked, offline, provider down — the block stays hidden and the
   * reader sees nothing at all, which is the correct failure mode for a metric
   * nobody needs. Labels with no numbers would look broken.
   */
  function initStatsCounters() {
    var wrap = document.querySelector('[data-vercount-scope]');
    if (!wrap) return;

    var DEADLINE_MS = 3000;
    var POLL_MS = 250;
    var started = Date.now();

    (function poll() {
      var counters = wrap.querySelectorAll('[id^="vercount_value_"]');
      var filled = false;

      for (var i = 0; i < counters.length; i++) {
        var text = (counters[i].textContent || '').trim();
        // Vercount writes a number; anything else (empty, "-", "N/A") is not a
        // real value yet.
        if (text && text !== '-' && /\d/.test(text)) { filled = true; break; }
      }

      if (filled) {
        wrap.classList.add('is-ready');
        return;
      }

      if (Date.now() - started < DEADLINE_MS) {
        global.setTimeout(poll, POLL_MS);
      }
      // Past the deadline: leave it hidden.
    })();
  }

  function init() {
    initMobileMenu();
    initDarkToggleState();
    initReadingProgress();
    initBackToTop();
    initStatsCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
