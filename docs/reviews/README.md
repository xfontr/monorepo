# 📊 Reviews

A dated, scored read of the whole repository. One file per review, named
`YYYY-MM-DD-<short sha>.md` — the day it was written and the commit it was written against, because
a review measures one tree state and starts expiring the moment that state changes.

A review is not a backlog and not a refactor plan. It scores what is here against
[`SCORECARDS.md`](./SCORECARDS.md), cites the evidence behind every score, and stops. Findings worth
acting on leave as issues (`pnpm issue:add`); architectural forks it exposes leave as
[spike reports](../spikes/README.md). **Nothing gets fixed inside the review itself** — a
measurement that changes what it measures is worth nothing next quarter, and a review that turns
into a refactor never gets finished.

The [`repo-review`](../../.claude/skills/repo-review/SKILL.md) skill writes these: it collects the
facts, scores each card, writes the file and appends the row below in one pass.

## 🗂 Structure

| File | What it is |
| --- | --- |
| [`SCORECARDS.md`](./SCORECARDS.md) | The seven cards, the 1–5 anchors and the weights — the rubric, and the only copy of it |
| [`TEMPLATE.md`](./TEMPLATE.md) | Copy this to start a review |
| `YYYY-MM-DD-<sha>.md` | One review |

Every card is an integer 1–5 and the total is their weighted mean to one decimal, so a total is
only comparable to another total from the same rubric version. `SCORECARDS.md` carries that version
and this table records it.

## 📈 History

Ratings only — the reasoning, the citations and the evidence stay in the review file. Adding a
review means adding its row here in the same pass;
[`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) refuses to let the write pass
quietly until it exists.

| Review | Commit | Arch | Impl | Test | DX | Docs | AI | Proc | Total | Rubric |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [2026-09-04](./2026-09-04-c1025f3.md) | `c1025f3` | 5 | 4 | 4 | 4 | 4 | 3 | 4 | 4.1 | v1 |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Reviews of one area rather than the whole tree | A partial review can't produce a comparable total — it would need its own filename shape (`YYYY-MM-DD-<sha>-<card>.md`) and a row that leaves the other columns blank, not a total computed from three cards |
| A review that reverses an earlier one's finding | Nothing to do: reviews are dated snapshots, so the newer row simply disagrees. Don't edit a past review to keep the history tidy |
| Trends worth charting | The history table is the data; a chart needs six or seven rows before it says anything a column of numbers doesn't |
| Reviewing a tree other than `master` | The commit column already records what was scored, but a review of a feature branch scores work in progress — say so in the review's opening line, or don't write it |
