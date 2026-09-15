#!/usr/bin/env node
/**
 * Guard: no two tags (or categories) may differ only by letter case.
 *
 * Why this matters more than it sounds. Hexo derives each term's output
 * directory from its name, so `Java` and `java` produce `tags/Java/` and
 * `tags/java/`. On a case-insensitive filesystem — Windows and macOS, i.e. most
 * contributors — those are THE SAME DIRECTORY, so whichever is written last
 * wins and the other silently disappears.
 *
 * The visible symptoms, both observed in this repository:
 *   - `hexo clean && hexo generate` is not reproducible: the output alternates
 *     between two states depending on directory-write order, which breaks any
 *     build-diffing or "is the output current" check.
 *   - On the deployed (case-sensitive Linux) site the split is real instead:
 *     two near-duplicate tag pages, each holding a subset of the posts.
 *
 * This has already happened twice here (`agent`/`Agent`, then `java`/`Java`),
 * which is why it is a script rather than a note in a code review.
 *
 * Exits non-zero on any collision.
 *
 * Usage: node tools/verify-taxonomy.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.resolve(
  process.argv[2] || 'source/_posts'
);

/** Collect every .md file under a directory. */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/**
 * Parse just enough YAML front-matter to read `tags` and `categories`.
 * Deliberately not a full YAML parse: it only needs to find the term strings,
 * and pulling in a parser here would make the guard depend on the thing it is
 * meant to be checking.
 */
function frontMatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  return match ? match[1] : '';
}

function tagsOf(fm) {
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex((l) => /^tags\s*:/.test(l));
  if (start === -1) return [];

  const inline = lines[start].replace(/^tags\s*:/, '').trim();
  if (inline) {
    return inline
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break; // next top-level key
    const item = /^\s*-\s*(.+?)\s*$/.exec(line);
    if (item) out.push(item[1].replace(/^['"]|['"]$/g, ''));
  }
  return out;
}

function categoryOf(fm) {
  const m = /^categories\s*:\s*(.+)$/m.exec(fm);
  if (!m) return [];
  const raw = m[1].trim().replace(/^\[|\]$/g, '');
  return raw
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/** Map lowercased term -> Map(actual spelling -> [files]) */
function group(entries) {
  const byLower = new Map();
  for (const { term, file } of entries) {
    const key = term.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, new Map());
    const variants = byLower.get(key);
    if (!variants.has(term)) variants.set(term, []);
    variants.get(term).push(file);
  }
  return byLower;
}

function report(label, byLower) {
  let collisions = 0;
  for (const [, variants] of byLower) {
    if (variants.size < 2) continue;
    collisions++;
    console.error(`  COLLISION in ${label}: ${[...variants.keys()].join('  vs  ')}`);
    for (const [spelling, files] of variants) {
      console.error(`      ${spelling.padEnd(16)} <- ${files.join(', ')}`);
    }
  }
  return collisions;
}

if (!fs.existsSync(POSTS_DIR)) {
  console.error(`Missing ${path.relative(process.cwd(), POSTS_DIR)}`);
  process.exit(2);
}

const files = walk(POSTS_DIR);
const tagEntries = [];
const categoryEntries = [];

for (const file of files) {
  const rel = path.relative(POSTS_DIR, file).split(path.sep).join('/');
  const fm = frontMatter(fs.readFileSync(file, 'utf8'));
  for (const term of tagsOf(fm)) tagEntries.push({ term, file: rel });
  for (const term of categoryOf(fm)) categoryEntries.push({ term, file: rel });
}

const tagCollisions = report('tags', group(tagEntries));
const categoryCollisions = report('categories', group(categoryEntries));

const total = tagCollisions + categoryCollisions;

if (total > 0) {
  console.error('');
  console.error(`${total} case-insensitive collision(s).`);
  console.error('Normalise the spellings so each term has exactly one form.');
  console.error('On Windows/macOS these collide on disk and make builds non-reproducible;');
  console.error('on the deployed Linux site they become two near-duplicate pages.');
  process.exit(1);
}

console.log(`OK — ${tagEntries.length} tag and ${categoryEntries.length} category references, no case collisions.`);
