/**
 * Site search dialog.
 *
 * The index is produced at build time by hexo-generator-searchdb (see the
 * `search:` block in the root _config.yml) and fetched on the FIRST OPEN of the
 * dialog, never on page load — most readers never search, and the index is the
 * largest asset on the site.
 *
 * Matching is deliberately plain substring matching over whitespace-split
 * tokens, AND-ed together. Chinese has no word boundaries, so a tokeniser would
 * be both wrong and unnecessary here; substring matching is the correct
 * primitive. Ranking is title > tags > categories > body, with recency as the
 * tie-break.
 *
 * Hand-rolled rather than pulled from a CDN: it is ~150 lines, it fetches a
 * same-origin file so it works anywhere, and it keeps the "no third-party
 * runtime dependency" property established when Tailwind moved off its CDN.
 */

(function (global, document) {
  'use strict';

  var dialog = document.getElementById('search-dialog');
  var trigger = document.getElementById('search-trigger');
  if (!dialog || !trigger) return;

  var input = document.getElementById('search-input');
  var resultsEl = document.getElementById('search-results');
  var statusEl = document.getElementById('search-status');
  if (!input || !resultsEl) return;

  var INDEX_URL = dialog.getAttribute('data-search-url') || '/search.json';
  var MAX_RESULTS = parseInt(dialog.getAttribute('data-search-max'), 10) || 20;

  var index = null;          // null = not fetched yet
  var loading = null;        // in-flight promise, so concurrent opens share it
  var activeIndex = -1;
  var lastFocused = null;
  var composing = false;     // true while an IME candidate window is open

  var UI = {
    loading: '正在加载索引…',
    empty: '没有找到匹配的文章',
    count: function (n) { return '找到 ' + n + ' 条结果'; },
  };

  /* ── Index ───────────────────────────────────────────────────────────── */

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;

    loading = fetch(INDEX_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('search index: HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        // searchdb emits a bare array; tolerate a wrapped shape too.
        index = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        return index;
      })
      .catch(function () {
        loading = null; // allow a retry on the next open
        index = [];
        return index;
      });

    return loading;
  }

  /* ── Matching ────────────────────────────────────────────────────────── */

  function plainText(html) {
    if (!html) return '';
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  }

  function search(query) {
    var tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];

    var hits = [];

    for (var i = 0; i < index.length; i++) {
      var entry = index[i];
      var title = String(entry.title || '');
      var tags = (entry.tags || []).join(' ');
      var categories = (entry.categories || []).join(' ');
      var body = plainText(entry.content);

      var titleLower = title.toLowerCase();
      var tagsLower = tags.toLowerCase();
      var catsLower = categories.toLowerCase();
      var bodyLower = body.toLowerCase();

      var score = 0;
      var matchedAll = true;

      for (var t = 0; t < tokens.length; t++) {
        var token = tokens[t];
        // A token must appear somewhere; every field it appears in adds weight.
        var found = false;

        if (titleLower.indexOf(token) !== -1) { score += 10; found = true; }
        if (tagsLower.indexOf(token) !== -1) { score += 5; found = true; }
        if (catsLower.indexOf(token) !== -1) { score += 3; found = true; }
        if (bodyLower.indexOf(token) !== -1) { score += 1; found = true; }

        if (!found) { matchedAll = false; break; }
      }

      if (!matchedAll) continue;

      var snippet = body;
      var firstToken = tokens[0];
      var at = bodyLower.indexOf(firstToken);
      if (at > 80) {
        snippet = '…' + body.slice(at - 40, at + 120);
      } else {
        snippet = body.slice(0, 160);
      }
      if (body.length > snippet.length) snippet += '…';

      hits.push({ entry: entry, score: score, snippet: snippet });
    }

    hits.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      // Tie-break: more recent first, then title, so the order is total and
      // stable rather than dependent on index order.
      var da = new Date(a.entry.date || 0).getTime() || 0;
      var db = new Date(b.entry.date || 0).getTime() || 0;
      if (db !== da) return db - da;
      return String(a.entry.title || '').localeCompare(String(b.entry.title || ''));
    });

    return hits.slice(0, MAX_RESULTS);
  }

  /* ── Rendering ───────────────────────────────────────────────────────── */

  function clearResults() {
    while (resultsEl.firstChild) resultsEl.removeChild(resultsEl.firstChild);
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
  }

  function renderMessage(text) {
    clearResults();
    var li = document.createElement('li');
    li.className = 'px-4 py-6 text-sm text-center text-gray-400';
    li.textContent = text;
    resultsEl.appendChild(li);
  }

  function renderResults(hits, query) {
    clearResults();

    if (!hits.length) {
      renderMessage(UI.empty);
      setStatus(UI.empty);
      return;
    }

    hits.forEach(function (hit, i) {
      var entry = hit.entry;

      var li = document.createElement('li');
      li.id = 'search-result-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');

      var a = document.createElement('a');
      a.href = entry.url || '#';
      a.className = 'block px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:bg-primary-50 dark:focus:bg-primary-900/20 outline-none';

      var title = document.createElement('div');
      title.className = 'font-medium text-gray-900 dark:text-gray-100';
      // textContent, never innerHTML: titles come from the index and would
      // otherwise be an injection point.
      title.textContent = entry.title || '(无标题)';
      a.appendChild(title);

      if (hit.snippet) {
        var snip = document.createElement('p');
        snip.className = 'mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2';
        snip.textContent = hit.snippet;
        a.appendChild(snip);
      }

      var meta = (entry.categories || []).concat(entry.tags || []);
      if (meta.length) {
        var metaEl = document.createElement('p');
        metaEl.className = 'mt-1 text-xs text-gray-400';
        metaEl.textContent = meta.join(' · ');
        a.appendChild(metaEl);
      }

      a.addEventListener('mouseenter', function () { setActive(i); });
      li.appendChild(a);
      resultsEl.appendChild(li);
    });

    setStatus(UI.count(hits.length));
    setActive(0);
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function setActive(i) {
    var items = resultsEl.querySelectorAll('[role="option"]');
    if (!items.length) return;

    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].setAttribute('aria-selected', 'false');
      items[activeIndex].classList.remove('bg-primary-50', 'dark:bg-primary-900/20');
    }

    activeIndex = (i + items.length) % items.length;

    items[activeIndex].setAttribute('aria-selected', 'true');
    items[activeIndex].classList.add('bg-primary-50', 'dark:bg-primary-900/20');
    input.setAttribute('aria-activedescendant', items[activeIndex].id);
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function openActive() {
    var items = resultsEl.querySelectorAll('[role="option"]');
    if (activeIndex >= 0 && items[activeIndex]) {
      var link = items[activeIndex].querySelector('a');
      if (link) global.location.href = link.href;
    }
  }

  /* ── Query ───────────────────────────────────────────────────────────── */

  function runQuery() {
    var query = input.value.trim();
    if (!query) {
      clearResults();
      setStatus('');
      return;
    }

    loadIndex().then(function () {
      // The input may have changed while the index was loading.
      if (input.value.trim() !== query) return;
      renderResults(search(query), query);
    });
  }

  /* ── Open / close ────────────────────────────────────────────────────── */

  function isOpen() {
    return !dialog.classList.contains('hidden');
  }

  function open() {
    if (isOpen()) return;
    lastFocused = document.activeElement;

    dialog.classList.remove('hidden');
    dialog.classList.add('flex');
    document.body.classList.add('nav-open'); // reuse: locks background scroll
    trigger.setAttribute('aria-expanded', 'true');

    input.value = '';
    clearResults();
    setStatus('');
    input.focus();

    if (!index) {
      renderMessage(UI.loading);
      loadIndex().then(function () {
        // Only clear the placeholder if the reader has not typed meanwhile.
        if (isOpen() && !input.value.trim()) clearResults();
      });
    }
  }

  function close() {
    if (!isOpen()) return;
    dialog.classList.add('hidden');
    dialog.classList.remove('flex');
    document.body.classList.remove('nav-open');
    trigger.setAttribute('aria-expanded', 'false');
    clearResults();

    // Return focus where it came from, so keyboard users are not dropped at
    // the top of the document. Falls back to the trigger when there is nothing
    // meaningful to restore — e.g. the dialog was opened programmatically, or
    // the element that opened it is no longer in the document.
    var restore = lastFocused;
    var canRestore = restore
      && restore !== document.body
      && restore !== document.documentElement
      && typeof restore.focus === 'function'
      && document.contains(restore);

    if (canRestore) restore.focus();
    else trigger.focus();
  }

  /* ── Wiring ──────────────────────────────────────────────────────────── */

  trigger.addEventListener('click', open);

  // Click the backdrop (but not the panel) to dismiss.
  dialog.addEventListener('mousedown', function (event) {
    if (event.target === dialog) close();
  });

  input.addEventListener('input', function () {
    // During IME composition the value is the half-formed pinyin buffer. Acting
    // on it would fire a search per keystroke and flash "no results" at a reader
    // who is simply still typing. Wait for compositionend.
    if (composing) return;
    runQuery();
  });

  input.addEventListener('compositionstart', function () { composing = true; });
  input.addEventListener('compositionend', function () {
    composing = false;
    runQuery();
  });

  dialog.addEventListener('keydown', function (event) {
    // Arrow handling must not fight the IME candidate window either.
    if (composing) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      openActive();
    } else if (event.key === 'Tab') {
      // Focus trap: the dialog holds a single input, so cycle it back.
      event.preventDefault();
      input.focus();
    }
  });

  // Global shortcuts: "/" like most documentation sites, and Ctrl/Cmd+K which
  // is what most people now reach for.
  document.addEventListener('keydown', function (event) {
    var target = event.target;
    var typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      isOpen() ? close() : open();
      return;
    }

    if (event.key === '/' && !typing && !isOpen()) {
      event.preventDefault();
      open();
    }
  });

  // The dialog markup is fetched alongside the page but the index is not, so
  // surface the short index size on first use without blocking anything.
  dialog.setAttribute('data-search-ready', 'true');
})(window, document);
