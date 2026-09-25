# 🤖 @monorepo/scripts

See [README.md](./README.md) for the layout rule and the per-script docs it links to. Use the
`scripts-new-script` skill when adding a script.

- **This is CLI tooling, not a library.** Nothing in the workspace imports it — scripts are run as
  CLIs, which is also why it's `infrastructure/` rather than `packages/`, same reasoning as
  [`translations`](../translations/AGENTS.md).
- `private: true` and outside `nx release`'s `packages/*`, so it has **no `CHANGELOG.md` and no
  version to bump**.
- **One folder per script, laid out entry → command → `adapters/` → `domain/`** — the README has the
  layout and [`0004`](../../docs/decisions/0004-scripts-architecture.md) the reasoning. There is no
  `helpers/`, no `types/` and no `constants.ts` here; 0004 says why each was rejected, so don't re-add
  one. (`types/` also can't work: `**/types` is in `baseIgnores`, so ESLint would never see it.)
- **No side effects at module scope.** No `run()`, `git()` or `readFileSync` at the top level of a
  file, and read `process.argv`/`process.env` inside a command (or via `flag()`), never into a
  module-level const. Both rules exist because breaking them made two modules unimportable outside a
  git checkout and forced a `vi.resetModules()` into a spec.
- **Keep these small.** They're personal tooling for a personal monorepo. Prompts and `gh` calls,
  not layered abstractions — the previous version of `addIssue` had three templates, a label
  mapping and four spec files, and got avoided because of it.
- `test` runs with `--passWithNoTests` because most of this is prompts and subprocess calls.
  Extract and test any real logic a script grows (a parser, a diff, a mapping or a formatting
  decision), keeping the spec beside its subject; don't write specs that assert a mock of `gh` against
  itself.
- Tagged `type:tooling`, so it may depend only on `@monorepo/configs`. Nothing else may depend on
  `type:tooling` — it's a leaf nothing imports, enforced the same way `type:infra` is.
- The TODO/FIXME push gate is **not** here any more. It's a few lines of `awk` in
  [`.husky/pre-push`](../../.husky/pre-push), which only points at `pnpm issue:add` in its error
  message.
