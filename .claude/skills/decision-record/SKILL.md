---
name: decision-record
description: Write up a resolved spike as a decision record under docs/decisions/, then link it back to the spike issue. Use when a spike issue has its answer and the outcome needs to survive after the issue closes.
---

# Writing a decision record

A spike issue holds the question; `docs/decisions/` holds the answer. This skill turns a resolved
spike into a decision record and closes the loop with the issue that raised it.

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

## 3. Link it back

Two outward-facing actions — show the user the comment body and the close before running either:

```sh
gh issue comment <n> --body "Decided in docs/decisions/<file>."
gh issue close <n>
```

Only close the issue once the user confirms the spike is fully resolved — a decision record can
exist for a spike whose issue stays open for follow-up work.
