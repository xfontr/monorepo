# 🌳 worktree

Gets a linked git worktree ready for its first `lint`, `test` or `dev`: it copies the env files git
ignores and runs the install CI runs. Wherever the worktree came from, a fresh one has neither, and
Claude Code creates them under `.claude/worktrees/` for every isolated agent.

```sh
pnpm worktree:prepare .claude/worktrees/agent-a1     # relative to where you typed it
pnpm worktree:prepare                                # lists linked worktrees with no node_modules
```

Run it from a checkout that's already installed. A fresh worktree can't run it on itself: every
script here imports `@clack/prompts`, which isn't there yet.

## 🗂 Structure

```
index.ts               hands main to run()
main.ts                resolve the path, copy env files, install, report
adapters/git.ts        git worktree list, the ignored env files of a checkout
adapters/files.ts      copy-if-missing, the node_modules probe, realpath
adapters/pnpm.ts       pnpm install --frozen-lockfile --ignore-scripts in the worktree
domain/worktree.ts     the porcelain parser and which paths count as env files
```

## 📋 The steps

| Step | Why |
| --- | --- |
| Find the path in `git worktree list` | Refuses a directory that isn't a linked worktree, so it never installs over the main checkout |
| Copy `.env` and `.env.*` from the main checkout | They're git-ignored, so a worktree starts without them. `.env.example` is tracked, so it's never listed; an existing file is never overwritten |
| `pnpm install --frozen-lockfile --ignore-scripts` | The same install every CI workflow runs. The pnpm store is shared, so it takes seconds |

There's no `nuxi prepare`. The `nuxt-prepare` edge in [`nx.json`](../../../../nx.json) and the
Vitest presets' `prepareNuxt.mjs` already generate `.nuxt` before `lint`, `typecheck` and `test`,
and a fresh worktree lints `@monorepo/huella-legal` cleanly without it.

Git hooks need nothing either. `core.hooksPath` sits in the shared `.git/config` as an absolute
path to the main checkout's `.husky/_`, so a worktree runs the main checkout's copy of the hooks.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Creating the worktree too | `issue:pick <n> --worktree` would run `git worktree add` then this. Deferred while Claude Code's own `EnterWorktree` is the usual creator |
| Preparing every unprepared worktree at once | A loop over the listing that the no-argument form prints. Left out because Claude Code keeps finished agent worktrees around, and installing into all of them is rarely wanted |
| Running automatically | A Claude Code hook on worktree creation, if one exists for the version in use. Until then it's one command |
