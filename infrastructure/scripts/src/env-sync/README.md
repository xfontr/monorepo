# 🔑 env-sync

Keeps every `.env` laid out like the `.env.example` beside it: same order, same comments, every
key present. It is plain parsing with no AI in the loop, and it never prints a value, so neither a
hook log nor an agent's shell ever shows one.

```sh
pnpm env:sync           # sync every .env with its .env.example, creating missing ones
pnpm env:sync --check   # say what would change and exit 1, writing nothing
```

It covers every tracked or new, unignored `.env.example` in the repo (`git ls-files`), so a new app
with an example is picked up with no list to update. Its partner is always the `.env` in the same
directory and nothing else. `.env.local` and the others are left alone.

## 🗂 Structure

```
index.ts            hands main to run()
main.ts             one pass per example: parse both, merge, verify, write or report
adapters/files.ts   finding the examples, reading, and the backup-then-rename write
domain/envFile.ts   the line parser, which refuses anything it can't classify
domain/sync.ts      the merge, the lost-data check and the key-only summary
```

## 🔀 What a sync does

The example decides the layout, and `.env` supplies the values:

| In `.env` | Ends up |
| --- | --- |
| A key the example has | In the example's position, with the `.env` value byte for byte, including `export`, quotes, inline comments and multi-line values |
| A key the example only has commented out (`# NUXT_MAIL_FROM=`) | In that commented line's place, uncommented, which is what the example's `OVERRIDES` block asks for |
| A key the example lacks | Under a `# Not in .env.example` block at the end, in its original order, named in the output so you can delete it by hand |
| A commented-out assignment (`# KEY=old-value`) the example doesn't have | Kept as data, above its key's slot, or in the trailing block when the example has no such key |
| A prose comment the example doesn't have | Dropped in favour of the example's comments. The output counts them, and the backup still has them |
| Nothing, for a key the example sets | Added at the example's position with the example's default |

A missing `.env` is created as a copy of the example with mode `600`. Running the sync again on its
own output changes nothing, so the hooks can run it as often as they like.

## 🛡 Why it can't lose a file

| Guard | Where |
| --- | --- |
| A file it can't parse (a key set twice, a quote that never closes, CRLF endings, a line that isn't `KEY=value`, a comment or blank) is reported and left as it is | [`envFile.ts`](./domain/envFile.ts) |
| The result is parsed again before writing, and any value that changed or vanished, any commented assignment that went, or any example key still missing aborts that file | `lostData` in [`sync.ts`](./domain/sync.ts) |
| Every rewrite first copies the old file to `.env.backup-<UTC timestamp>` with the same mode. Backups are never pruned, and `.env.*` in `.gitignore` keeps them out of git | [`files.ts`](./adapters/files.ts) |
| The new content goes to a temporary file that is then renamed over `.env`, so an interrupted run leaves either the old file or the new one, never half of each. A symlinked `.env` is written through, so the link survives | [`files.ts`](./adapters/files.ts) |

A file left untouched makes the command exit 1, but the others still sync.

## 🪝 When it runs on its own

| Trigger | Condition |
| --- | --- |
| `pnpm quick-start` | Always, so a new clone gets its `.env` files before anything reads them |
| [`pre-commit`](../../../../.husky/pre-commit) | The commit stages a `.env.example` change. It never blocks the commit, since `.env` is not part of it |
| [`post-checkout`](../../../../.husky/post-checkout) and [`post-merge`](../../../../.husky/post-merge) | The branch switch or merge changed a `.env.example`. Never blocks |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| `git pull --rebase` bringing in a new example | Rebase fires `post-rewrite`, not `post-merge`, so nothing syncs. Add the same three lines to a `.husky/post-rewrite`, diffing `ORIG_HEAD` against `HEAD` |
| Syncing `.env.local` or `.env.production` too | `main.ts` hard-codes the one partner. A list of sibling names would do, but `.env.backup-*` must never be on it |
| Backups piling up | Nothing prunes them, deliberately. A `--prune` that keeps the last few would be the first code here that deletes a file, so it waits until the clutter is real |
| Backups copied into worktrees | [`worktree:prepare`](../worktree/README.md) copies every `.env.*`, backups included. Excluding `.env.backup-*` in its `isEnvFile` is one condition |
| CRLF files | Refused rather than guessed at. Supporting them means carrying each file's line ending through to `render` |
| The `KEY: value` form dotenv also accepts | Refused as unparseable, so a file using it is never rewritten. It would be one more pattern in `envFile.ts` |
