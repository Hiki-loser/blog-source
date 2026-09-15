/**
 * Pure helpers used by the theme's Hexo scripts.
 *
 * Kept dependency-free and side-effect-free so they can be unit tested directly
 * with `node --test` (see config.test.js) rather than only through a full Hexo
 * build. Hexo loads theme scripts with `require`, so a relative import works.
 */

'use strict';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep merge `source` over `base`.
 *
 * ARRAYS ARE REPLACED WHOLESALE, not concatenated. That is intentional and
 * load-bearing: with a concatenating merge it would be impossible to REMOVE a
 * default entry — supplying `nav` with four items would still yield the default
 * five. Every site override of an array must therefore restate it in full.
 *
 * `base` is not mutated; the result is a new object (arrays are copied).
 */
function merge(base, source) {
  const output = Array.isArray(base) ? base.slice() : { ...base };

  Object.keys(source || {}).forEach((key) => {
    const baseValue = output[key];
    const sourceValue = source[key];

    if (isPlainObject(baseValue) && isPlainObject(sourceValue)) {
      output[key] = merge(baseValue, sourceValue);
    } else if (Array.isArray(sourceValue)) {
      output[key] = sourceValue.slice();
    } else if (sourceValue !== undefined) {
      output[key] = sourceValue;
    }
  });

  return output;
}

/**
 * Split a Hexo category name into its top-level and leaf segments.
 *
 * Hexo gives a post's category the FULL path as its name — a post with
 * `categories: technology/database` produces the category name
 * "technology/database" — and `category.parent` is undefined. Looking that whole
 * string up as a key never matches anything, which is how the category metadata
 * ended up displaying raw paths.
 */
function splitCategoryName(name) {
  const parts = String(name || '').split('/').filter(Boolean);
  if (!parts.length) return { topKey: '', leafKey: '' };
  return { topKey: parts[0], leafKey: parts[parts.length - 1] };
}

/**
 * Whether a post is a category cover article, i.e. its source file name, slug or
 * final path segment ends with `suffix` (default `-intro`).
 *
 * This predicate was previously written out three times — once as the
 * `akari_is_intro_post` helper and twice inline — so a change to the rule could
 * have applied in one place and not the others.
 */
function isIntroPost(post, suffix) {
  const marker = suffix || '-intro';
  if (!post) return false;

  const source = String(post.source || '');
  const sourceName = source.split('/').pop() || '';
  const fileName = sourceName.replace(/\.[^/.]+$/, '');
  const slug = String(post.slug || '');
  const path = String(post.path || '');
  const pathSegment = path.split('/').filter(Boolean).pop() || '';

  return fileName.endsWith(marker) || slug.endsWith(marker) || pathSegment.endsWith(marker);
}

module.exports = { isPlainObject, merge, splitCategoryName, isIntroPost };
