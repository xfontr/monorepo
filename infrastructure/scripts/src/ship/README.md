# 🚀 ship

The other end of `pnpm issue:pick`: pick gets you a branch and an issue, ship gets your finished
commits onto `master` without a trip through the browser. It pushes the current branch, opens a PR
for it (or reuses one that's already open), arms GitHub's native auto-merge, then blocks until every
check on the PR concludes and prints which of the three ways that went.

```sh
pnpm issue:ship
```

There's no flag and no prompt — the branch you're on is the only input, same as a plain `git push`.

## 🗂 Structure

```
index.ts            hands main to run()
main.ts              the push → PR → auto-merge → watch → report sequence
adapters/git.ts      current branch, push
adapters/gh.ts       find or create the PR, arm auto-merge, watch checks, wait for the merge
domain/report.ts     turns (checks passed, merged) into the one line printed at the end
domain/checks.ts     recognizes gh's "no checks reported yet" message
```

## 🚦 Why this doesn't just call `gh pr merge`

Merging outright the moment `issue:ship` runs would merge broken code the instant CI happens to be
slow to notice it — the whole point is to gate on green, not skip the gate. `gh pr merge --auto`
queues the merge with GitHub itself rather than merging here: it fires the moment the PR's required
checks (there are none configured on this repo today — see the root README's git conventions) and
any required reviews (also none) are satisfied, which today reduces to "the moment checks pass."
`gh pr checks --watch` is a second, unrelated call that blocks *this* process so the terminal has
something to report — arming auto-merge and watching checks would both work if only one of them ran,
but only doing both gets you an unattended merge *and* a "here's what happened" line instead of
picking one.

## 🔁 Reusing an existing PR

`prUrlForBranch` in [`adapters/gh.ts`](./adapters/gh.ts) tries `gh pr view <branch>` first and only
calls `gh pr create --fill` when that comes back with nothing. That's what makes re-running
`issue:ship` after a failed check the same command as running it the first time: a second `gh pr
create` on a branch that already has one just errors.

## 📛 The merge method is a constant, not a flag

`MERGE_METHOD` in [`main.ts`](./main.ts) is `"merge"`, matching this repo's
`viewerDefaultMergeMethod` (`gh repo view --json viewerDefaultMergeMethod`). A flag would need
setting on every run to matter; a constant is one line to change the day this repo switches to
squash or rebase merges instead.

## ⏳ Two races this waits out instead of misreporting

`watchChecks` and `waitForMerge` in [`adapters/gh.ts`](./adapters/gh.ts) each poll a bounded window
rather than trusting a single `gh` call, because a single call catches two different GitHub delays
mid-flight and reports them as if they were done:

- **Right after `push`**, GitHub can take a while to attach even the *first* check run to the new
  commit — this repo alone fans a PR out to GH Actions, a second "PR metadata" workflow, two
  SonarCloud checks and four Netlify ones. `gh pr checks --watch` doesn't wait that out; it errors
  immediately with "no checks reported", indistinguishable from a genuine failing check by exit code
  alone. [`domain/checks.ts`](./domain/checks.ts) names that one message so `watchChecks` retries
  for up to a minute instead of reporting it as "a check failed" — a real failure never carries that
  message, so it still returns on the first try.
- **Right after checks conclude**, `gh pr merge --auto` has only *queued* the merge — GitHub takes a
  further beat to actually execute it. Reading the PR's state exactly once at that instant routinely
  still sees `"OPEN"`, which is what used to skip the checkout below even on a run that genuinely
  passed. `waitForMerge` polls for up to 45s before giving up and reporting "merge queued" instead.

Both budgets are generous rather than tight on purpose: reporting a false failure (or skipping the
checkout) costs more than the script blocking a few extra seconds on a run that was always going to
succeed.

## ✅ Tests

[`domain/report.spec.ts`](./domain/report.spec.ts) covers `shipMessage`, and
[`domain/checks.spec.ts`](./domain/checks.spec.ts) covers `isMissingChecksError` — the only real
logic here, per [`writing-tests`](../../../../.claude/skills/writing-tests/SKILL.md). Everything
else is a `git` or `gh` call with nothing to assert but a mock of itself.

## 🔑 Requirements

`gh` authenticated, write access to push the branch and open a PR, and the repo's *Allow auto-merge*
setting on (`gh api repos/<owner>/<repo> --jq .allow_auto_merge`) — without it `gh pr merge --auto`
fails outright and the run stops with the branch pushed and a PR open but nothing armed to merge it.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Gating on required status checks instead of "all checks, if any" | Needs a branch protection rule naming the required job(s) on `master`; today there's none, so `gh pr merge --auto` fires the instant the PR is mergeable at all |
| Running from a dirty working tree | Not guarded — a push only sends committed commits, so uncommitted changes are silently left out, same as a plain `git push` |
| Choosing the merge method per run | `MERGE_METHOD` in `main.ts` is a constant; a `--squash`/`--rebase` flag would read it through `flag()` from [`shared/cli.ts`](../shared/cli.ts) instead |
| A PR that needs a review before merging | `gh pr merge --auto` would just queue behind that too — this script doesn't request one or wait on it specially, it only watches checks |
| Retrying a merge GitHub rejected for being out of date with `master` | `gh pr merge --auto` re-arms on the next push to the branch; there's no in-script retry loop for a merge conflict or an out-of-date base |
