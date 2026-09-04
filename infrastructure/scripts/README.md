# 🤖 @monorepo/scripts

Repo-local dev tooling with no product code in it. Nothing imports this package — every script here
is a CLI you run by hand or a hook runs for you, which is why it lives in `infrastructure/` rather
than `packages/`.

One folder per script under `src/`, each with its own README. This one only covers what they share.

## 🗂 Structure

```
src/
  issue/           pnpm issue:add | issue:pick — file a GitHub issue, or branch off one
  drift/           pnpm docs:drift — warn when a project's docs may be stale, offer to file an issue
  map/             pnpm docs:map — render docs/FEATURES.md, the index of everything this repo can do
  coverage-report/ pnpm test:coverage (root) — merge every project's coverage-final.json into one browsable report
  shared/          the doors out — git, gh, exec, cache, io, prompts — and the runner every entry point uses
```

| Script | Command | What it's for |
| --- | --- | --- |
| [`issue add`](./src/issue/README.md#-pnpm-issueadd) | `pnpm issue:add` | Picking a project and label, then filing an issue with `gh` |
| [`issue pick`](./src/issue/README.md#-pnpm-issuepick) | `pnpm issue:pick` | Picking an open issue off a project board, then branching off it and self-assigning |
| [`drift`](./src/drift/README.md) | `pnpm docs:drift` | Warning when a changed project's docs look stale, and offering to file it |
| [`map`](./src/map/README.md) | `pnpm docs:map` | Rendering the feature index, and asserting in CI that it's current |
| [`coverage-report`](./src/coverage-report/README.md) | `pnpm test:coverage` (root) | Merging every project's coverage into one browsable HTML report |

## 🧱 The four layers

Every file here is one of four things. The names are the point: they're what tells you where a new
function goes without anyone having to invent a `helpers/` folder to absorb the question.

| Layer | What it is | Named | May import |
| --- | --- | --- | --- |
| **entry** | Hands its commands to `run` and does nothing else | always `index.ts` | `shared/cli.ts` and its own commands |
| **command** | One invocation someone actually types: orchestration, prompts, output, what an exit code means | `main.ts` when there's one, after the subcommand when there are several | anything in its own folder, `shared/*` |
| **adapter** | Exactly one door out — a subprocess, the filesystem, the network, the terminal | **after the boundary it wraps**: `git.ts`, `gh.ts`, `nx.ts`, `files.ts`, `prompts.ts`, `io.ts` | domain, `shared/*` adapters |
| **domain** | Pure functions and the types they operate on. No fs, no subprocess, no clack, no `process` | after the noun it computes: `branch.ts`, `detect.ts`, `capabilities.ts`, `merge.ts` | other domain, `shared/errors.ts`, `shared/layout.ts`, pure stdlib |

**entry → command → adapter → domain, never back up, and never sideways between script folders.**
One scoped exception: a command may import another command *in the same folder*, which is what
keeps `add.ts` calling `pick.ts` legal — the alternative puts that prompt in the dispatcher.

That the adapter is named after its boundary is the half that does the work. It's why `git.ts`
exists in `issue/`, in `drift/` **and** in `shared/` and none of them is a duplicate: the shared one
is `git` itself plus the repo root, and each script's is the handful of questions that script asks.
The two script-level ones share exactly one line of code and no exports at all — folding them
together would produce an eight-export module where every caller uses half of it.

The layer rule is convention, not lint, today — see
[`0048-scripts-architecture.md`](../../docs/spikes/0048-scripts-architecture.md) for what was
weighed, including the folder-per-kind layout this was chosen over.

## 🚀 Adding a script

A new script is a folder under `src/` with a three-line `index.ts`, a `main.ts`, and a `README.md`,
plus a line in this package's `scripts` and a row in the table above. There is no barrel, and
scripts don't import each other. A folder may expose more than one command when they genuinely share
code, the way `issue/` does — `add` and `pick` share the project options, the cancel handling and the
`gh` wrapper — in which case `index.ts` passes a record and `run` dispatches on the first argument.
Two unrelated scripts get two folders.

Every entry point is the same five lines, which is the point of `run`:

```ts
#!/usr/bin/env node
import { run } from "../shared/cli.ts";
import { main } from "./main.ts";

await run(main);
```

It parses argv once, and it fixes what an exit code means for all of them: a `CancelledError` exits
0, an `ExpectedError` prints its message alone on stderr and exits 1, and anything else is a bug and
gets its stack. Never call `process.exit` — `run` sets `process.exitCode`, because a write to a pipe
is asynchronous and exiting on the next line can truncate it.

When a second folder needs something an existing one already has, that piece moves into
[`shared/`](./src/shared/README.md), which has its own README describing what's in it and what
belongs there. It has no `index.ts` and isn't a script, which is why it's absent from the table
above.

Entry points run straight with `node`, no build step and no `tsx`/`ts-node`: this repo's Node
engines range already strips types. Node's stripping does no resolution rewriting, so **internal
imports use the explicit `.ts` extension** — `./gh.ts`, not `./gh`.

## ✅ Tests

`test` still passes with `--passWithNoTests`, because most of what's here is prompts and `gh`
invocations — a spec can only assert those against a mock of itself. The exception is the rule:
real logic — a parser, a diff, a mapping — goes in its own file and gets a spec, per
[`writing-tests`](../../.claude/skills/writing-tests/SKILL.md). Today that's
[`issue/branch.ts`](./src/issue/branch.ts), which turns a typed title into a ref name,
[`drift/detect.ts`](./src/drift/detect.ts), which turns a diff into a warn/don't-warn decision,
[`map/capabilities.ts`](./src/map/capabilities.ts), which decides what counts as a capability and
which doc explains one, [`shared/exec.ts`](./src/shared/exec.ts), which rejects a `gh`/`git`
argument that would be read as a flag instead of the value it's supposed to be, and
[`coverage-report/discover.ts`](./src/coverage-report/discover.ts) and
[`coverage-report/merge.ts`](./src/coverage-report/merge.ts), which resolve each project's coverage
output and refuse to merge a set that's missing one.

Note that the folder is `coverage-report/`, not `coverage/`: `**/coverage` is in
[`baseIgnores`](../../packages/configs/src/eslint/lib/ignores.ts), so a folder by that name is
invisible to ESLint. It went unlinted long enough to drift to `interface` and semicolon delimiters
while the rest of the package used `type`. `**/types` is on that list too — worth knowing before
naming a directory.

## 🔑 Requirements

`gh` installed and authenticated (`gh auth status`) for `issue/` and `drift/`. They shell out to it
rather than calling the GitHub API, so they inherit whatever account is already logged in instead
of needing a token. `map/` needs neither, which is why it's the one that runs in CI.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A script that isn't a one-shot CLI (a watcher, a server) | It doesn't belong here — `infrastructure/` gets its own project for it, the way [`translations`](../translations/README.md) has one |
| Enforcing the layer rule instead of stating it | A `no-restricted-imports` block in this package's own `eslint.config.ts` with a declared adapter list, so a new file under a script folder is domain by default and fails lint the moment it imports `node:fs` or `@clack/prompts`. Deferred because it costs this package the thin-wrapper `eslint.config.ts` every other project has, and the rule can't move into `@monorepo/configs` without `configs` learning the names `add.ts` and `pick.ts` |
| A script folder past ~10 files | That's when `domain/` and `adapters/` folders start paying for themselves, and when the rule above would be generic enough to share. Four layers named in prose is cheaper than eight directories until then |
| Running one of the `gh` scripts in CI | [`ci.yml`](../../.github/workflows/ci.yml) already runs `docs:map --check`, which touches only git and the filesystem. Anything calling `gh` needs `GH_TOKEN` in the job env — `--ignore-scripts` is not the obstacle, since none of these is a lifecycle hook |
