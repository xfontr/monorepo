# 🤖 @monorepo/developer-portal

See [README.md](./README.md) for what each page reads, the snapshot and the deploy.

- **The markdown is read in place.** [`content.config.ts`](./content.config.ts) points
  `@nuxt/content` at the workspace root. Never copy a doc into this app; a link that breaks here is
  fixed in [`layers/docs/shared/docLinks.ts`](./layers/docs/shared/docLinks.ts), not by rewriting the doc.
- **Every page renders with no `.report/`.** It is gitignored, so "never collected" is a fresh
  clone's state. [`layers/snapshot/server/utils/store.ts`](./layers/snapshot/server/utils/store.ts) returns `null` for a missing
  artifact; keep that rather than throwing.
- **A capability is a Nuxt layer under `layers/`**, and `app/` is only the shell. The
  [README](./README.md#-layers) has the table: `design`, `snapshot`, `docs` and `github` are the
  cores, and a feature uses those and the shell's parts, never another feature. A new page joins
  the layer whose task it serves; a new layer needs its own logic, its own config, or to be
  something you'd switch off whole, plus a `nuxt.config.ts` or Nuxt won't register it.
- **A layer's `shared/` is pure and imported by `app/`, `server/` and `tools/` alike.** Anything
  node-only — `yaml`, `node:fs`, `git` — lives in `tools/` or a layer's `server/`, so it never
  reaches the browser bundle. `tools/` may import a `server/utils/` file that uses no Nitro
  auto-import, as it does `workflowFiles.ts`; the reverse is a lint error. Never add a root
  `shared/`: a relative import into it breaks the prerendered build.
- **No value is chosen outside the `design` layer.** The [README](./README.md#-design-system) lists
  the tokens and classes; a new size or colour is a token there, not a bracketed class.
- **`tools/lib/invariants.ts` mirrors [`check-invariants.sh`](../../.claude/hooks/check-invariants.sh).**
  Changing a rule in one means changing the other, and
  [`invariants.spec.ts`](./tools/lib/invariants.spec.ts) is what keeps the two honest.
- **`build` delegates to `build-static`.** CI builds the prerendered artifact that deploys; don't
  point `build` back at the SSR build, which verifies a mode nothing runs.
- Tagged `type:app`. It depends on `@monorepo/configs` only today, and nothing may depend on it.
