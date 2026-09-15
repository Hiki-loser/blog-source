/**
 * Tests for scripts/lib/config.js.
 *
 * Run with `node --test themes/akari/scripts/lib/` (no dependencies, Node's
 * built-in runner).
 *
 * These cover the behaviours that are easy to break silently and expensive to
 * notice: array replacement semantics (which decide whether a site can remove a
 * default nav entry), category-name splitting (whose absence made the entire
 * category metadata feature a no-op), and the intro-post marker.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { merge, isPlainObject, splitCategoryName, isIntroPost } = require('./config');

test('merge: replaces arrays wholesale rather than concatenating', () => {
  const base = { nav: [{ name: 'home' }, { name: 'archive' }] };
  const result = merge(base, { nav: [{ name: 'only' }] });

  assert.deepStrictEqual(result.nav, [{ name: 'only' }]);
  // The whole point: a site must be able to REMOVE a default entry, which a
  // concatenating merge would make impossible.
});

test('merge: does not mutate its inputs', () => {
  const base = { site: { title: 'base' }, nav: ['a'] };
  const source = { site: { subtitle: 'sub' } };

  merge(base, source);

  assert.deepStrictEqual(base, { site: { title: 'base' }, nav: ['a'] });
  assert.deepStrictEqual(source, { site: { subtitle: 'sub' } });
});

test('merge: deep-merges nested plain objects', () => {
  const result = merge(
    { home: { daily_image: { enable: true, api: 'x' }, stats: { enable: true } } },
    { home: { daily_image: { api: 'y' } } }
  );

  assert.deepStrictEqual(result.home, {
    daily_image: { enable: true, api: 'y' },
    stats: { enable: true },
  });
});

test('merge: copies the source array so later mutation cannot leak back', () => {
  const source = { list: ['a'] };
  const result = merge({}, source);

  result.list.push('b');

  assert.deepStrictEqual(source.list, ['a']);
});

test('merge: ignores undefined values but keeps null and false', () => {
  const result = merge(
    { a: 'keep', b: 'keep', c: 'keep' },
    { a: undefined, b: null, c: false }
  );

  assert.strictEqual(result.a, 'keep');
  assert.strictEqual(result.b, null);
  assert.strictEqual(result.c, false);
});

test('merge: tolerates a missing source', () => {
  assert.deepStrictEqual(merge({ a: 1 }, undefined), { a: 1 });
});

test('isPlainObject: rejects arrays, null and scalars', () => {
  assert.strictEqual(isPlainObject({}), true);
  assert.strictEqual(isPlainObject([]), false);
  assert.strictEqual(isPlainObject(null), false);
  assert.strictEqual(isPlainObject('x'), false);
});

test('splitCategoryName: takes the leaf segment of a nested category', () => {
  // Hexo reports the full path as the category name; the leaf is what keys into
  // source/_data/categories.yml.
  assert.deepStrictEqual(splitCategoryName('technology/database'), {
    topKey: 'technology',
    leafKey: 'database',
  });
});

test('splitCategoryName: handles a single-segment category', () => {
  assert.deepStrictEqual(splitCategoryName('projects'), {
    topKey: 'projects',
    leafKey: 'projects',
  });
});

test('splitCategoryName: handles a path with spaces and three segments', () => {
  assert.deepStrictEqual(splitCategoryName('technology/computer science/extra'), {
    topKey: 'technology',
    leafKey: 'extra',
  });
});

test('splitCategoryName: handles empty and missing names', () => {
  assert.deepStrictEqual(splitCategoryName(''), { topKey: '', leafKey: '' });
  assert.deepStrictEqual(splitCategoryName(undefined), { topKey: '', leafKey: '' });
});

test('isIntroPost: detects the marker in the file name', () => {
  assert.strictEqual(isIntroPost({ source: '_posts/technology/java/java-intro.md' }), true);
  assert.strictEqual(isIntroPost({ source: '_posts/technology/java/multithreading1.md' }), false);
});

test('isIntroPost: falls back to slug and path', () => {
  assert.strictEqual(isIntroPost({ slug: 'technology/agent/agent-intro' }), true);
  assert.strictEqual(isIntroPost({ path: '2026/04/17/technology/agent/agent-intro/' }), true);
});

test('isIntroPost: uses a custom suffix when given one', () => {
  // The marker is a SUFFIX of the file name, not the whole of it: a file has to
  // end with "<something>-overview" to match "-overview".
  assert.strictEqual(isIntroPost({ source: '_posts/x/topic-overview.md' }, '-overview'), true);
  assert.strictEqual(isIntroPost({ source: '_posts/x/topic-overview.md' }, '-intro'), false);
  // "overview.md" does not end with "-overview", so it is not a cover article.
  assert.strictEqual(isIntroPost({ source: '_posts/x/overview.md' }, '-overview'), false);
});

test('isIntroPost: returns false for a missing post', () => {
  assert.strictEqual(isIntroPost(null), false);
});
