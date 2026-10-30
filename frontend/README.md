# Lock Out frontend

TypeScript (strict), React, Vite, Tailwind and Leaflet. Needs Node 22.13+ (22.x, 24 or 26+; not 23 or 25).

```bash
npm run dev        # dev server
npm run typecheck  # tsc, no emit
npm test           # token script tests (node --test) and Vitest (jsdom)
npm run build      # typecheck, tokens.css drift check, production build
```

## Layout

- `src/components/`: React components (`Name.tsx`) with their test next to them (`Name.test.tsx`). Hooks go in `src/hooks/`.
- `src/search/`: place search logic. Pure functions in `places.ts`; the React search field and dropdown are `AreaSearch.tsx` (#87).
- `src/main.tsx`: the Leaflet map stays imperative and mounts the React search component beside it.
- `src/styles/`: tokens and base styles. `tokens.css` is generated, run `npm run tokens`.
- `scripts/`: Node scripts in TypeScript, run with `--experimental-strip-types`. Type annotations only: no enums or namespaces, and imports carry the `.ts` extension.
