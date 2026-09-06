---
name: repo-review
description: Score the whole repository against the seven scorecards in docs/reviews/SCORECARDS.md and write the result to docs/reviews/. Use when asked to rate, score, grade, audit or review the repo, the codebase, the architecture as a whole, or "how good is this project".
---

# Reviewing the repo

Seven cards, one weighted total, one file under [`docs/reviews/`](../../../docs/reviews/README.md).
The rubric is not in this skill — it lives in
[`SCORECARDS.md`](../../../docs/reviews/SCORECARDS.md) so that a human can argue with it without
reading a skill. Read that file before scoring anything; this one is only the process.

Two things this is not. It is **not a code review** of the current diff — use `/code-review` for
that. And it **changes nothing**: no fixes, no refactors, no doc edits, however tempting a finding
is. A review that edits what it measures is worthless as a baseline, and reviews only earn their
keep as a series.

## 1. Collect the facts first

```sh
.claude/skills/repo-review/collect-facts.sh
```

Roughly two minutes — it runs `lint`, `typecheck`, `test` and `build` across **every** project (not
affected: a review scores the tree, not the diff) and prints the counts each card leans on. Add
`--quick` to skip the targets, but only on a re-run; a Tooling & DX score with no target results is
a guess.

Its output opens with the guard. Act on it before doing anything else:

| The output says | Do this |
| --- | --- |
| Nothing committed since the last review | Stop and ask. The tree is identical, so a new review can only differ in judgement — offer to re-read the last one instead |
| The last review is under 7 days old | Ask before continuing, unless something large landed in between |
| Untracked source files | Say so. Every count comes from `git ls-files`/`git grep`, so untracked work is invisible to all of them |
| Not on `master`, or a dirty tree | Continue, and say it in the review's opening line — the commit column can't describe a tree that isn't committed |

## 2. Score the cards

One agent per card, all seven launched in the same message so they run concurrently. A single pass
over seven cards' worth of a whole monorepo either runs out of attention or scores from memory of
the READMEs, which is exactly the failure this rubric is built to prevent.

Launch all seven as `subagent_type: repo-review-card` (`.claude/agents/repo-review-card.md`). That
agent has `Read`/`Grep`/`Glob` only — no Bash, no Edit/Write. Seven agents let loose with Bash on a
whole monorepo each improvise their own `find`/`wc`/`grep -r`/ad-hoc lint runs, which don't match
the settings.json allow-list and land as a permission prompt; seven of them concurrently turns a
review into a wall of simultaneous prompts. There's nothing to shell out for anyway — the
fact-collector output already has every count and target result a card needs.

Give each agent the card's section from `SCORECARDS.md` verbatim, plus:

```
Read docs/reviews/SCORECARDS.md — the scale, the calibration rules and the "<card>" card.
Score only that card. Read the actual code, not just the READMEs: a claim in a README is
evidence about the docs card, never about this one.
```

Attach the fact-collector output to every agent so seven agents don't re-run the same counts.

## 3. Reconcile, then compute

Agents inflate. Before accepting a score, check it against the calibration rules — every one of
them exists because a previous review broke it:

- An uncited finding gets dropped, not softened.
- A 5 with no named breakage-the-tooling-catches becomes a 4.
- A card whose evidence is all README claims gets re-scored from the code.
- Two agents citing the same finding on different cards means one of them is on the wrong card —
  the same fact must not cost points twice.

Then compute the total yourself: `Σ(score × weight) / 100`, one decimal. Never carry an agent's
arithmetic, and never nudge a card to make the total feel right.

## 4. Write it

Copy [`TEMPLATE.md`](../../../docs/reviews/TEMPLATE.md) to
`docs/reviews/<YYYY-MM-DD>-<short sha>.md` using the date and HEAD from the fact collector. Fill Δ
against the previous review's row, or `—` on the first. Follow `house-docs`: prose that says why the
score is what it is, tables for the findings, no closing summary.

The `## 🧮 Scores` table is machine-read, not only human-read: `@monorepo/tech-docs`'s scorecards page
parses it straight out of the file. Keep it byte-for-byte the shape `TEMPLATE.md` has — the same seven
cards in the same order, each a bare `n/5` in the Score column, the total as `**n.n/5**` in a
`**Total**` row. Never rename a card, reorder one, or write a score as anything but `n/5` (no `n/10`,
no bare `n`, no card split in two). A malformed table degrades the dashboard silently — it just shows
fewer cards — so there is no error to notice at write time; this instruction is the only guard until
someone breaks it.

## 5. Append the history row

Add the row to the table in [`docs/reviews/README.md`](../../../docs/reviews/README.md) — ratings
only, in the same pass.
[`check-invariants.sh`](../../hooks/check-invariants.sh) fails the write of a review file whose row
isn't there yet, so this step is not optional and the reminder clears itself once the row exists.

## 6. Report, then stop

Give the user the totals table and the "what would move the total" rows. Offer to file the top
findings as issues (`pnpm issue:add`, or the `github-issue` skill) and to turn any architectural
fork the review exposed into a [spike report](../spike-report/SKILL.md) — but file nothing
without being asked. The review is the deliverable.
