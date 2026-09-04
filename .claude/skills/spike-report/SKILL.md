---
name: spike-report
description: Write up a resolved spike as a spike report under docs/spikes/. Use when a spike issue has its answer and the outcome needs to survive after the issue closes.
---

# Writing a spike report

A spike issue holds the question; `docs/spikes/` holds the answer. This skill turns a resolved
spike into a spike report.

## 1. Gather what the spike settled

Read the issue for its framing — reuse it rather than re-deriving it:

```sh
gh issue view <n>
```

The `Decision needed` / `Question` fields (see the `github-issue` skill) become this report's
Context. Ask the user for what the issue doesn't already say: the actual result, the options that
were on the table and why each lost, and the consequence of the call.

## 2. Write the file

Copy [`docs/spikes/TEMPLATE.md`](../../../docs/spikes/TEMPLATE.md) to
`docs/spikes/<issue-number, zero-padded to 4 digits>-<slug>.md` and fill in its four sections —
[`docs/spikes/README.md`](../../../docs/spikes/README.md) says what each is for. Keep it as tight
as the shortest sections in the `ui`/`content` package READMEs: this is a report of the outcome,
not a design doc arguing for it.

## 3. Close the loop

**Never comment on the issue.** The report is reachable without one: its filename carries the issue
number, and the PR that lands it references the issue. An issue comment adds a notification and a
second copy of the answer that can drift from the file.

Closing is outward-facing, so show the user before running it, and only once they confirm the spike
is fully resolved — a spike report can exist for a spike whose issue stays open for follow-up work.
Usually the PR closes the issue anyway, which makes this unnecessary:

```sh
gh issue close <n>
```
