# 🤖 @monorepo/scripts

See [README.md](./README.md) for the layout rule and the per-script docs it links to.

- **This is a service, not a library.** Nothing in the workspace imports it — scripts are run as
  CLIs, which is also why it's `infrastructure/` rather than `packages/`, same reasoning as
  [`translations`](../translations/CLAUDE.md).
- `private: true` and outside `nx release`'s `packages/*`, so it has **no `CHANGELOG.md` and no
  version to bump**.
- **One folder per script under `src/`, each with an `index.ts` and a `README.md`.** Don't add loose
  files at the top of `src/`, and don't add a shared helper folder for a single caller. A folder may
  expose subcommands off `argv[2]` (`issue/` does: `add`, `pick`) when they share real code —
  otherwise it's two folders.
- Entry points run straight with `node`, no build step and no `tsx`/`ts-node` — this repo's Node
  engines range already supports type-stripping. Internal imports use the explicit `.ts` extension,
  same as `translations`; Node's stripping does no resolution rewriting.
- **Keep these small.** They're personal tooling for a personal monorepo. Prompts and `gh` calls,
  not layered abstractions — the previous version of `addIssue` had three templates, a label
  mapping and four spec files, and got avoided because of it.
- `test` runs with `--passWithNoTests` because most of this is prompts and subprocess calls.
  Extract and test any real logic a script grows (a parser, a diff, a mapping) — `issue/branch.ts`
  is the one that exists; don't write specs that assert a mock of `gh` against itself.
- Tagged `type:tooling`, so it may depend only on `@monorepo/configs`. Nothing else may depend on
  `type:tooling` — it's a leaf nothing imports, enforced the same way `type:infra` is.
- The TODO/FIXME push gate is **not** here any more. It's a few lines of `awk` in
  [`.husky/pre-push`](../../.husky/pre-push), which only points at `pnpm issue:add` in its error
  message.
