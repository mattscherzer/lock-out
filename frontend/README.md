# Lock Out frontend

TypeScript (strict), React, Vite, Tailwind and Leaflet. Needs Node 22.13+ (22.x, 24 or 26+; not 23 or 25).

```bash
npm run dev        # dev server
npm run typecheck  # tsc, no emit
npm test           # token script tests (node --test) and Vitest (jsdom)
npm run build      # typecheck, tokens.css drift check, production build
```

## Layout

- `src/main.tsx` only loads the data and mounts `App`; a render error ends in `LoadError` through the error boundary.
- `src/app/`: `App` composes the features and holds the selection state (`selection.ts`).
- `src/map/`: the Leaflet map, legend and palette. `AreaMap.tsx` is the only module that drives Leaflet.
- `src/search/`: place search; `src/answer/`: the area card; `src/advice/`: lock advice; `src/controls/`: the map buttons.
- `src/domain/`: the lookup contract types and `kind`. `src/data/`: fetching, the file shapes and the check of the files against each other.
- Dependencies: features depend on `domain/` and `data/`, never on each other or on `app/`; `data/` and `domain/` depend on no feature.
- `src/boundaries.test.ts` enforces that rule, and bans value imports of `leaflet` outside `src/map/` (runs with `npm test`).
- Shared test fixtures live in `src/domain/testData.ts`, so `domain/` tests do not import a feature.
- Pure logic lives in `places.ts`, `advice.ts`, `selection.ts`, `sheetStops.ts` and `mapStyle.ts`, with its test beside it.
- `src/strings.ts`: all UI copy. `src/styles/`: tokens and base styles; `tokens.css` is generated, run `npm run tokens`.
- `scripts/`: Node scripts in TypeScript, run with `--experimental-strip-types`. Type annotations only: no enums or namespaces, and imports carry the `.ts` extension.

## Styling

Colours, radii, spacing sizes, shadows, z-index, durations and fonts are tokens from `docs/design-system/tokens.json`. Utilities and plain CSS both read them, so never write a hex colour or a value that has a token.

**Use utilities** for static layout, spacing, colour, sizing and type: `gap-6`, `size-tap-target`, `bg-surface-container`, `rounded-lg`, `body-md`. Type styles (`headline-sm`, `title-md`, `body-lg`, `data-md` and so on) are generated `@utility` classes, so variants work (`min-[900px]:headline-md`).

**Use CSS** (next to the component, `Name.css`) for what a class string cannot say well:
- state selectors that combine several attributes (`[data-open]`, `[data-stop]`, `:focus-within`) and the transforms and transitions they drive;
- media queries, values set from JS (`--vv-top`), and descendant resets;
- selectors for markup you do not own (Leaflet).

**Rules that have bitten us**
- Component CSS and `tokens.css` are unlayered, so they beat every utility (only the Leaflet attribution rule is in `@layer components`). When you move a property to a class, delete the CSS rule for it, and check descendant selectors (`.area-search button`) too. `focus-visible:shadow-*` loses to the global `:focus-visible` ring for the same reason.
- Before you remove a class from markup, grep for every selector and test that uses it. A class that only CSS or a test targets stays as a hook (`area-search-parent`). jsdom does not load CSS, so tests will not catch a dropped rule.
- Tailwind only generates classes it finds as whole strings. Write each variant out in full (`child ? CHILD : OPTION`); never build a class with a template or concatenation that depends on state.
- Preflight is not loaded, so `p`, `h2`, `ul` and `button` keep their browser margins and padding: add `m-0` and the like.
- Off-scale values (`py-[10px]`) work as arbitrary values, but each one is a token that is missing. Keep them rare and comment them.

**Add a token:** edit `docs/design-system/tokens.json`, run `npm run tokens`, commit the regenerated `src/styles/tokens.css`. A colour, radius, shadow, size, z-index or timing token gets its utility from the `@theme` mapping the generator writes; type styles become `@utility` classes.

`npm run format` and `format:check` (Prettier, with `prettier-plugin-tailwindcss` ordering the classes) cover `src/**/*.{ts,tsx,css}`; `npm run lint:css` (Stylelint) bans raw values that have a token, in CSS only. Class strings are not linted.
