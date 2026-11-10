# 📊 usage

Answers "which of these scripts does anyone run, how, and who runs them", and "which lint rules
do agents trip". Every script that goes through [`run()`](../shared/cli.ts), and every edit an agent
makes, writes CSV rows to a buffer inside `.git`; `pnpm usage:flush` moves them into committed files
under `.telemetry/`, and the developer portal's Telemetry page reads every file there.

| Log | Written by | Sees |
| --- | --- | --- |
| `scripts` | [`run()`](../shared/cli.ts), after every script | Every run, yours and agents' |
| `lint` | [`eslint-fix.sh`](../../../../.claude/hooks/eslint-fix.sh), after every file an agent edits | **Agent edits only.** Your editor fixes your code on save and nothing records it |

```sh
pnpm usage:flush     # what .husky/pre-commit runs before every commit — rarely needed by hand
```

## 🗂 Structure

```
index.ts             hands main to run()
main.ts              for each log: take its buffer, append the complete rows to this branch's file
adapters/files.ts    renames a buffer before reading it; appends to .telemetry/<log>/<branch>.csv
```

The recorder itself sits in [`shared/`](../shared/README.md) because `run()` is what calls it:
`domain/usage.ts` builds the row and owns both logs' columns, `adapters/usage.ts` appends it.

## 🧾 What a row holds

The repo is public, so every committed row is too. A script run:

| Column | Holds | Why it's safe to publish |
| --- | --- | --- |
| `at` | The day the run started, `YYYY-MM-DD` | A time of day would publish working hours; the alerts only need the day |
| `script`, `command` | The script folder and its subcommand, e.g. `issue`, `pick` | Names this repo chose |
| `target` | A positional naming a workspace project, e.g. `pnpm dev huella-legal` | Only ever a folder name under `apps/`, `packages/` or `infrastructure/` |
| `flags` | Flag names, `;`-separated. A value survives only for the flags in `VALUE_FLAGS` (`type`, `project`) | Every other value is dropped, so a new `--title=` flag is safe the day it ships |
| `area` | The `<area>` segment of the branch, or `repo` | Branch names are pushed anyway |
| `caller` | `human`, or the agent's name from `AI_AGENT` (`claude-code`), falling back to `CLAUDECODE=1` | — |
| `tty` | `1` when stdout is a terminal | — |
| `exit`, `ms` | Exit code (`130` for Ctrl+C) and duration | Numbers |

A lint hit, one per problem ESLint reports before `--fix` runs, in `LINT_COLUMNS` order:

| Column | Holds |
| --- | --- |
| `at` | The day, as above |
| `rule` | The rule ID, e.g. `no-console` |
| `project` | The edited file's project, without `@monorepo/` |
| `severity`, `fixable` | `error` or `warn`, and `1` when `--fix` can settle it |
| `caller` | The agent's name, as above |

A problem left in a file is reported again on every later edit to it, so a hit is a report, not a
distinct mistake. No path and no message is recorded.

Cells never hold a comma, a quote or a newline, so the portal splits on `,` and needs no CSV
library. It reads columns by header name, so adding one is backwards compatible.

## 🔁 Where the data lives

| Thing | Where | Committed |
| --- | --- | --- |
| The buffers | `<git common dir>/telemetry/<log>.csv` | No: inside `.git`, shared by every worktree |
| The logs | `.telemetry/<log>/<branch>.csv`, one file per branch | Yes, by the commit that flushed it |

Writing to `.git` first is what keeps a script run from dirtying the working tree, which would
block `git pull` and checkouts and stop the `ship-issue` workflow at its clean-tree check. One
file per branch is what keeps two PRs from conflicting: no branch ever appends to another's file.
`.telemetry/` sits outside every Nx project, so a flushed row makes nothing affected.

## 🙈 What is never recorded

| Run | Why |
| --- | --- |
| CI (`CI` set) | Nothing persists it, and nobody chose to run it |
| Tests (`VITEST` set) | Not a use |
| Inside a git hook (`MONOREPO_GIT_HOOK` set by `.husky/*`) | `docs:map --check` on every commit would drown out real choices |
| `pnpm usage:flush` itself | It would refill the buffer it just emptied |
| `pnpm check`, `lint`, `test`, `release` | They are Nx or shell one-liners in the root `package.json`, not scripts that go through `run()` |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Lint hits from your own edits | Add `--format json` capture to `pnpm check`; it would still miss everything the editor fixes on save, which is most of it |
| Counting the root `package.json` one-liners | Route them through a thin `run()` script; lifecycle hooks are banned, so there's no cheaper seam |
| Rows flushed into a branch that never merges | They are lost with the branch, other worktrees' runs included, since the buffer is shared. Worth fixing only if abandoned branches become common: flush only rows whose `area` matches the branch |
| Runs committed with `--no-verify` | Nothing to do: they wait in the buffer for the next commit that runs the hook |
| A value for another flag | Add its name to `VALUE_FLAGS` once its values come from a closed list |
| Compacting old branch files | Concatenate them into one file per year; the portal reads every `.csv` in the folder and doesn't care how they're split |
