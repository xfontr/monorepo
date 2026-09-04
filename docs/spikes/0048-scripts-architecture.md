# 🧭 One architecture for the scripts package

Spike: #48

## Context

`infrastructure/scripts` grew one folder per script — `issue/`, `drift/`, `map/`, `coverage/`, plus
`shared/` — with no stated hierarchy inside a folder. `issue/index.ts` consumes only `add` and
`pick`, so `gh.ts`, `git.ts` and `branch.ts` are reached from somewhere else in the folder and
nothing says from where or in which direction. The symptoms are concrete: four `index.ts` files with
four different shapes, six exit conventions, two output idioms picked per-file rather than per
audience, and the repo root resolved three separate times three different ways.

The proposal on the table was to give every script the same set of subfolders — `commands/` with a
barrel index, `types/` or `types.ts`, `constants.ts` and `configs/environment.ts`, `helpers/` — and
to move `git.ts` and `gh.ts` into `shared/`, since two `git.ts` files exist today.

## Result

The package is four files short of already being layered, and three of those four are `index.ts`.
Classifying all 21 non-spec files leaves no residue: each is an **entry**, a **command**, an
**adapter** or a pure **domain** module. So a layer vocabulary plus a one-way import rule is adopted
instead of a folder-per-kind layout — **no new directories**.

| Layer | What it is | Named | May import |
| --- | --- | --- | --- |
| entry | `index.ts`. Hands its commands to `run` and nothing else | always `index.ts` | `shared/cli.ts` + its own commands |
| command | One user-facing invocation: orchestration, prompts, output, exit meaning | `main.ts` when there's one, after the subcommand when there are several | anything in its own folder, `shared/*` |
| adapter | Exactly one door out: subprocess, filesystem, network, terminal | **after the boundary it wraps** — `git.ts`, `gh.ts`, `nx.ts`, `cache.ts`, `files.ts`, `prompts.ts`, `io.ts` | domain, `shared/*` |
| domain | Pure functions and the types they operate on | after the noun it computes — `branch`, `detect`, `capabilities`, `render`, `merge` | other domain, `shared/errors.ts`, pure stdlib |

Direction: **entry → command → adapter → domain, never back up and never sideways between script
folders.** One scoped exception — a command may import another command in the *same* folder, which
is what keeps `add.ts` → `pick.ts` legal rather than pushing that prompt into the dispatcher.

The load-bearing half is the adapter naming rule, because it resolves the question that prompted the
spike: **two `git.ts` files are correct.** They share one line and have zero export overlap — five of
the eight functions have a single caller in `drift`, three have a single caller in `issue`. What is
genuinely shared is the repo itself, so `shared/repo.ts` takes `git()`, a memoised lazy `repoRoot()`
and `PROJECT_ROOTS`, retiring three `git rev-parse --show-toplevel` subprocesses and the only
constant in the package that had two homes.

Three modules land in `shared/`: `cli.ts` (`run`, `fail`, `flag`), which makes every `index.ts` the
same three lines and retires the `COMMANDS` dispatch constant without a barrel; `errors.ts`
(`ExpectedError`, `CancelledError`); and `io.ts`, where `isTTY && !CI` picks clack or plain lines
behind one `out.*` surface with failures on stderr in both modes.

The uniformity is real but it is **+8 files and one rename, not 17 files across 12 directories** —
and the runner turns out to fix four defects that read as style until you look: `coverage`'s
actionable "run `nx run-many -t test:coverage` first" reaches the user as an unhandled-rejection
stack trace, `issue`'s usage error goes to *stdout* while exiting 1, `map/index.ts` calls
`process.exit(0)` immediately after a stdout write that a pipe can truncate, and `shared/cache.ts`
reads `--refresh` from `argv` at module load, so its behaviour depends on module-registry state.

One finding is independent of the layout question: `src/coverage/` **has never been linted.**
`**/coverage` is in [`baseIgnores`](../../packages/configs/src/eslint/lib/ignores.ts), which is why
that folder is the only one using `interface` and semicolon delimiters. The folder is renamed to
`coverage-report/`; the `coverage` script name stays, so nothing outside this package moves.

## Options considered

| Option | Why not |
| --- | --- |
| `commands/` per script | Three of the four scripts have exactly one command — a directory holding one file, three times over |
| A `commands/index.ts` barrel | Buys nothing `run({ add, pick })` doesn't: it renames the dispatch constant rather than removing it, and `add.ts` importing the barrel instead of `./pick.ts` is a cycle in a graph whose entry uses top-level `await` |
| `types/` folder | `**/types` is in `baseIgnores` too, so it would be silently unlinted repo-wide — the exact failure `src/coverage/` demonstrates, re-created deliberately |
| `types.ts` per script | All 14 exported types sit with the function that produces them. `BranchType` is `typeof BRANCH_TYPES[number]` from two lines above it; `import type { Doc } from "./capabilities.ts"` says `Doc` is what the capabilities layer speaks, where `from "./types.ts"` says nothing |
| `constants.ts` | Exactly one constant had two homes, and it moves to `shared/repo.ts`. `CANCELLED` exists in `add.ts` and `pick.ts` with *different* values, so centralising invites merging them and making one message a lie; `drift/README.md` cites three thresholds by file; `SECTIONS` is 30 lines of hard-wrapped prose |
| `configs/environment.ts` | Two env vars, read on adjacent lines of one file. Also confusing next to `@monorepo/configs`. The real defect was `cache.ts`'s module-load `argv` read |
| `helpers/` | Every candidate is private to its file with one to three call sites. "Helper" isn't a role — it names the author's uncertainty, and the four layers classify every file without it |
| Merging both `git.ts` into `shared/` | Produces an eight-export module where each caller uses half — the junk drawer this package's CLAUDE.md warns about |
| Unifying `add`/`pick`'s project prompt | Different return types and different jobs: `add` offers a *none* option, `pick` has the offline fallback. They share one string, which is what gets extracted |
| `domain/` directories | One or two files each. Their only real gain is a lint rule generic enough to live in `@monorepo/configs` — revisit if a script folder passes ~10 files |

## Consequences

Unlocks a shape a new script is written into rather than around: one `main.ts`, adapters named after
what they talk to, and a `README` rule that answers "where does this go" without a `helpers/`
folder to absorb the uncertainty. `map/` and `coverage-report/` also become importable without a git
checkout once `repoRoot()` is lazy, which is what makes their entry points testable later.

Forecloses little, since nothing moves between folders — but it does mean the layer rule is
**convention only** for now. Machine enforcement is a follow-up: a package-local
`no-restricted-imports` block with a declared adapter list, so a new file under a script folder is
domain by default and fails lint the moment it reaches for `node:fs` or `@clack/prompts`. It was
deferred because it costs this package's `eslint.config.ts` its status as a thin factory wrapper, and
the rule can't move into `@monorepo/configs` without `configs` learning the names `add.ts` and
`pick.ts`.

Revisit the folder question if a single script folder passes roughly ten files — that is the point
where `domain/` starts paying for itself, and where the lint rule above would become generic enough
to share.
