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
- **A comment carries one fact that isn't in the code, in one sentence.** See
  [💬 Comments](#-comments).
- Same rule for docs. When writing or editing markdown, follow the `house-docs` skill.

## 💬 Comments

Default to none. **A comment carries one fact that isn't in the code, in one sentence.** The rule is
not "a comment must justify its line" — that one is satisfied by writing a better argument, which is
how `infrastructure/scripts` reached one comment line per four lines of code.
[`0082`](./docs/spikes/0082-comment-discipline.md) has the measurement.

- The keep-test is **whether the next reader can reconstruct it from present state.** History and
  outside constraint can't be: what a scanner flagged, the bug behind a strange sort order, a trap
  in a type, units a type can't express, "do not simplify this", cross-file sync obligations.
- Never restate the code, the names, or the signature. No `// loop over users`, no `// end if`. A
  human reads the line faster than the comment, and so does an agent.
- Never argue. A comment informs the next reader; it does not persuade a critic that the decision
  was right. That belongs in the PR or in a spike report.
- Never repeat what a README, a `CLAUDE.md` or a spike already says. It's a third copy, free to
  drift, and both readers reach the original anyway.
- Never address the diff. "Updated to v2", "as requested" belong in the commit message. Every
  comment must read correctly to someone opening the file cold in a year.
- Never point at a moving target — a spec section, a design doc, or *another comment*. Encode the
  fact. Ticket IDs and stable README paths are fine as trailing breadcrumbs.
- One sentence, two at most. A cap, not a target: nobody reads a five-line comment, and a fact that
  doesn't get read might as well not be written. A rationale with more than one part becomes several
  short comments next to the lines each part governs, not one paragraph above all of them. The cap
  is on the sentence, not the line — wrap at ~100 columns like everything else here; a 150-character
  one-liner is the same comment with the breaks deleted.
- A comment asserting how an API or a tool behaves is a claim, and a wrong one is worse than none.
  Verify it before writing or rewording it; if you can't, leave the existing wording alone.
- One-line summary on a public function or endpoint: fine.
- **`TODO` and `FIXME` never survive a push** — [`.husky/pre-push`](./.husky/pre-push) fails on
  any added one. Fine while you work; before pushing, file it with `pnpm issue:add` and delete the
  comment. Never delete one without filing it.

`packages/content` and `apps/huella-legal` sit at 4–6% comment lines and are the calibration; a file
far outside that is worth opening. The `comment-cleanup` skill runs the pass.

## 🚫 Things that look reasonable and are wrong here

- **Never add a build step to a package.** `packages/*` export raw TypeScript/Vue source; consumers
  compile them. No `build` script, no `dist/`, no `tsup`/`unbuild`, no `main`/`types` fields — the
  `exports` map points straight at source.
- **Never add a lifecycle script** (`postinstall`, `prepare`, `prepublish`). Both CI workflows
  install with `--ignore-scripts`, so anything hung off one works locally and silently does nothing
  in CI. There are none in the workspace today; keep it that way.
- **Never hand-edit [`docs/FEATURES.md`](./docs/FEATURES.md).** `pnpm docs:map` renders it and CI
  runs `pnpm docs:map --check`, so an edit survives exactly until the next render. A capability with
  no doc shows as `—`; the fix is to write the missing doc where it belongs, then re-render — never
  to fill the cell in.
- **Never hand-edit a `CHANGELOG.md` or a `version`.** `nx release` derives both from Conventional
  Commit messages. Releases run from the **Release** workflow (`workflow_dispatch`), never locally.
- **Never write a real endpoint, URL, token or instance ID into the repo.** Every one of them is an
  env var with no default; `.env.example` documents the names and nothing else. "It's a public URL"
  is not a reason — vendor endpoints stay out.
- **Never raise git.** Branching, committing, pushing, PRs and releases belong to the user and they
  do not want them suggested, offered, prepared for or asked about. Answer the question or change
  the code and stop there — an unprompted "want me to branch off and apply this?" is noise, not
  helpfulness. Act on any of it only when asked in those words; the branch and commit rules under
  [⌨️ Commands](#️-commands) are reference for when that happens, not a prompt to bring it up.
## 📦 Dependencies

- **Adding a validation or utility library is a check-in, not a ban.** Say what it buys you and lay
  out the hand-rolled alternative, then let the answer decide — don't just add it, especially in a
  package whose dependency list is one or two entries. `content` and `i18n` show what the reasoning
  looks like once it's settled: see their `✅ Validation` sections.
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

The rest of this section is reference for when the user asks for it, not licence to offer it.
Branches must match `^(hotfix|fix|feature|release)/[^/]+/[0-9]+-.+` and `master` is not pushable.
`pnpm issue:pick` is the shortest way to a branch — pick an open issue off a project board and it
creates `<type>/<project>/<issue number>-<slug>`, `<project>` being the slugified title of the gh
Project board the issue came from, which is the naming the number-first branches here come from.
Commits are [Conventional Commits](https://www.conventionalcommits.org) —
commitlint rejects anything else, and the type decides the next version.
[`commitlint.config.mjs`](./commitlint.config.mjs) just extends `@commitlint/config-conventional`
with no overrides, and two of that preset's rules aren't obvious from a rejection message: the
**type is lower-case** and the **subject is not** sentence-case, start-case, Pascal-case or
upper-case — so `feat: add the thing` passes and `feat: Add the thing` does not.

The pre-push hook validates the branch name, blocks added `TODO`/`FIXME` comments, nudges on
docs drift, then runs lint, test and typecheck on affected projects. CI runs those **plus `build`**,
so a green push is not yet a green pipeline — `apps/huella-legal` typechecks on build, which is where
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
| `doc-drift-check` | A change altered a project's public surface — exports, CLI flags, config shape, documented commands |
| `comment-cleanup` | Cleaning, pruning or auditing comments in a file, staged diff or PR before committing |
| `github-issue` | Filing an issue *for* the user — the three templates. They file their own with `pnpm issue:add`, which is deliberately template-free |
| `start-issue` | Starting work on a specific issue — from the branch you're on, or from a number, link or description |
| `spike-report` | "Do a spike on this" — research an architectural question and write the answer to `docs/spikes/`. Filing the *issue* is `github-issue` |
| `repo-review` | Rating, scoring or auditing the repo as a whole — the seven cards in [`docs/reviews/SCORECARDS.md`](./docs/reviews/SCORECARDS.md), not the current diff |
| `content:new-vendor` | Adding a CMS vendor to `@monorepo/content` |
| `i18n:new-vendor` | Adding a TMS vendor to `@monorepo/i18n` |
| `scripts:new-script` | Adding a repo-local CLI under `infrastructure/scripts` |
| `ui:new-component` | Adding a component to `@monorepo/ui` |
