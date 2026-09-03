# 🤖 @monorepo/configs

See [README.md](./README.md) for what the factories bundle.

**Every edit here lands in every project at once.** That is the point of the package and also the
risk, so `lint` and `typecheck` declare `^production` in their
[`targetDefaults`](../../nx.json) — a rule change here enters every consumer's hash, and the
affected set that `pnpm lint` and CI run is already the whole workspace. Don't remove those
`inputs` and go back to telling people to run `run-many` by hand.

- A rule for everyone goes in [`src/eslint/lib`](./src/eslint/lib). A rule for one flavour goes in
  the factory that composes it (`node.ts`, `vue.ts`, or the nuxt config). Putting a flavour rule in
  `lib` is the mistake that's hard to undo later.
- This package's own `eslint.config.ts` and `tsconfig.json` reference `./src/...` **relatively**, not
  through `@monorepo/configs`. That is deliberate — a self-reference would be a dependency cycle.
- [`lib/boundaries.ts`](./src/eslint/lib/boundaries.ts) is the enforced copy of the Nx tag table. The
  readable copy is in the [root README](../../README.md#-architecture--boundaries). Change both.
- Shipped as raw TypeScript and tagged `type:config`, so it may depend on nothing in the workspace.
  Nothing here may import another `@monorepo/*` package.
- The nuxt ESLint config is deliberately **not** type-checked — Nuxt's generated files make a
  type-aware pass more trouble than it's worth. Don't "fix" that by turning it on.
