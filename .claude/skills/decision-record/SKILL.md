---
name: decision-record
description: Write up a resolved spike as a decision record under docs/decisions/. Use when a spike issue has its answer and the outcome needs to survive after the issue closes.
---

# Writing a decision record

A spike issue holds the question; `docs/decisions/` holds the answer. This skill turns a resolved
spike into a decision record.

## 1. Gather what the spike settled

Read the issue for its framing — reuse it rather than re-deriving it:

```sh
gh issue view <n>
```

The `Decision needed` / `Question` fields (see the `github-issue` skill) become this record's
Context. Ask the user for what the issue doesn't already say: the actual decision, the options
that were on the table and why each lost, and the consequence of the call.

## 2. Write the file

Copy [`docs/decisions/TEMPLATE.md`](../../../docs/decisions/TEMPLATE.md) to
`docs/decisions/<issue-number, zero-padded to 4 digits>-<slug>.md` and fill in its four sections —
[`docs/decisions/README.md`](../../../docs/decisions/README.md) says what each is for. Keep it as
tight as the shortest sections in the `ui`/`content` package READMEs: this is a record of the
outcome, not a design doc arguing for it.

## 3. Close the loop

**Never comment on the issue.** The record is reachable without one: its filename carries the issue
number, and the PR that lands it references the issue. An issue comment adds a notification and a
second copy of the answer that can drift from the file.

Closing is outward-facing, so show the user before running it, and only once they confirm the spike
is fully resolved — a decision record can exist for a spike whose issue stays open for follow-up
work. Usually the PR closes the issue anyway, which makes this unnecessary:

```sh
gh issue close <n>
```
