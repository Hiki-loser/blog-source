#!/usr/bin/env node
/**
 * Purge guard: every class used in the rendered HTML must resolve to a rule in
 * the compiled stylesheet.
 *
 * Why this exists: moving Tailwind from the CDN (which generates utilities from
 * the live DOM, so nothing can ever be missed) to a local build (which generates
 * them from `content` globs) introduces one silent failure mode — a class that
 * is present in the markup but absent from the globs gets purged, and the only
 * symptom is "that card lost its shadow". This turns that into a hard failure.
 *
 * Usage:  node tools/verify-class-coverage.js [publicDir]
 *
 * Exits non-zero if any class used in the HTML has no rule in the stylesheet.
 * Classes owned by hand-written CSS (prose, card-hover, quiz-*, …) are reported
 * separately, because "no Tailwind rule" is correct for them.
 */

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const PUBLIC_DIR = path.resolve(process.argv[2] || 'public');
const CSS_FILE = path.resolve('themes/akari/source/css/tailwind.css');

/** Recursively collect files under `dir` matching `exts`. */
function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

/** Undo the CSS identifier escaping Tailwind emits (`.lg\:col-span-2`). */
const unescapeClass = (name) => name.replace(/\\(.)/g, '$1');

/**
 * Blank out the inside of url(...). An arbitrary-value utility can embed a data
 * URI that itself contains spaces, which would otherwise be torn into bogus
 * fragments by whitespace splitting. Applied to both the CSS and the HTML side
 * so the two are compared in the same normalised form.
 */
const maskUrl = (s) => s.replace(/url\((?:[^()]|\([^()]*\))*\)/g, 'url(MASKED)');

/** Collect every class name that appears as a selector in the stylesheet. */
function classesInStylesheet(cssText) {
  const found = new Set();
  postcss.parse(cssText).walkRules((rule) => {
    // Only class selectors; ignoring `.foo` inside :not(...) etc. is unnecessary
    // because we only ever ask "does this class have any rule at all".
    rule.selector
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.includes('.'))
      .forEach((selector) => {
        for (const m of selector.matchAll(/\.((?:\\.|[\w-])+)/g)) {
          found.add(maskUrl(unescapeClass(m[1])));
        }
      });
  });
  return found;
}

/** Collect every class name referenced by a class attribute in an HTML file. */
function classesInHtml(html) {
  const found = new Set();
  for (const m of html.matchAll(/class\s*=\s*"([^"]*)"/g)) {
    for (const token of maskUrl(m[1]).split(/\s+/)) {
      if (token) found.add(token);
    }
  }
  return found;
}

if (!fs.existsSync(CSS_FILE)) {
  console.error(`Missing ${path.relative(process.cwd(), CSS_FILE)} — run: npm run build:css`);
  process.exit(2);
}
if (!fs.existsSync(PUBLIC_DIR)) {
  console.error(`Missing ${path.relative(process.cwd(), PUBLIC_DIR)} — run: npx hexo generate`);
  process.exit(2);
}

const available = classesInStylesheet(fs.readFileSync(CSS_FILE, 'utf8'));

const used = new Set();
const htmlFiles = walk(PUBLIC_DIR, ['.html']);
for (const file of htmlFiles) {
  for (const cls of classesInHtml(fs.readFileSync(file, 'utf8'))) used.add(cls);
}

/**
 * Utilities that were ALREADY inert before this build existed, so their absence
 * from the stylesheet is not a regression — verified against the pre-refactor
 * output. Keeping them listed (rather than silently ignoring the class of
 * problem) means the guard can be a hard CI gate instead of something everyone
 * learns to ignore.
 *
 * Remove an entry when the underlying markup is cleaned up.
 */
const KNOWN_PREEXISTING_NOOPS = new Set([
  // page.ejs:47 — the class embeds literal \' escapes and spaces inside a
  // double-quoted attribute, so Tailwind's candidate extractor splits it and
  // emits zero rules. This decorative SVG pattern has never rendered, under the
  // CDN either. Replace with a real class in style.css.
  'bg-[url(MASKED)]',

  // post.ejs:139 / page.ejs:53 — @tailwindcss/typography was never in any
  // layout's `plugins`, and cdn.tailwindcss.com does not bundle it. `.prose`
  // styling comes from hand-written CSS. Vestigial; drop from the markup.
  'dark:prose-invert',
]);

// Utility-shaped names: contain a Tailwind separator (":" or "/") or an
// arbitrary-value bracket. These can only have come from Tailwind, so a miss
// is always a purge bug. Bare names may legitimately belong to hand-written CSS.
const isUtilityShaped = (c) => /[:/]/.test(c) || c.includes('[');

const missing = [...used].filter((c) => !available.has(c));
const purged = missing.filter((c) => isUtilityShaped(c) && !KNOWN_PREEXISTING_NOOPS.has(c)).sort();
const knownNoops = missing.filter((c) => KNOWN_PREEXISTING_NOOPS.has(c)).sort();
const customCss = missing.filter((c) => !isUtilityShaped(c) && !KNOWN_PREEXISTING_NOOPS.has(c)).sort();

console.log(`Scanned ${htmlFiles.length} HTML files, ${used.size} distinct classes.`);
console.log(`Stylesheet defines ${available.size} class selectors.`);
console.log('');

if (customCss.length) {
  console.log(`Not in Tailwind (${customCss.length}) — expected to be hand-written CSS:`);
  console.log('  ' + customCss.join(', '));
  console.log('');
}

if (knownNoops.length) {
  console.log(`Known pre-existing no-ops (${knownNoops.length}) — inert before this build too:`);
  console.log('  ' + knownNoops.join(', '));
  console.log('');
}

if (purged.length) {
  console.error(`PURGED (${purged.length}) — these are Tailwind utilities with no rule:`);
  console.error('  ' + purged.join('\n  '));
  console.error('');
  console.error('Fix by adding the owning file/dir to `content` in tailwind.config.js.');
  process.exit(1);
}

console.log('OK — no Tailwind utility used in the HTML was purged.');
