# Design system: LockOut Plum

`tokens.json` is the single source of truth for colours (light and dark), the risk ramp, shadows, borders, radius, spacing, sizes, z-index, timing and the type scale. The brand book (content, visual foundations, elevation, motion, accessibility) lives in the design-system artifact; this file only describes the tokens in the repo.

## Where it comes from

Exported from the "LockOut Plum" design-system artifact (`project/tokens.json`, version 1). The repo copy is what the app builds from, so the app does not depend on the artifact.

## How to update

1. Edit `docs/design-system/tokens.json`, or paste a new export over it.
2. Run `npm run tokens` in `frontend/`. This rewrites `frontend/src/styles/tokens.css`.
3. Commit both files. `npm run build` and `npm test` fail if they drift apart.

`tokens.css` is generated: do not edit it by hand.
