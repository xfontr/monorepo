# 🧭 One architecture for the scripts package

Spike: #48
Status: Implemented

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
**adapter** or a pure **domain** module. Those four roles become the layout — `index.ts` and the
command at a script folder's root, then `adapters/` and `domain/` beneath it:

```
issue/                    drift/                   map/
  index.ts                  index.ts                 index.ts
  add.ts                    main.ts                  main.ts
  pick.ts                   adapters/git.ts          adapters/files.ts
  adapters/gh.ts            domain/detect.ts         domain/capabilities.ts
  adapters/git.ts                                    domain/render.ts
  adapters/prompts.ts
  domain/branch.ts
```

| Layer | What it is | Where | May import |
| --- | --- | --- | --- |
| entry | Hands its commands to `run` and nothing else | always `index.ts` | `shared/cli.ts` + its own commands |
| command | One user-facing invocation: orchestration, prompts, output, exit meaning | the folder root — `main.ts`, or one file per subcommand | anything in its own folder, `shared/*` |
| adapter | Exactly one door out: subprocess, filesystem, network, terminal | `adapters/`, **named after the boundary it wraps** — `git.ts`, `gh.ts`, `nx.ts`, `cache.ts`, `files.ts`, `prompts.ts`, `io.ts` | domain, `shared/*` |
| domain | Pure functions and the types they operate on | `domain/`, named after the noun it computes — `branch`, `detect`, `capabilities`, `render`, `merge` | other domain, `shared/errors.ts`, pure stdlib |

Direction: **entry → command → adapter → domain, never back up and never sideways between script
folders.** One scoped exception — a command may import another command in the *same* folder, which
is what keeps `add.ts` → `pick.ts` legal rather than pushing that prompt into the dispatcher.

The four roles were first adopted as a **naming convention on a flat tree**, documented in the
package README, on the grounds that nine directories for 21 files was poor economics and three of
them would hold a single file. That was reversed on review, and the reason is worth keeping: the
complaint being answered was *"I open the folder and it's a mess"*, and a flat `add.ts branch.ts
gh.ts git.ts index.ts pick.ts prompts.ts` answers none of "what can I run", "what talks to the
outside", "what's pure" until you open all seven. A README table that carries structure the
filesystem could carry is a table nobody reads. Directory economics is the wrong axis when
legibility-without-docs is the requirement — and once the folders exist, the README's layer table
becomes redundant, which is the test of whether the layout works.

The load-bearing half is the adapter naming rule, because it resolves the question that prompted the
spike: **two `git.ts` files are correct.** They share one line and have zero export overlap — five of
the eight functions have a single caller in `drift`, three have a single caller in `issue`. What is
genuinely shared is `git` itself, so `shared/adapters/git.ts` takes `git()`, a memoised lazy
`repoRoot()` and `at()`, retiring three `git rev-parse --show-toplevel` subprocesses. `PROJECT_ROOTS`
— the only constant in the package that had two homes — goes to `shared/domain/layout.ts` rather
than alongside it, because `drift/domain/detect.ts` is pure and needs it, and a pure file importing
the module that shells out to `git` would defeat the point of the layer.

Three modules land in `shared/`: `cli.ts` (`run`, `fail`, `flag`), which makes every `index.ts` the
same three lines and retires the `COMMANDS` dispatch constant without a barrel; `errors.ts`
(`ExpectedError`, `CancelledError`); and `adapters/io.ts`, where `isTTY && !CI` picks clack or plain
lines behind one `out.*` surface with failures on stderr in both modes.

The runner turns out to fix four defects that read as style until you look: `coverage`'s
actionable "run `nx run-many -t test:coverage` first" reaches the user as an unhandled-rejection
stack trace, `issue`'s usage error goes to *stdout* while exiting 1, `map/index.ts` calls
`process.exit(0)` immediately after a stdout write that a pipe can truncate, and `shared/adapters/cache.ts`
reads `--refresh` from `argv` at module load, so its behaviour depends on module-registry state.

One finding is independent of the layout question: `src/coverage/` **has never been linted.**
`**/coverage` is in [`baseIgnores`](../../packages/configs/src/eslint/lib/ignores.ts), which is why
that folder is the only one using `interface` and semicolon delimiters. The folder is renamed to
`coverage-report/`; the `coverage` script name stays, so nothing outside this package moves.

## Options considered

| Option | Why not |
| --- | --- |
| The same four layers as a naming convention on a flat tree | Adopted first, then reversed — see the last paragraph of the Result. It leaves the directory listing saying nothing, which was the original complaint |
| `commands/` per script | Three of the four scripts have exactly one command, so it would be a directory holding one file three times. The command sits at the folder root instead, which reads the same and costs nothing: root = what you can run, subdirectories = support |
| A `commands/index.ts` barrel | Buys nothing `run({ add, pick })` doesn't: it renames the dispatch constant rather than removing it, and `add.ts` importing the barrel instead of `./pick.ts` is a cycle in a graph whose entry uses top-level `await` |
| `types/` folder | `**/types` is in `baseIgnores` too, so it would be silently unlinted repo-wide — the exact failure `src/coverage/` demonstrates, re-created deliberately. It's why the pure layer is `domain/` |
| `types.ts` per script | All 14 exported types sit with the function that produces them. `BranchType` is `typeof BRANCH_TYPES[number]` from two lines above it; `import type { Doc } from "./capabilities.ts"` says `Doc` is what the capabilities layer speaks, where `from "./types.ts"` says nothing |
| `constants.ts` | Exactly one constant had two homes, and it moves to `shared/domain/layout.ts`. `CANCELLED` exists in `add.ts` and `pick.ts` with *different* values, so centralising invites merging them and making one message a lie; `drift/README.md` cites three thresholds by file; `SECTIONS` is 30 lines of hard-wrapped prose |
| `configs/environment.ts` | Two env vars, read on adjacent lines of one file. Also confusing next to `@monorepo/configs`. The real defect was `cache.ts`'s module-load `argv` read |
| `helpers/` | Every candidate is private to its file with one to three call sites. "Helper" isn't a role — it names the author's uncertainty, and the four layers classify every file without it |
| Merging both `git.ts` into `shared/` | Produces an eight-export module where each caller uses half — the junk drawer this package's CLAUDE.md warns about |
| Unifying `add`/`pick`'s project prompt | Different return types and different jobs: `add` offers a *none* option, `pick` has the offline fallback. They share one string, which is what gets extracted |

## Consequences

Unlocks a shape a new script is written into rather than around, and one a stranger can read off a
directory listing: the root says what you can run, `adapters/` is every side effect in the package,
`domain/` is what a spec can call without a mock. `map/` and `coverage-report/` also become
importable without a git checkout once `repoRoot()` is lazy, which is what makes their entry points
testable at all.

The direction is still **convention, not lint** — but the folders change what enforcing it costs.
The rule was originally deferred because, on a flat tree, it needed a hand-maintained list of which
filenames are adapters, which meant a 40-line block in this package's own `eslint.config.ts` and no
path into `@monorepo/configs` without `configs` learning the names `add.ts` and `pick.ts`. Against
directories it is a generic glob — `**/domain/**` may not import `node:fs`, `node:child_process` or
`@clack/prompts` — which is the same shape as the existing
[`coreIsolation.ts`](../../packages/configs/src/eslint/lib/coreIsolation.ts) rule and can live
beside it. That's the follow-up.

Forecloses the flat layout, and costs nine directories, three of which hold a single file. That is
the price of the listing being the documentation, and it is the right way round: the README's layer
table was deleted when the folders landed.
