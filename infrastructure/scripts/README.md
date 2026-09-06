# 🤖 @monorepo/scripts

Repo-local dev tooling with no product code in it. Nothing imports this package — every script here
is a CLI you run by hand or a hook runs for you, which is why it lives in `infrastructure/` rather
than `packages/`.

One folder per script under `src/`, each with its own README. This one only covers what they share.

## 🗂 Structure

```
src/
  issue/            pnpm issue:add | issue:pick — file a GitHub issue, or branch off one
  ship/             pnpm issue:ship — push, open or reuse the PR, arm auto-merge, watch checks
  drift/            pnpm docs:drift — warn when a project's docs may be stale, offer to file an issue
  map/              pnpm docs:map — render docs/FEATURES.md, the index of everything this repo can do
  coverage-report/  pnpm test:coverage (root) — merge every project's coverage-final.json into one report
  shared/           whatever more than one script needs, laid out the same way
```

Every one of them has the same four things inside, which is the whole layout rule:

```
index.ts     the entry point. Hands its commands to run() and does nothing else
main.ts      the command — or one file per subcommand, named after it, the way issue/ has add + pick
adapters/    one file per boundary out: git.ts, gh.ts, nx.ts, files.ts, prompts.ts, io.ts
domain/      pure functions and their types. No fs, no subprocess, no clack, no process
```

| Script | Command | What it's for |
| --- | --- | --- |
| [`issue add`](./src/issue/README.md#-pnpm-issueadd) | `pnpm issue:add` | Picking a project and label, then filing an issue with `gh` |
| [`issue pick`](./src/issue/README.md#-pnpm-issuepick) | `pnpm issue:pick` | Picking an open issue off a project board, then branching off it and self-assigning |
| [`ship`](./src/ship/README.md) | `pnpm issue:ship` | Pushing the current branch, opening or reusing its PR, arming auto-merge, then blocking on checks |
| [`drift`](./src/drift/README.md) | `pnpm docs:drift` | Warning when a changed project's docs look stale, and offering to file it |
| [`map`](./src/map/README.md) | `pnpm docs:map` | Rendering the feature index, and asserting in CI that it's current |
| [`coverage-report`](./src/coverage-report/README.md) | `pnpm test:coverage` (root) | Merging every project's coverage into one browsable HTML report |

## 🧱 Which way imports go

**index.ts → the command → `adapters/` → `domain/`.** Never back up, and never sideways into another
script's folder. One scoped exception: a command may import another command *in the same folder*,
which is what keeps `add.ts` calling `pick.ts` legal — the alternative puts that prompt in the
dispatcher. `shared/` is reachable from anywhere and reaches nothing.

Two things that follow from it and are worth saying out loud:

- **An adapter is named after the boundary it wraps**, which is why `git.ts` exists in `issue/`, in
  `drift/` **and** in `shared/` and none of them is a duplicate. The shared one is `git` itself plus
  the repo root; each script's is the handful of questions that script asks. The two script-level
  ones share one line of code and no exports — folding them together produces an eight-export
  module where every caller uses half of it.
- **`adapters/` is where every side effect in this package lives.** "Does this touch the network"
  is answerable from a directory listing, and a `domain/` file that reaches for `node:fs` is in the
  wrong folder rather than merely doing something questionable.

The direction is convention, not lint, today — the folders make it a generic glob rather than a
hardcoded file list, so enforcing it is now cheap. See
[`0048-scripts-architecture.md`](../../docs/spikes/0048-scripts-architecture.md) for what was
weighed on the way here, including the flat layout this replaced.

## 🚀 Adding a script

A new script is a folder under `src/` shaped like the block above — `index.ts`, a `main.ts`,
`adapters/`, `domain/` and a `README.md` — plus a line in this package's `scripts` and a row in the
table above. Create `adapters/` and `domain/` even if one of them starts with a single file: the
point is that the listing answers "what runs, what talks to the outside, what's pure" before you
open anything. There is no barrel, and scripts don't import each other. A folder may expose more
than one command when they genuinely share code, the way `issue/` does — `add` and `pick` share the
project options, the cancel handling and the `gh` wrapper — in which case `index.ts` passes a record
and `run` dispatches on the first argument. Two unrelated scripts get two folders.

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
[`issue/domain/branch.ts`](./src/issue/domain/branch.ts), which turns a typed title into a ref name,
[`drift/domain/detect.ts`](./src/drift/domain/detect.ts), which turns a diff into a warn/don't-warn decision,
[`map/domain/capabilities.ts`](./src/map/domain/capabilities.ts), which decides what counts as a capability and
which doc explains one, [`map/domain/render.ts`](./src/map/domain/render.ts), which turns capabilities and docs
into the map's markdown, [`shared/adapters/exec.ts`](./src/shared/adapters/exec.ts), which rejects a `gh`/`git`
argument that would be read as a flag instead of the value it's supposed to be, and
[`coverage-report/domain/discover.ts`](./src/coverage-report/domain/discover.ts) and
[`coverage-report/domain/merge.ts`](./src/coverage-report/domain/merge.ts), which resolve each project's coverage
output and refuse to merge a set that's missing one.

Note that the folder is `coverage-report/`, not `coverage/`: `**/coverage` is in
[`baseIgnores`](../../packages/configs/src/eslint/lib/ignores.ts), so a folder by that name is
invisible to ESLint. It went unlinted long enough to drift to `interface` and semicolon delimiters
while the rest of the package used `type`. `**/types` is on that list too, which is one reason the
pure layer here is `domain/` and not `types/` — a directory by that name would be unlinted
everywhere in the workspace.

## 🔑 Requirements

`gh` installed and authenticated (`gh auth status`) for `issue/`, `ship/` and `drift/`. They shell
out to it rather than calling the GitHub API, so they inherit whatever account is already logged in
instead of needing a token. `map/` needs neither, which is why it's the one that runs in CI. `ship/`
additionally needs the repo's *Allow auto-merge* setting on — without it, `gh pr merge --auto` fails
and the branch is left pushed with a PR open but nothing armed to merge it.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A script that isn't a one-shot CLI (a watcher, a server) | It doesn't belong here — `infrastructure/` gets its own project for it, the way [`translations`](../translations/README.md) has one |
| Enforcing the layer rule instead of stating it | A `no-restricted-imports` block in this package's own `eslint.config.ts` with a declared adapter list, so a new file under a script folder is domain by default and fails lint the moment it imports `node:fs` or `@clack/prompts`. Deferred because it costs this package the thin-wrapper `eslint.config.ts` every other project has, and the rule can't move into `@monorepo/configs` without `configs` learning the names `add.ts` and `pick.ts` |
| A script folder past ~10 files | That's when `domain/` and `adapters/` folders start paying for themselves, and when the rule above would be generic enough to share. Four layers named in prose is cheaper than eight directories until then |
| Running one of the `gh` scripts in CI | [`ci.yml`](../../.github/workflows/ci.yml) already runs `docs:map --check`, which touches only git and the filesystem. Anything calling `gh` needs `GH_TOKEN` in the job env — `--ignore-scripts` is not the obstacle, since none of these is a lifecycle hook |
