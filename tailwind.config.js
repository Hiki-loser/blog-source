/**
 * Akari — Tailwind configuration
 *
 * This replaces `https://cdn.tailwindcss.com` plus the inline
 * `tailwind.config = {...}` object that used to be copy-pasted into all six
 * layout files. It is a deliberate, line-for-line transcription of that
 * object (the full version that lived in index.ejs:25-62), so that moving to a
 * compiled stylesheet is not also a visual change.
 *
 * Colours resolve to `rgb(var(--color-*) / <alpha-value>)` rather than to hex.
 * The values themselves live in themes/akari/assets/tokens.css, which is the
 * only place in the theme where a colour literal is written down. The payoff:
 * `bg-primary-500`, `shadow-primary-500/25` and `var(--color-primary-500)` are
 * the same value by construction, so the two styling systems in this theme
 * (Tailwind utilities and hand-written CSS) can no longer disagree.
 *
 * NOTE ON VERSIONS: this is Tailwind v3 on purpose. The `tailwindcss` package
 * tag `latest` is now v4, which drops `darkMode: 'class'`, moves the default
 * palette to OKLCH, and renames a long list of utilities (`shadow-sm`,
 * `bg-gradient-to-*`, …). None of that is wanted here — migrating the build
 * and re-theming the site at the same time would be unreviewable. `npx
 * tailwindcss` with no local install therefore resolves to v4 and silently
 * emits a broken/empty stylesheet; always go through `npm run build:css`.
 */

/** `rgb(var(--color-primary-500) / <alpha-value>)` — hex-free colour reference. */
const channel = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** Build a Tailwind colour ramp object from a list of stops. */
const ramp = (name, stops) =>
  Object.fromEntries(stops.map((stop) => [stop, channel(`${name}-${stop}`)]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',

  // Every place a class name can appear. The theme layouts are the bulk of it;
  // `source/**` is included so Tailwind classes written inside a Markdown post
  // body are not purged. There is no dynamic class construction anywhere
  // (verified: no `class="..."` containing `<%` in the theme layouts, and
  // quiz.js uses its own private `quiz-*` names styled by quiz.css), so no
  // safelist is needed.
  content: [
    './themes/akari/layout/**/*.ejs',
    './themes/akari/scripts/**/*.js',
    './source/**/*.{md,html,ejs,njk,js}',
    './source/_data/**/*.yml',
  ],

  theme: {
    // `extend`, never `theme` — assigning `theme` would drop Tailwind's default
    // palette and every `gray-*` utility in the theme would stop resolving.
    extend: {
      colors: {
        primary: ramp('primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        secondary: ramp('secondary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        accent: ramp('accent', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
      },

      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },

      // Previously defined only in index.ejs, so `animate-fade-in` silently did
      // nothing on /archives/, /tags/ and category pages. Now global.
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },

      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },

  // Intentionally empty: `.prose` is hand-authored in style.css, so
  // @tailwindcss/typography would fight it.
  plugins: [],
};
