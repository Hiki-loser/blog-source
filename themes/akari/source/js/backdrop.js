/**
 * Applies the decorative page backdrop image — home page only.
 *
 * The backdrop used to be an inline `style="--background-image-api: url('…')"`
 * on <body> of EVERY layout, so each of the ~15 page types issued an uncached
 * cross-origin request that redirects twice and pulls down a 484 KB,
 * 7680x4320 WebP, purely to render a layer at 10% opacity.
 *
 * Two things changed:
 *
 *   1. It is scoped to the home page. The API cannot be cached (see the header
 *      of api-image.js for the full, tested explanation), so the only honest
 *      lever was to stop paying for it on every page.
 *
 *   2. It is set by this script rather than declared in CSS, which is the only
 *      way to honour the browser's data-saver signal. That costs one small
 *      script and buys skipping a 484 KB download — and its 8K decode — on
 *      metered or slow connections.
 *
 * Deliberately NOT done here:
 *   - No probe-then-set. Loading the image to discover its URL would download
 *     it twice for no gain, since the URL cannot be reused anyway.
 *   - No timeout. A CSS background that arrives late, or never, is already the
 *     correct failure mode: the layer stays empty and the page is unaffected.
 */

(function (global, document) {
  'use strict';

  var root = document.documentElement;
  var api = root.getAttribute('data-backdrop-api');
  if (!api) return;

  // Skip on metered / slow connections. If the helper did not load (it is only
  // present when the daily image is also enabled), load the backdrop rather
  // than silently dropping it on everyone.
  if (global.AkariApiImage && global.AkariApiImage.skipForConnection && global.AkariApiImage.skipForConnection()) {
    return;
  }

  // Set on <html> so it inherits: body::before consumes it and would otherwise
  // need the property itself.
  root.style.setProperty('--background-image-api', 'url("' + api + '")');
})(window, document);
