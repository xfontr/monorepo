# 🚨 ci-failures

What failed on a PR and why, in one call: the check counts, every pending check by name, and each
failed GitHub Actions job cut down to its error lines. It's the step between "CI is red" and a fix,
written for an agent, which would otherwise page through `gh run view --log-failed` itself.

```sh
pnpm ci:failures          # the current branch's PR
pnpm ci:failures 287      # any PR, by number, URL or branch — whatever `gh pr checks` takes
```

It exits 1 while any check is failing. Pending checks don't fail it: they print their name and
state, so nobody fetches a log that doesn't exist yet.

## 🗂 Structure

```
index.ts               hands main to run()
main.ts                checks → group → one report per failed check
adapters/gh.ts         the PR title, its checks, a failed job's log
adapters/files.ts      saves the untrimmed log under the OS temp dir
domain/checks.ts       grouping by gh's buckets, the job id in a link, the log-prefix strip
```

## 🔗 Two kinds of check

A PR here fans out to GitHub Actions, SonarCloud, Netlify, Snyk, CodeRabbit and a "PR Lens" bot.
Only an Actions job has a log `gh` can fetch, and `jobOf` in
[`domain/checks.ts`](./domain/checks.ts) tells them apart by the `/actions/runs/<run>/job/<job>`
link. Every other failed check prints its name, its description and its link.

The Nx Cloud MCP tools give task-level detail too, but they only see Nx tasks, and half these
checks aren't Nx tasks.

## ✂️ Trimming the log

`--log-failed` returns the failing step whole, about 240 lines for a CI run with one failed spec.
`stripLogPrefix` drops the job, step and timestamp on each line and the `##[group]` markers. Then
`excerpt` in [`../shared/domain/logs.ts`](../shared/domain/logs.ts) keeps the error lines and their
context. GitHub sends the escape character as the two characters `^[`, which is why that helper's
ANSI pattern matches both spellings. The full stripped log is saved, and its path printed.

With `--json`, `gh pr checks` exits 0 whatever the checks concluded, so the exit code here comes
from the grouping, never from `gh`.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Waiting for pending checks | `issue:ship` already blocks on them. A `--watch` here would poll `gh pr checks` until nothing is pending, then report |
| SonarCloud's findings inline | Sonar's check run carries a summary in `output.summary` via `gh api repos/<owner>/<repo>/check-runs/<id>`. Worth it once a Sonar failure is common enough to need more than a link |
| Bot review comments | CodeRabbit and PR Lens post comments, not failures. A `pr:brief` that prints them belongs beside this, not inside it |
