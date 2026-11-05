---
name: configs-new-rule
description: Add or change a lint rule in @monorepo/configs — one `lib/` file per concern composed by `node.ts`/`vue.ts`, an in-house `monorepo/*` rule with its RuleTester spec when it needs code or AST selectors, a message worded as the fix, and the README rows. Use when adding, changing, scoping or removing any ESLint rule or preset, or when a review finding should become a lint rule.
---

# Adding a lint rule

[`lib/README.md`](../../../packages/configs/src/eslint/lib/README.md) says what earns a file and
maps every file to its concern. This file covers what that map can't enforce.
[`requireRouteMeta.ts`](../../../packages/configs/src/eslint/rules/requireRouteMeta.ts), its spec
and [`lib/routeMeta.ts`](../../../packages/configs/src/eslint/lib/routeMeta.ts) are the smallest
complete in-house rule.

## Pick the place

1. **A plugin preset taken as shipped** is a const in `lib/index.ts`, no file of its own.
2. **A rule entry with a glob or options** gets its own `lib/<concern>.ts`, added to `shared` in
   [`lib/index.ts`](../../../packages/configs/src/eslint/lib/index.ts). A config that names
   `**/*.vue` goes in `vueOnly` instead, as an `xVue` export beside `x`, because a `.vue` glob in
   the node factory makes ESLint parse `.vue` files without the Vue parser.
3. **A rule for one flavour** goes inline in that factory, not in `lib/`.
4. **Code or an AST selector** makes it an in-house rule:
   - Write `rules/<camelName>.ts` and register it as `<kebab-name>` in `rules/index.ts`.
   - Switch it on from its `lib/` file as `monorepo/<kebab-name>`, with `plugins: { monorepo }`
     imported from `../rules/index.ts`.
   - A list of selectors uses `selectorRule()`, one `messageId` per selector.
5. **Only some projects want it** makes it an opt-in export, like `routeMeta` or `tailwind`, which a
   project appends after its factory. Ask the user first: it splits how projects lint.

## The three things that go wrong

1. **A second plugin object.** `plugins: { monorepo: { rules: { … } } }` anywhere but
   `rules/index.ts` crashes ESLint on any file both objects reach.
2. **A second config setting a core rule with options.** `no-restricted-imports` and
   `no-restricted-syntax` replace each other's options on a file both configs reach instead of
   merging. Keep the globs disjoint and pin it in `index.spec.ts`, or make it a `monorepo/*` rule.
3. **A message that describes instead of instructing.** Write the code to type instead: "Move this
   call into a `computed`", "Name a lookup table in UPPER_SNAKE_CASE". An agent acts on the message
   text and on nothing else.

## Test it

- An in-house rule gets `<name>.spec.ts` beside it, using ESLint's `RuleTester`. Assign Vitest's
  `describe`, `it` and `it.only` to `RuleTester.describe`, `RuleTester.it` and `RuleTester.itOnly`,
  as every spec there does, because globals are off. Cover each `messageId`, at least one valid
  case per exemption, and pass `vue-eslint-parser` for `.vue` input.
- A scoping change gets a case in
  [`index.spec.ts`](../../../packages/configs/src/eslint/index.spec.ts). It resolves the config for a
  path with `calculateConfigForFile` and never parses, so the type-checked flavours work there too.

## Finish

- Add a row to `lib/README.md` and a bullet to the package README's factory list. Say what the rule
  enforces and why, not the selector.
- Run `pnpm check` with a long timeout and fix what the rule finds across the workspace. A configs
  change makes every project affected.
