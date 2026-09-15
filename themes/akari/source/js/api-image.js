/**
 * Timeout-bounded loader for the third-party random-image API (uapis.cn).
 *
 * WHY THERE IS NO CACHE HERE
 * This module originally cached the resolved image URL in localStorage so that
 * repeat views could reuse it. That was removed after testing showed it cannot
 * work against this API. Do not re-attempt it without re-reading this:
 *
 *   1. `https://uapis.cn/api/v1/random/image?...` answers 302 with
 *      `Cache-Control: no-store, no-cache, must-revalidate`, so the redirect is
 *      never reused and every call lands on a different image.
 *   2. The redirect target is not an image — it is one of SEVERAL upstream
 *      random-image APIs, chosen at random per request (observed alternating
 *      between `tu.ltyuanfang.cn/api/fengjing.php` and
 *      `imgapi.xl0408.top/index.php`), each of which 302s again to the file.
 *   3. The final image host DOES send `Cache-Control: max-age=2592000`, but no
 *      `Access-Control-Allow-Origin`. So JS cannot `fetch()` it — the Cache API
 *      and canvas are both unreachable, and only a Service Worker (which can
 *      store opaque responses) could ever reuse the bytes.
 *   4. There is no JSON or no-redirect mode: probed `format`, `type`, `json`,
 *      `redirect`, `return`, `output` and `Accept: application/json` — all 302.
 *   5. `img.currentSrc` and the Resource Timing API both report only the
 *      ORIGINAL url. The redirect chain is invisible to JS. Verified in Chrome.
 *
 * Net effect: the image cannot be reused by any means short of a Service
 * Worker, so each load costs the full download. The response to that was to
 * reduce how often it happens (the backdrop now loads on the home page only)
 * rather than to pretend to cache it.
 *
 * WHAT THIS MODULE DOES INSTEAD
 *   - Bounds every load with a timeout, so a slow or hanging API degrades to a
 *     caller-supplied placeholder instead of leaving an element at opacity 0
 *     forever, which is what a plain <img src> does.
 *   - Skips the request entirely on the browser's data-saver / slow-connection
 *     signal. The image is 7680x4320; the decode cost alone is real on mobile.
 *   - Loads through the element that will display the image, so there is one
 *     request rather than a probe plus a display.
 */

(function (global) {
  'use strict';

  function skipForConnection() {
    var connection = global.navigator && global.navigator.connection;
    if (!connection) return false;
    if (connection.saveData) return true;
    return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
  }

  function positiveInt(value, fallback) {
    var n = parseInt(value, 10);
    return isFinite(n) && n > 0 ? n : fallback;
  }

  /**
   * Load `apiUrl` into `img`.
   *
   * Resolves `null` if the caller should show its placeholder — either the load
   * failed, or it exceeded `timeout`. Resolving `null` does not cancel the
   * in-flight request; callers are expected to swap in a fallback, which
   * replaces the element's src and aborts it.
   *
   * `{ skipOnSaveData: true }` opts out on metered / slow connections.
   */
  function attach(img, apiUrl, options) {
    var opts = options || {};
    var timeout = positiveInt(opts.timeout, 6000);

    if (opts.skipOnSaveData && skipForConnection()) {
      return Promise.resolve(null);
    }

    return new Promise(function (resolve) {
      var settled = false;
      var timer = null;

      function settle(value) {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve(value);
      }

      function onLoad() {
        settle({ url: img.currentSrc || img.src || null, timedOut: false });
      }

      function onError() {
        settle(null);
      }

      timer = setTimeout(function () { settle(null); }, timeout);

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);

      // Only assign when it differs: re-assigning the value an element already
      // has restarts the load in some browsers, which would fetch this ~484 KB
      // image twice. Elements may legitimately arrive with the API URL already
      // server-rendered — that is what keeps the no-JS path working.
      if (img.getAttribute('src') !== apiUrl) {
        img.src = apiUrl;
      }
    });
  }

  global.AkariApiImage = {
    attach: attach,
    skipForConnection: skipForConnection
  };
})(window);
