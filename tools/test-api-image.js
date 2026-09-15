#!/usr/bin/env node
/**
 * Behavioural tests for themes/akari/source/js/api-image.js.
 *
 * The module's interesting paths — a hanging API, a metered connection, an
 * element that already carries the URL — are awkward to reproduce reliably in a
 * browser, so its contract is pinned down here against a fake window/Image.
 *
 * Run: node tools/test-api-image.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const SOURCE = path.resolve('themes/akari/source/js/api-image.js');
const CODE = fs.readFileSync(SOURCE, 'utf8');

const API = 'https://uapis.cn/api/v1/random/image?category=landscape';

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ok   ${name}`);
    })
    .catch((err) => {
      failed++;
      console.error(`  FAIL ${name}`);
      console.error(`       ${err.message}`);
    });
}

/**
 * Build a sandbox with a fake window.
 *
 * `behaviour` decides what a loading element does:
 *   'load'  -> succeeds   'error' -> fails   'hang' -> never settles
 */
function makeSandbox({ behaviour = 'load', connection = null } = {}) {
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    JSON,
    Date,
    isFinite,
    parseInt,
  };

  sandbox.navigator = connection ? { connection } : {};

  // Minimal <img> stand-in driving the onload/onerror contract of the module's
  // `resolve`-free, element-based loading.
  sandbox.Image = function FakeImage() {
    const self = this;
    self._src = '';
    self.currentSrc = '';
    Object.defineProperty(self, 'src', {
      get: () => self._src,
      set: (value) => {
        self._src = value;
        self.currentSrc = value;
        if (behaviour === 'load') setTimeout(() => self.onload && self.onload(), 0);
        else if (behaviour === 'error') setTimeout(() => self.onerror && self.onerror(), 0);
      },
    });
  };

  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox, { filename: SOURCE });

  return { sandbox, api: sandbox.AkariApiImage };
}

/**
 * A fake element with the addEventListener surface attach() uses.
 * `src` records what was assigned; `fire('load')` settles the load.
 */
function fakeImgElement() {
  const listeners = {};
  const el = {
    _src: '',
    currentSrc: '',
    writes: 0,
    get src() {
      return el._src;
    },
    set src(v) {
      el.writes++;
      el._src = v;
    },
    getAttribute(name) {
      return name === 'src' ? el._src : null;
    },
    addEventListener(type, fn) {
      (listeners[type] = listeners[type] || []).push(fn);
    },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] || []).filter((f) => f !== fn);
    },
    fire(type) {
      (listeners[type] || []).slice().forEach((fn) => fn());
    },
    listenerCount(type) {
      return (listeners[type] || []).length;
    },
  };
  return el;
}

(async function run() {
  console.log(`Testing ${path.relative(process.cwd(), SOURCE)}\n`);

  await test('attach(): loads the API URL and resolves when it completes', async () => {
    const { api } = makeSandbox({ behaviour: 'load' });
    const img = fakeImgElement();
    const pending = api.attach(img, API, { timeout: 1000 });
    setTimeout(() => img.fire('load'), 0);

    const result = await pending;
    assert.strictEqual(img.src, API, 'element should be pointed at the API URL');
    assert.ok(result, 'should resolve a result on success');
    assert.strictEqual(result.timedOut, false);
  });

  await test('attach(): a hung load times out and resolves null', async () => {
    const { api } = makeSandbox({ behaviour: 'hang' });
    const img = fakeImgElement();
    const start = Date.now();
    const result = await api.attach(img, API, { timeout: 60 });

    assert.strictEqual(result, null, 'callers rely on null to show a placeholder');
    assert.ok(Date.now() - start < 2000, 'must not wait indefinitely');
  });

  await test('attach(): a failed load resolves null', async () => {
    const { api } = makeSandbox({ behaviour: 'error' });
    const img = fakeImgElement();
    const pending = api.attach(img, API, { timeout: 1000 });
    setTimeout(() => img.fire('error'), 0);

    assert.strictEqual(await pending, null);
  });

  await test('attach(): removes its listeners once settled', async () => {
    const { api } = makeSandbox({ behaviour: 'load' });
    const img = fakeImgElement();
    const pending = api.attach(img, API, { timeout: 1000 });
    setTimeout(() => img.fire('load'), 0);
    await pending;

    assert.strictEqual(img.listenerCount('load'), 0, 'load listener must be released');
    assert.strictEqual(img.listenerCount('error'), 0, 'error listener must be released');
  });

  await test('attach(): settles only once even if load and error both fire', async () => {
    const { api } = makeSandbox({ behaviour: 'load' });
    const img = fakeImgElement();
    const pending = api.attach(img, API, { timeout: 1000 });
    setTimeout(() => {
      img.fire('load');
      img.fire('error');
    }, 0);

    assert.ok(await pending, 'first event wins; the second must be ignored');
  });

  await test('attach(): does not reassign src when it already equals the API URL', async () => {
    const { api } = makeSandbox({ behaviour: 'hang' });
    const img = fakeImgElement();
    img.src = API; // as server-rendered, for the no-JS path
    const before = img.writes;

    await api.attach(img, API, { timeout: 60 });

    assert.strictEqual(
      img.writes,
      before,
      'reassigning the same src restarts the load in some browsers and would double-fetch'
    );
  });

  await test('attach(): sets src when it differs', async () => {
    const { api } = makeSandbox({ behaviour: 'hang' });
    const img = fakeImgElement();

    await api.attach(img, API, { timeout: 60 });

    assert.strictEqual(img.src, API);
  });

  await test('attach(): skipOnSaveData skips the request entirely on a metered link', async () => {
    const { api } = makeSandbox({ behaviour: 'load', connection: { saveData: true } });
    const img = fakeImgElement();
    const result = await api.attach(img, API, { timeout: 1000, skipOnSaveData: true });

    assert.strictEqual(result, null, 'must not report a load');
    assert.strictEqual(img.writes, 0, 'must not touch the element, so no request is made');
  });

  await test('attach(): still loads when skipOnSaveData is not requested', async () => {
    const { api } = makeSandbox({ behaviour: 'load', connection: { saveData: true } });
    const img = fakeImgElement();
    const pending = api.attach(img, API, { timeout: 1000 });
    setTimeout(() => img.fire('load'), 0);

    assert.ok(await pending, 'data-saver is opt-in per call site');
    assert.strictEqual(img.src, API);
  });

  await test('skipForConnection(): detects saveData', async () => {
    const { api } = makeSandbox({ connection: { saveData: true } });
    assert.strictEqual(api.skipForConnection(), true);
  });

  await test('skipForConnection(): detects slow effective connection types', async () => {
    for (const effectiveType of ['slow-2g', '2g']) {
      const { api } = makeSandbox({ connection: { effectiveType } });
      assert.strictEqual(api.skipForConnection(), true, `${effectiveType} should be skipped`);
    }
  });

  await test('skipForConnection(): does not skip a normal connection', async () => {
    const { api } = makeSandbox({ connection: { effectiveType: '4g', saveData: false } });
    assert.strictEqual(api.skipForConnection(), false);
  });

  await test('skipForConnection(): does not skip when the API is unavailable', async () => {
    const { api } = makeSandbox();
    assert.strictEqual(api.skipForConnection(), false, 'no Network Information API -> load normally');
  });

  await test('attach(): falls back to a sane timeout for a missing or invalid value', async () => {
    const { api } = makeSandbox({ behaviour: 'hang' });
    const img = fakeImgElement();
    // timeout: 0 / -1 / NaN must not mean "give up immediately".
    const result = await api.attach(img, API, { timeout: -1 });
    assert.strictEqual(result, null);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
