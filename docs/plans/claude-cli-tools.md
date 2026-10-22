# 🛠 CLI tools that make Claude cheaper to run here

Four additions to [`infrastructure/scripts`](../../infrastructure/scripts/README.md), each replacing
a multi-step exploration Claude does today with one command that prints the answer. The aim is
fewer tokens per task, not more automation: every command is read-only or already existed as a
manual step, and none of them adds a decision Claude would have to make.

## 🔁 What changed on the way to #288

The pieces below are the plan as written. Building it changed six things:

| Planned | Built | Why |
| --- | --- | --- |
| A `check` script with a parser over Nx's console text | One root `package.json` line: `nx affected … --outputStyle=static-failures-only`, then both `--check`s | Nx 23 already prints only failing tasks in that style. It picks `summary`, log paths only, when it detects an agent, so the line names the style. It runs `eslint:lint` directly, since `lint` is a nested Nx run, and `nuxt-prepare` before it, since `eslint:lint` lacks that dependency |
| `check` covers lint, typecheck, test; `--ci` deferred | Also runs `docs:map --check` and `review:version --check`; no flags | Both are cheap, run in pre-commit and CI, and are tripped by agent edits. `--projects` and `--ci` were dropped with the script; `nx run-many` with the same style covers them |
| Comments capped at 1,500 characters | Untrimmed | Threads are short, and the decision often sits where a cap cuts |
| `issue:pick <n> --worktree` | `issue:pick <n>`, plus a separate `worktree:prepare <path>` with no `nuxi prepare` | Claude Code creates most worktrees itself, and a fresh one lints a Nuxt app through the existing `nuxt-prepare` edge |
| Delivery: scripts, READMEs, `docs:map` | Also the root `AGENTS.md` commands table, the `.claude/settings.json` allowlist and four skills | A command an agent isn't told about saves nothing |
| — | `eslint-fix.sh` runs from the file's package and reports leftover errors | The root has no `eslint` binary, so the hook had been a silent no-op |

Each script's README has the details; this file stays as the record of the plan.

## 🧭 Why the existing tools don't fit

`issue:pick` and `issue:add` are built on `@clack/prompts`, which needs a terminal. Claude's shell
has none, so `pick` can't run there and the [`start-issue`](../../.agents/skills/start-issue/SKILL.md)
skill redoes its seven steps by hand with `gh`. The output side is already fine: `out` in
[`io.ts`](../../infrastructure/scripts/src/shared/adapters/io.ts) falls back to plain lines when
there is no TTY. So the fix is an argument path that skips the prompts, not a new prompt library.

| Rule for everything below | Why |
| --- | --- |
| Arguments and flags only, no prompt on the new paths | Works with no TTY; a human still gets the prompts when they pass nothing |
| Plain text on stdout, errors on stderr via `out` and `ExpectedError` | Same contract as the other scripts |
| A digest, never a log | The point is fewer tokens; the full output goes to a file the digest names |
| No new dependency | [`AGENTS.md`](../../infrastructure/scripts/AGENTS.md): small, prompts and subprocess calls |

## 📋 The four pieces

| # | Command | Replaces |
| --- | --- | --- |
| 1 | `pnpm issue:brief [number]` | The `gh issue view --comments`, blocker and ADR hunting in `start-issue` step 3 |
| 2 | `pnpm check` | Reading raw Nx, ESLint, `tsc` and Vitest output |
| 3 | `pnpm ci:failures [pr]` | Fetching and scrolling failed CI logs |
| 4 | `pnpm issue:pick <number> [--worktree]` | Hand-running `start-issue` step 2, and your own pick-then-open-another-checkout routine |

Build order is 1, 2, 3, 4. The brief and the check runner pay off on every task, and 4 touches the
code you use daily so it goes last, once the non-interactive conventions are settled.

## 1️⃣ `issue:brief`

A third subcommand of [`issue/`](../../infrastructure/scripts/src/issue/README.md), since it shares
the `gh` adapter. With no argument it reads the issue number from the current branch name
(`<type>/<project>/<number>-<slug>`), which is what `start-issue` already tells Claude to do.

Prints one block:

| Section | Source |
| --- | --- |
| Title, state, labels, assignee, board status | `gh issue view --json` |
| Body | Verbatim |
| Comments | Author and body, newest last, each capped at about 1,500 characters with a marker where it was cut |
| Blockers | Every `Blocked by #n` in the body, each fetched as number, title and state only |
| Decisions | Files in `docs/decisions/` whose frontmatter names the issue or a spike the issue references |
| Project | The branch's `<project>` segment resolved to a directory under `apps/`, `packages/` or `infrastructure/`, plus the path of its nearest `AGENTS.md` |

Pure parts go in `domain/` with specs: blocker extraction, comment truncation, the decision lookup
and the branch parser. `domain/branch.ts` already slugifies; add the inverse there. The decision
lookup must match on frontmatter, not filename, because a decision's number is not the issue's
(`start-issue` says so).

Afterwards, shrink `start-issue` step 3 to "run `pnpm issue:brief`, then read what it points at".

## 2️⃣ `pnpm check`

Runs lint, typecheck and test on affected projects and prints a short result. It shells out to Nx,
so caching works exactly as it does today: a cached task replays, a failed task is never cached.

```sh
pnpm check               # affected since master: lint, typecheck, test
pnpm check --all         # run-many over the whole workspace
pnpm check --project @monorepo/content
```

| Outcome | Output |
| --- | --- |
| All green | One line: targets run, projects, how many came from cache, elapsed time |
| Failure | Per failing task: project, target, then only the error lines, capped at about 40 per task, and the path of the full log |

The full log goes to `.nx/check-last.log`, which is already git-ignored, so Claude can open it only
when the digest isn't enough.

**Spike first.** Nx 23 may expose per-task results and output more directly than parsing its
console text (a run summary, `--outputStyle`, or task output files under `.nx/`). Spend an hour
there before writing a parser, because a parser tied to Nx's banners breaks on an Nx upgrade. If
nothing structured exists, fall back to splitting on Nx's task headers and filtering by pattern,
and keep the patterns in `domain/` with specs fed real captured failures.

Measure before and after on three known failures (a lint error, a type error, a failing spec) and
record the token counts in the PR, since saving tokens is the whole claim.

## 3️⃣ `ci:failures`

For the current branch's PR, or a given number:

1. `gh pr checks --json name,state,link,workflow` for the overview.
2. For each failed check, `gh run view <run> --log-failed`.
3. Strip ANSI codes and timestamps, find the failing step, keep the error lines plus a few lines
   of context, cap each job at about 40 lines.

Pending checks print their state and nothing else, so Claude doesn't poll a log that doesn't exist
yet. When every check is green it says so in one line. Nx Cloud's `ci_task_output` MCP tool stays
available for task-level detail, but this works with `gh` alone and is deterministic.

The log trimming (strip, locate, cap) is pure and gets a spec against a captured real log. The `gh`
calls sit in `adapters/`, using `gh()` from
[`shared/adapters/gh.ts`](../../infrastructure/scripts/src/shared/adapters/gh.ts).

## 4️⃣ `issue:pick <number>` and `--worktree`

[`pick.ts`](../../infrastructure/scripts/src/issue/pick.ts) already holds the steps: branch name
from [`domain/branch.ts`](../../infrastructure/scripts/src/issue/domain/branch.ts), `developBranch`,
`assignToMe`, `moveToInProgress`. With a number it skips the project and issue prompts.

| Input | Resolved from |
| --- | --- |
| Branch type | `--type`, else the issue label (`enhancement` is `feature`, `bug` is `fix`); a `spike` or unmapped label fails with the choices named, via `isInteractive()` the way `dev/main.ts` does |
| Project | The issue's board; an issue on no board fails and says to pass `--project` |

`--worktree` replaces the checkout with `git worktree add ../<repo>-<number> <branch>`, then runs
`pnpm install --ignore-scripts` there and `nuxi prepare` for any Nuxt app, matching the CI install
and the `.nuxt` requirement in the root `CLAUDE.md`. It prints the path and stops. It does not
launch Claude or an editor.

Worktree paths sit outside the repo, and
[`map/adapters/files.ts`](../../infrastructure/scripts/src/map/adapters/files.ts) already ignores a
`worktrees` directory, so nothing here changes the docs map.

## ✅ Delivery

Each piece follows the [`scripts-new-script`](../../.agents/skills/scripts-new-script/SKILL.md)
skill: folder layout, `package.json` line, README row, a root forwarding line, then
`pnpm docs:map`. Every path comes from `at()`, and every external value goes through
`assertNotFlagLike`.

## 🔬 Verification

| Check | How |
| --- | --- |
| Specs | `pnpm exec nx test @monorepo/scripts`; the pure parts above each get one |
| No TTY | Run each command with `</dev/null` and `CI=1`; none may prompt or hang |
| `issue:brief` | On a real issue with a blocker and a decision, compare against what `start-issue` would read |
| `check` caching | Run twice; the second must report everything cached and finish in seconds |
| `check` failure | Break a lint rule, a type and a spec in turn; each digest names the file and line |
| `ci:failures` | Against one red and one green PR |
| `pick` | `issue:pick <n> --worktree` on a scratch issue; confirm branch, assignee, board column and `pnpm lint` passes inside the worktree on the first try |
| Repo gates | `pnpm docs:map --check`, then lint, typecheck and test |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Scaffolding generators (`new-package`, `ui-new-component`) | They write many files across boundaries and the boundary tables must stay in sync, so a wrong generator does more damage than a skill Claude reads. Revisit when one fixed recipe has gone unchanged for several uses |
| `pnpm check --ci` (adds `build`, `docs:map --check`, `review:version --check`) | A green push is not a green pipeline, but the three-target check covers the common loop. Add the flag once the digest format is settled |
| Boundary-table sync check | The tag table in `boundaries.ts` and the root README must agree. A script that diffs them belongs with `docs:map --check` and is a separate issue |
| Project context pack (tags, dependents, exports in one print) | `issue:brief` covers the project's `AGENTS.md`; the Nx MCP server already answers graph questions |
| `--json` output | Plain text is enough for Claude. Add it only if something other than a person or Claude starts consuming these |
