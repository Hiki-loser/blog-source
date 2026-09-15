#!/usr/bin/env node
/**
 * Tag untagged Markdown code fences with a language.
 *
 * Around 190 of the ~250 fences in this blog had no language, so highlight.js
 * had nothing to work with and they rendered as flat text. `highlight.auto_detect`
 * is NOT a shortcut worth taking: highlight.js auto-detection is slow and its
 * guesses are frequently wrong on prose-adjacent snippets.
 *
 * So: classify from content, and be explicit about confidence.
 *   HIGH   — a decisive marker was found (e.g. `public class`, `SELECT … FROM`)
 *   LOW    — only weak signals; reported for manual review and left alone
 *   NONE   — no signal; these are prose/diagrams and are tagged `text` so the
 *            intent ("do not highlight this") is recorded rather than left blank.
 *
 * Usage:
 *   node tools/tag-code-fences.js            # dry run, prints a report
 *   node tools/tag-code-fences.js --write    # apply
 */

'use strict';

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.resolve('source/_posts');
const WRITE = process.argv.includes('--write');

const RULES = [
  {
    lang: 'java',
    strong: [/^\s*(public|private|protected)\s+(static\s+)?(class|void|int|String|boolean|final)/m,
             /@Override\b/, /\bSystem\.out\.print/, /^\s*import\s+java\./m, /\bnew\s+\w+<[^>]*>\(/],
    weak: [/;\s*$/, /\{\s*$/, /\bclass\b/, /\bvoid\b/],
  },
  {
    lang: 'sql',
    strong: [/\b(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)\b/i],
    weak: [/\b(FROM|WHERE|GROUP\s+BY|ORDER\s+BY|JOIN|VALUES)\b/i],
  },
  {
    lang: 'python',
    strong: [/^\s*def\s+\w+\s*\(/m, /^\s*import\s+\w+\s*$/m, /^\s*from\s+[\w.]+\s+import\s+/m,
             /^\s*class\s+\w+.*:\s*$/m, /print\(/, /^\s*elif\b/m],
    weak: [/:\s*$/m, /\bself\b/, /^\s*#/m],
  },
  {
    lang: 'bash',
    strong: [/^\s*\$\s+\w/m, /^\s*sudo\b/m, /^\s*(apt|apt-get|npm|npx|pip|yarn|docker|git)\s/m,
             /^#!\/bin\/(ba)?sh/],
    weak: [/^#\s/m, /--\w+/],
  },
  {
    lang: 'json',
    strong: [/^\s*\{\s*$[\s\S]*^\s*"[^"]+"\s*:/m],
    weak: [/^\s*[\{\}\[\],]\s*$/m, /"[^"]+"\s*:/],
  },
  {
    lang: 'yaml',
    strong: [/^\s*[\w.-]+:\s*$/m, /^\s*-\s+[\w.-]+:\s/m],
    weak: [/^\s*[\w.-]+:\s+\S/m, /^\s*-\s+\S/m],
  },
  {
    lang: 'javascript',
    strong: [/=>\s*\{/, /\bconsole\.log\(/, /^\s*(const|let)\s+\w+\s*=/m, /document\.\w+/,
             /\bfunction\s*\(/],
    weak: [/;\s*$/m, /\brequire\(/],
  },
  {
    lang: 'xml',
    strong: [/^\s*<\?xml/, /^\s*<[a-zA-Z][\w:-]*(\s[^>]*)?>\s*$/m],
    weak: [/<\/[a-zA-Z][\w:-]*>/],
  },
];

/** Score a fence body against each rule set. */
function classify(body) {
  const trimmed = body.trim();
  if (!trimmed) return { lang: 'text', confidence: 'NONE' };

  let best = null;

  for (const rule of RULES) {
    let strong = 0;
    let weak = 0;
    for (const re of rule.strong) if (re.test(trimmed)) strong++;
    for (const re of rule.weak) if (re.test(trimmed)) weak++;
    if (!strong && weak < 2) continue;

    // A single decisive marker beats any amount of weak evidence, which is what
    // keeps a Java snippet from being tagged javascript because it has braces.
    const score = strong * 10 + weak;
    if (!best || score > best.score) best = { lang: rule.lang, score, strong, weak };
  }

  if (!best) return { lang: 'text', confidence: 'NONE' };
  return { lang: best.lang, confidence: best.strong >= 1 ? 'HIGH' : 'LOW' };
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/**
 * Walk the file line by line, tracking fence state so that a ``` inside an
 * already-open fence is treated as content, not as a new fence.
 *
 * A fence that already carries a language still OPENS a block. The first version
 * of this tool skipped such lines outright, which left the state machine
 * believing no fence was open — so the block's closing ``` was read as an
 * opening fence and every subsequent block in the file was misaligned by one.
 * On a file mixing tagged and untagged fences (i.e. most of them) that would have
 * rewritten the wrong lines. `assertNoMisalignment` below guards against a
 * recurrence.
 */
function processFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const changes = [];
  const relics = [];

  let open = false;
  let openIndex = -1;
  let openHasLanguage = false;
  let body = [];

  for (let i = 0; i < lines.length; i++) {
    const fence = /^(\s*)```(.*)$/.exec(lines[i]);

    if (!open) {
      if (!fence) continue;
      // Any fence line opens a block, tagged or not.
      open = true;
      openIndex = i;
      openHasLanguage = fence[2].trim() !== '';
      body = [];
      continue;
    }

    // Inside a block, only a bare ``` closes it. A ``` with info here is
    // content — e.g. a markdown block demonstrating how to write a fence.
    if (fence && fence[2].trim() === '') {
      if (!openHasLanguage) {
        const result = classify(body.join('\n'));
        if (result.confidence === 'HIGH') {
          lines[openIndex] = lines[openIndex].replace(/```$/, '```' + result.lang);
          changes.push({ line: openIndex + 1, lang: result.lang });
        } else if (result.confidence === 'LOW') {
          relics.push({ file, line: openIndex + 1, guess: result.lang, preview: body.join('\n').trim().slice(0, 70) });
        } else {
          // No signal. Record the intent explicitly rather than leaving it blank,
          // which would rely on highlight.js auto-detection (disabled here).
          lines[openIndex] = lines[openIndex].replace(/```$/, '```text');
          changes.push({ line: openIndex + 1, lang: 'text' });
        }
      }
      open = false;
      openIndex = -1;
      openHasLanguage = false;
      body = [];
      continue;
    }

    body.push(lines[i]);
  }

  return { lines, changes, relics, unbalanced: open };
}

/**
 * Every file must still have an even number of fence lines, and every tagged line
 * must have been a bare fence before. Together these prove the state machine did
 * not drift.
 */
function assertNoMisalignment(file, before, after, changes) {
  const countFences = (ls) => ls.filter((l) => /^\s*```/.test(l)).length;
  if (countFences(before) !== countFences(after)) {
    throw new Error(`${file}: fence count changed — state machine drifted`);
  }
  changes.forEach(({ line }) => {
    if (!/^\s*```\s*$/.test(before[line - 1])) {
      throw new Error(`${file}:${line}: tried to tag a line that was not a bare fence`);
    }
  });
}

const files = walk(POSTS_DIR);
let totalTagged = 0;
const relics = [];
const perFile = [];

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const { lines, changes, relics: r, unbalanced } = processFile(file);

  if (unbalanced) {
    console.error(`  UNBALANCED fences in ${file} — skipped`);
    continue;
  }

  assertNoMisalignment(file, original, lines, changes);

  if (changes.length) {
    perFile.push({ file: path.relative(POSTS_DIR, file).split(path.sep).join('/'), count: changes.length });
    totalTagged += changes.length;
    if (WRITE) fs.writeFileSync(file, lines.join('\n'));
  }
  r.forEach((x) => relics.push(x));
}

console.log(WRITE ? 'APPLIED\n' : 'DRY RUN (pass --write to apply)\n');
console.log(`Fences tagged: ${totalTagged}`);
perFile.sort((a, b) => b.count - a.count);
perFile.forEach((f) => console.log(`  ${String(f.count).padStart(3)}  ${f.file}`));

console.log(`\nLow-confidence, left untouched for review: ${relics.length}`);
relics.forEach((r) => {
  console.log(`  ${r.file.replace(/^.*?_posts[\\/]/, '')}:${r.line}  guessed=${r.guess}`);
  console.log(`      ${r.preview.replace(/\n/g, ' ⏎ ')}`);
});
