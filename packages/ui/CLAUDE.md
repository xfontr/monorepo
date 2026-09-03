# 🤖 @monorepo/ui

See [README.md](./README.md). Use the `ui:new-component` skill when adding a component.

- Source is **`lib/`**, not `src/`. The `exports` map points at `lib/index.ts`.
- A component not re-exported from [`lib/index.ts`](./lib/index.ts) does not exist as far as
  consumers are concerned. It is the step that gets forgotten.
- The `@/` alias is declared twice — [`tsconfig.app.json`](./tsconfig.app.json) for the editor and
  [`vite.config.ts`](./vite.config.ts) for the bundler. An import that resolves in one and not the
  other means those two have drifted.
- The boundary rule (`type:ui`, no store/fetching/translations) is in
  [README.md](./README.md#-boundaries) — this file doesn't restate it.
- `typecheck` is `vue-tsc --build`, so it reads the `tsconfig.*.json` project references rather than
  the root `tsconfig.json`.
- Each component sits next to its `*.spec.ts` and its `*.stories.ts`. Adding one without the other
  two is not finished.
