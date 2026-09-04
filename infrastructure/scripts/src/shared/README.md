# 🧰 shared

The doors out of this package, plus the two things every entry point agrees on. Nothing here knows
a script exists — that direction is the whole rule, and it's what keeps `shared/` from turning into
the folder everything ends up in.

## 🗂 What's here

| File | Layer | The door it is |
| --- | --- | --- |
| [`cli.ts`](./cli.ts) | entry support | `run` — argv parsed once, one command or a record of them, and one meaning per exit code. Also `fail` and `flag` |
| [`errors.ts`](./errors.ts) | leaf | `ExpectedError` and `CancelledError`, the two throws `run` treats as answers rather than bugs |
| [`io.ts`](./io.ts) | adapter | the terminal. `out.*` in clack when someone's watching, plain lines when nobody is |
| [`exec.ts`](./exec.ts) | adapter | subprocesses — `run`, and the `assertNotFlagLike` guard for values that would otherwise read as flags |
| [`git.ts`](./git.ts) | adapter | `git` itself, plus `repoRoot()` and `at()` for resolving against the repo rather than cwd |
| [`gh.ts`](./gh.ts) | adapter | `gh`, and `createIssue` on top of it |
| [`cache.ts`](./cache.ts) | adapter | the file cache under `node_modules/.cache/@monorepo/scripts` |
| [`prompts.ts`](./prompts.ts) | adapter | `orExit`, so a cancelled prompt anywhere unwinds to `run` |
| [`layout.ts`](./layout.ts) | domain | `PROJECT_ROOTS` — repo layout as data, with no way to read the repo |

`layout.ts` is separate from `git.ts` for one reason: `drift/detect.ts` is pure and needs
`PROJECT_ROOTS`, so keeping that constant in a module that shells out to `git` would drag a
subprocess into a file whose whole value is having no side effects.

## 📥 What moves here

A piece moves in when a **second** script folder needs it — that rule is in the
[package README](../../README.md#-adding-a-script) and it still holds for anything script-shaped. The
exception is the rows above marked *adapter*: those are facts about the environment, and two copies
of one is a bug waiting rather than a duplication to tolerate. The repo root used to be resolved
three separate ways in three files, all correct, all one edit from disagreeing.

## 🚫 No side effects at module scope

No `run()`, `git()` or `readFileSync` at the top level of a file — here or in a script folder. This
is the rule with the most scar tissue behind it:

- `repoRoot()` memoises on first call instead of resolving at import, because the two modules that
  used to resolve it eagerly couldn't be imported at all outside a git checkout — which is why
  neither had a spec.
- `cache.ts` reads `--refresh` per call, not once at module load. When it read argv eagerly, the
  answer depended on module-registry state, and its spec needed `vi.resetModules()` in a
  `beforeEach` to test the flag at all.

Read `process.argv` and `process.env` in a command, or through `flag()`, where the answer can't be
frozen before the command runs.
