# 🤖 Working in this repo

Architecture, boundaries, commands and release rules live in [README.md](./README.md), and every
project has its own README — read those first. This file only holds what they don't say, or what
gets got wrong anyway. It is enforced where it can be: [`.claude/settings.json`](./.claude/settings.json)
denies what the prose below forbids, and two `PostToolUse` hooks run `eslint --fix` and check the
invariants that span more than one file.

## ✍️ Style

- 4-space indent, double quotes, semicolons. `@stylistic` enforces it via `@monorepo/configs`, so
  `pnpm exec eslint --fix` settles any argument.
- `package.json` files are 2-space because pnpm rewrites them that way. Leave them alone.
- **Comments state the why, never the what.** A comment that restates the line below it gets
  deleted. The comments already in `core/` are the model: they explain a constraint you would
  otherwise break.
- Same rule for docs. When writing or editing markdown, follow the `house-docs` skill.

## 🚫 Things that look reasonable and are wrong here

- **Never add a build step to a package.** `packages/*` export raw TypeScript/Vue source; consumers
  compile them. No `build` script, no `dist/`, no `tsup`/`unbuild`, no `main`/`types` fields — the
  `exports` map points straight at source.
- **Never add a lifecycle script** (`postinstall`, `prepare`, `prepublish`). Both CI workflows
  install with `--ignore-scripts`, so anything hung off one works locally and silently does nothing
  in CI. There are none in the workspace today; keep it that way.
- **Never hand-edit a `CHANGELOG.md` or a `version`.** `nx release` derives both from Conventional
  Commit messages. Releases run from the **Release** workflow (`workflow_dispatch`), never locally.
- **Never write a real endpoint, URL, token or instance ID into the repo.** Every one of them is an
  env var with no default; `.env.example` documents the names and nothing else. "It's a public URL"
  is not a reason — vendor endpoints stay out.
- **Don't reach for a validation or utility library** in a package whose dependency list is one or
  two entries. Both `content` and `i18n` argue this out in their READMEs; the bar is high.

## 📦 Dependencies

- Internal: `"@monorepo/x": "workspace:*"`. Every project also has `@monorepo/configs` in
  `devDependencies`.
- Shared third-party (nuxt, vue, vite, typescript, vitest, eslint, node types, hono): `"catalog:"`,
  pinned once in `pnpm-workspace.yaml`. Adding or bumping a catalog entry is an Nx `sharedGlobals`
  input — it invalidates every project's cache, which is intended but worth knowing before you
  bump something to fix one package.
- Everything else: a version range in the package that needs it.

## ⌨️ Commands

`pnpm lint | typecheck | test | build` at the root run against **affected** projects only — what
changed since `master`, same as CI and the pre-push hook.

| Need | Command |
| --- | --- |
| The whole workspace | `pnpm exec nx run-many -t <target>` |
| One project | `pnpm exec nx <target> @monorepo/<name>` |
| What targets a project has | `pnpm exec nx show project @monorepo/<name>` |
| Why something rebuilt | `pnpm graph` |

Branches must match `^(hotfix|fix|feature|release)/.+` and `master` is not pushable, so start any
work on a branch. `pnpm issue:pick` is the shortest way to one — pick an open issue off a project
board and it creates `<type>/<issue number>-<slug>`, which is the naming the number-first branches
here come from. Commits are [Conventional Commits](https://www.conventionalcommits.org) —
commitlint rejects anything else, and the type decides the next version. Two rules beyond the
convention, both in [`commitlint.config.mjs`](./commitlint.config.mjs) and neither obvious from a
rejection message: the **type is lower-case** and the **subject is sentence case**, so
`feat: Add the thing` passes and `feat: add the thing` does not.

The pre-push hook runs lint, test and typecheck on affected projects. CI runs those **plus `build`**,
so a green push is not yet a green pipeline — `apps/external` typechecks on build, which is where
most of that difference shows up. Note also that `husky` has no `prepare` script to install itself,
because lifecycle scripts are banned here; a fresh clone gets no hooks until `core.hooksPath` is
pointed at `.husky`.

## 🔗 The two places that must agree

The Nx tag table is written twice: the enforced copy in
[`boundaries.ts`](./packages/configs/src/eslint/lib/boundaries.ts) and the readable copy in the
[root README](./README.md#-architecture--boundaries). Changing one without the other is the
standing failure mode in this repo. Same for the workspace-layout block in the root README when a
project is added, and for a new file under [`docs/reviews/`](./docs/reviews/README.md) and the
history table in that directory's README.

## 🛠️ Skills

| Skill | Use it when |
| --- | --- |
| `new-package` | Adding a project under `packages/`, `apps/` or `infrastructure/` |
| `nuxt-module-route` | Adding a BFF route or composable to a package's `src/nuxt/runtime` |
| `writing-tests` | Adding or changing any `*.spec.ts` |
| `house-docs` | Writing or editing any markdown |
| `github-issue` | Filing an issue *for* the user — the three templates. They file their own with `pnpm issue:add`, which is deliberately template-free |
| `decision-record` | A spike issue is resolved and the outcome needs to outlive the issue |
| `repo-review` | Rating, scoring or auditing the repo as a whole — the seven cards in [`docs/reviews/SCORECARDS.md`](./docs/reviews/SCORECARDS.md), not the current diff |
| `content:new-vendor` | Adding a CMS vendor to `@monorepo/content` |
| `i18n:new-vendor` | Adding a TMS vendor to `@monorepo/i18n` |
| `ui:new-component` | Adding a component to `@monorepo/ui` |
