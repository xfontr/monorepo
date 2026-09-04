# 🤖 @monorepo/scripts

Repo-local dev tooling with no product code in it. Nothing imports this package — every script here
is a CLI you run by hand or a hook runs for you, which is why it lives in `infrastructure/` rather
than `packages/`.

One folder per script under `src/`, each with its own README. This one only covers what they share.

## 🗂 Structure

```
src/
  issue/    pnpm issue:add | issue:pick — file a GitHub issue, or branch off one
  drift/    pnpm docs:drift — warn when a project's docs may be stale, offer to file an issue
  shared/   gh.ts, cache.ts, prompts.ts — the pieces issue/ and drift/ both need
```

| Script | Command | What it's for |
| --- | --- | --- |
| [`issue add`](./src/issue/README.md#-pnpm-issueadd) | `pnpm issue:add` | Picking a project and label, then filing an issue with `gh` |
| [`issue pick`](./src/issue/README.md#-pnpm-issuepick) | `pnpm issue:pick` | Picking an open issue off a project board, then branching off it and self-assigning |
| [`drift`](./src/drift/README.md) | `pnpm docs:drift` | Warning when a changed project's docs look stale, and offering to file it |

A folder may expose more than one command, the way `issue/` does: its `index.ts` dispatches on
`argv[2]`. That's for subcommands that genuinely share code — `add` and `pick` share the project
prompt, the cancel handling and the `gh` wrapper. Two unrelated scripts get two folders.

## 🚀 Adding a script

A new script is a folder under `src/` with an `index.ts` entry point and a `README.md`, plus a line
in this package's `scripts` and a row in the table above. There is no barrel, and scripts don't
import each other directly. When a second folder needs something an existing one already has — as
`drift/` did, for `gh.ts`, `cache.ts` and `prompts.ts` — that piece moves into `shared/`, with a
line in both folders' README saying what they now share. `shared/` has no `index.ts` and isn't a
script itself; it's not listed in the table above for the same reason.

Entry points run straight with `node`, no build step and no `tsx`/`ts-node`: this repo's Node
engines range already strips types. Node's stripping does no resolution rewriting, so **internal
imports use the explicit `.ts` extension** — `./gh.ts`, not `./gh`.

## ✅ Tests

`test` still passes with `--passWithNoTests`, because most of what's here is prompts and `gh`
invocations — a spec can only assert those against a mock of itself. The exception is the rule:
real logic — a parser, a diff, a mapping — goes in its own file and gets a spec, per
[`writing-tests`](../../.claude/skills/writing-tests/SKILL.md). Today that's
[`issue/branch.ts`](./src/issue/branch.ts), which turns a typed title into a ref name, and
[`drift/detect.ts`](./src/drift/detect.ts), which turns a diff into a warn/don't-warn decision.

## 🔑 Requirements

`gh` installed and authenticated (`gh auth status`). Scripts shell out to it rather than calling the
GitHub API, so they inherit whatever account is already logged in instead of needing a token.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A script that isn't a one-shot CLI (a watcher, a server) | It doesn't belong here — `infrastructure/` gets its own project for it, the way [`translations`](../translations/README.md) has one |
| Running a script in CI | Workflows install with `--ignore-scripts`, which doesn't affect these (they're not lifecycle hooks), but `gh` in CI needs `GH_TOKEN` in the job env |
