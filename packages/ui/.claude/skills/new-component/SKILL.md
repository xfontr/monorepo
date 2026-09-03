---
name: new-component
description: Add a component to @monorepo/ui — the .vue file, its spec, its story, and the lib/index.ts re-export. Use when adding or removing a shared Vue component in packages/ui.
---

# Adding a UI component

Four files, one of which is easy to forget and is the one that decides whether the component exists.

## The files

```
lib/components/<Name>.vue          the component
lib/components/<Name>.spec.ts      vitest + @vue/test-utils, happy-dom
lib/components/<Name>.stories.ts   Storybook
lib/index.ts                       the re-export ← without this, consumers cannot see it
```

Copy the shape from `Button.*` in [`lib/components`](../../../lib/components) — all three files are
short and current.

`lib/index.ts` imports the `.vue` file and re-exports it by name:

```ts
import Button from "./components/Button.vue";
import Card from "./components/Card.vue";

export { Button, Card };
```

## Conventions

- Source lives in **`lib/`**, not `src/`. The `@/` alias points at `lib/` and is declared twice —
  [`tsconfig.app.json`](../../../tsconfig.app.json) for the editor and
  [`vite.config.ts`](../../../vite.config.ts) for the bundler. If an import resolves in one and not
  the other, that pair is why.
- `<script lang="ts" setup>` first, then `<template>`. 4-space indent, double quotes.
- Props and emits are typed; no `defineProps` without a type argument.
- The story is `Meta<typeof X>` + a `Default: Story`, default-exporting the meta.

## What must not go in here

The boundary rule is in [README.md](../../../README.md#-boundaries) (`type:ui`, enforced by
`@nx/enforce-module-boundaries`) — this skill doesn't restate it. If a component "needs" a store, a
fetch, or a translation, the prop it should have taken is the thing to find instead.

## Verify

```sh
pnpm exec nx run-many -t lint typecheck test --projects @monorepo/ui
pnpm --filter @monorepo/ui storybook      # port 6006, the fastest way to see it
```

There is no build step — the consuming app compiles the raw `.vue` source, so nothing needs
rebuilding while you work.
