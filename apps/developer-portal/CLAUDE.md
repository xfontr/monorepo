# 🤖 @monorepo/developer-portal

See [README.md](./README.md) for what each page reads, the snapshot and the deploy.

- **The markdown is read in place.** [`content.config.ts`](./content.config.ts) points
  `@nuxt/content` at the workspace root. Never copy a doc into this app; a link that breaks here is
  fixed in [`shared/docLinks.ts`](./shared/docLinks.ts), not by rewriting the doc.
- **Every page renders with no `.report/`.** It is gitignored, so "never collected" is a fresh
  clone's state. [`server/utils/store.ts`](./server/utils/store.ts) returns `null` for a missing
  artifact; keep that rather than throwing.
- **`shared/` is pure and imported by `app/`, `server/` and `tools/` alike.** Anything node-only —
  `yaml`, `node:fs`, `git` — lives in `tools/`, so it never reaches the browser bundle.
- **`tools/lib/invariants.ts` mirrors [`check-invariants.sh`](../../.claude/hooks/check-invariants.sh).**
  Changing a rule in one means changing the other, and
  [`invariants.spec.ts`](./tools/lib/invariants.spec.ts) is what keeps the two honest.
- **`build` delegates to `build-static`.** CI builds the prerendered artifact that deploys; don't
  point `build` back at the SSR build, which verifies a mode nothing runs.
- Tagged `type:app`. It depends on `@monorepo/configs` only today, and nothing may depend on it.
