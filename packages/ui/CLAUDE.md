# 🤖 @monorepo/ui

See [README.md](./README.md). Use the `ui:new-component` skill when adding a component.

- Source is **`lib/`**, not `src/`. The `exports` map points at `lib/index.ts`.
- A component not re-exported from [`lib/index.ts`](./lib/index.ts) does not exist as far as
  consumers are concerned. It is the step that gets forgotten.
- The `@/` alias is declared twice — [`tsconfig.app.json`](./tsconfig.app.json) for the editor and
  [`vite.config.ts`](./vite.config.ts) for the bundler. An import that resolves in one and not the
  other means those two have drifted.
- Tagged `type:ui`: it may depend only on other `type:ui` projects and `@monorepo/configs`. No store,
  no data fetching, no translations. A component takes its strings and its data as props; anything
  else belongs in an app layer.
- `typecheck` is `vue-tsc --build`, so it reads the `tsconfig.*.json` project references rather than
  the root `tsconfig.json`.
- Each component sits next to its `*.spec.ts` and its `*.stories.ts`. Adding one without the other
  two is not finished.
