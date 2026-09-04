# 🤖 @monorepo/scripts

See [README.md](./README.md) for the layout rule and the per-script docs it links to.

- **This is a service, not a library.** Nothing in the workspace imports it — scripts are run as
  CLIs, which is also why it's `infrastructure/` rather than `packages/`, same reasoning as
  [`translations`](../translations/CLAUDE.md).
- `private: true` and outside `nx release`'s `packages/*`, so it has **no `CHANGELOG.md` and no
  version to bump**.
- **One folder per script under `src/`, each with a three-line `index.ts` that calls `run` from
  [`shared/cli.ts`](./src/shared/cli.ts), a `main.ts`, and a `README.md`.** Don't add loose files at
  the top of `src/`, and don't add a shared helper folder for a single caller. A folder may expose
  subcommands (`issue/` does: `add`, `pick`) when they share real code — `index.ts` passes a record
  and `run` dispatches. Otherwise it's two folders.
- **Four layers: entry → command → adapter → domain, one way only, never sideways between script
  folders.** The table is in the [README](./README.md#-the-four-layers) and the reasoning is in
  [`0048`](../../docs/spikes/0048-scripts-architecture.md). Two rules get got wrong: an **adapter is
  named after the boundary it wraps**, so `git.ts` living in three folders at once is correct rather
  than duplication; and a **domain file is pure**, so a threshold or a parser never reaches for
  `node:fs`. There is no `helpers/`, no `types/` and no `constants.ts` here — 0048 says why each was
  rejected, so don't re-add one.
- **No side effects at module scope.** No `run()`, `git()` or `readFileSync` at the top level of a
  file, and read `process.argv`/`process.env` inside a command (or via `flag()`), never into a
  module-level const. Both rules exist because breaking them made two modules unimportable outside a
  git checkout and forced a `vi.resetModules()` into a spec.
- **Never call `process.exit`.** Throw `ExpectedError` for a failure whose message is the whole
  answer, `CancelledError` for a cancelled prompt, and let `run` decide the code — it sets
  `process.exitCode`, because exiting right after a write to a pipe can truncate it.
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
