/**
 * Akari — PostCSS pipeline for the compiled stylesheet.
 *
 * postcss-cli is used rather than the bare `tailwindcss` CLI so that:
 *   1. autoprefixer runs — the v3 CLI does not, and `backdrop-blur-md` in the
 *      sticky header needs `-webkit-backdrop-filter` on older Android WebViews;
 *   2. postcss-import can inline tokens.css, keeping this to one HTTP request;
 *   3. cssnano minifies under `--env production`.
 *
 * `npm run build:css` passes `--env production`, which is what sets
 * NODE_ENV here. That is scoped to this process only and has nothing to do
 * with `npm ci` — do not set NODE_ENV in CI, it would make npm skip
 * devDependencies and these plugins would be missing.
 */

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: [
    require('postcss-import')(),
    require('tailwindcss')(),
    require('autoprefixer')(),
    ...(isProduction ? [require('cssnano')({ preset: 'default' })] : []),
  ],
};
