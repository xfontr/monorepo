# 📚 drift

A cheap, non-AI proxy for "did this change make some project's docs wrong": if a push changes a
project's docs recently, or changes very little, it stays quiet; otherwise it warns and offers to
file an issue. It only ever nudges — nothing here fails a push or blocks anything.

```sh
pnpm docs:drift                                        # against merge-base(HEAD, master)..HEAD
DOCS_DRIFT_BASE=<sha> DOCS_DRIFT_HEAD=<sha> pnpm docs:drift   # against an explicit range
```

`.husky/pre-push` runs it with `DOCS_DRIFT_BASE`/`DOCS_DRIFT_HEAD` set to the exact range being
pushed, so a manual run and the hook's run answer the same question two different ways: manually,
"what would this warn about if I pushed now"; from the hook, "what does this push actually contain".

## 🗂 Structure

```
index.ts     the range, the per-project loop, the prompt and gh issue create
git.ts       the git calls — merge-base, changed files, a project's diff stats and diff text, last markdown commit
detect.ts    the warn/don't-warn decision — the only real logic here
```

`createIssue`, the file cache and `orExit` come from [`../shared/`](../shared/README.md) — see that
folder's note in the [top-level README](../../README.md#-adding-a-script).

## 🚦 Why a project gets warned

Only projects the current range actually touches are considered at all — `git diff --name-only`
grouped by the first two path segments (`packages/<name>`, `apps/<name>`,
`infrastructure/<name>`), per the `new-package` skill's layout. Within that set, either condition
is enough on its own:

| Condition | Threshold | Why |
| --- | --- | --- |
| Docs are stale | No markdown file under the project has been touched in ≥4 months (`STALE_DOCS_MS` in [`detect.ts`](./detect.ts)) | A small change landing on docs nobody's looked at in a while is still worth a glance |
| The change is big | ≥200 changed lines, ≥8 changed files, or any rename (`BIG_CHANGE_LINES`/`BIG_CHANGE_FILES` in [`detect.ts`](./detect.ts)) | A big change with same-week docs is still worth a look — size alone is signal regardless of doc age |

Both are proxies, not a semantic check — a 200-line refactor with no behavior change warns the same
as a 200-line rewrite that actually invalidates the README. See
[0040](../../../../docs/decisions/0040-docs-drift-detection.md) for where that ceiling sits and
what's deferred past it.

## 🔁 Not re-warning for the same diff

Each project's fingerprint — a hash of `git diff base..head -- <root>`'s full text — is stored under
the `drift-fingerprints` cache key via `../shared/cache.ts`'s `readCache`/`writeCache`, the same file
cache `issue/` uses for projects and labels. It's written *before* the prompt runs, so a Ctrl+C
mid-run still counts that diff as seen. A second push with nothing new for a project reads the same
fingerprint and skips it entirely, warned or not, said yes or no. The trade-off is the same one
`issue/README.md` already names for its own cache: `node_modules/.cache` is per-clone and a fresh
`pnpm install` clears it for free, so a clean clone can re-warn once for changes that already got a
"no" on another machine.

## 📋 Filing the issue

No project picker, no label, no description — `title: "Address documentation drift for <Name>"`,
`body: ""`, and a hardcoded `project: "Monorepo"` (see `PROJECT` in [`index.ts`](./index.ts)). This
is deliberately narrower than [`pnpm issue:add`](../issue/README.md#-pnpm-issueadd): the issue exists
to put the project back in front of a human, not to pre-judge what changed, so whoever picks it up
reads the diff themselves.

`<Name>` is the project root's last path segment, kebab-case turned to Title Case — `apps/huella-legal`
becomes `Huella Legal` (`displayName` in [`detect.ts`](./detect.ts)).

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Duplicate issues across machines or after a cache wipe | No check against already-open issues before filing — `createIssue` just files. Worth it once this becomes a two-person repo; a solo one notices a duplicate immediately |
| A push touching more than one ref at once | `.husky/pre-push`'s ref loop keeps only the last `$BASE`/`$LOCAL_SHA` it saw, so a multi-ref `git push` only checks the last one. Rare enough on a solo repo not to be worth threading an array through the hook yet |
| Tuning the thresholds from real noise | `STALE_DOCS_MS`, `BIG_CHANGE_LINES`, `BIG_CHANGE_FILES` are constants in `detect.ts`, picked without data. Move them once a few months of real warnings say they're wrong in either direction |
| Running in CI | Deliberately not — filing an issue and prompting for confirmation both need a human on the other end, which CI doesn't have. `.husky/pre-push` is the only caller |
