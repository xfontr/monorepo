# 📊 Reviews

A dated, scored read of the whole repository. One file per review, named
`YYYY-MM-DD-<short sha>.md` — the day it was written and the commit it was written against, because
a review measures one tree state and starts expiring the moment that state changes.

A review is not a backlog and not a refactor plan. It scores what is here against
[`SCORECARDS.md`](./SCORECARDS.md), cites the evidence behind every score, and stops. Findings worth
acting on leave as issues (`pnpm issue:add`); architectural forks it exposes leave as
[decision reports](../decisions/README.md). **Nothing gets fixed inside the review itself** — a
measurement that changes what it measures is worth nothing next quarter, and a review that turns
into a refactor never gets finished.

The [`repo-review`](../../.agents/skills/repo-review/SKILL.md) skill writes these: it collects the
facts, scores each card, writes the file and appends the row below in one pass.

## 🗂 Structure

| File | What it is |
| --- | --- |
| [`SCORECARDS.md`](./SCORECARDS.md) | The seven cards, the 1–5 anchors and the weights — the rubric, and the only copy of it |
| [`METHOD.md`](./METHOD.md) | The method version, and the four artifacts it covers |
| [`TEMPLATE.md`](./TEMPLATE.md) | Copy this to start a review |
| `YYYY-MM-DD-<sha>.md` | One review |

Every card is an integer 1–5 and the total is their weighted mean to one decimal, so a total is
only comparable to another total from the same **method** version — which covers the rubric, the
skill, the card agent and the fact collector, because all four decide how a number comes out.
[`METHOD.md`](./METHOD.md) carries it, `check-docs` enforces it, and the last column below records
which version produced each row.

## 📈 History

Ratings only — the reasoning, the citations and the evidence stay in the review file. Adding a
review means adding its row here in the same pass;
[`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) refuses to let the write pass
quietly until it exists.

| Review | Commit | Arch | Impl | Test | DX | Docs | AI | Proc | Total | Method |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [2026-09-04](./2026-09-04-c1025f3.md) | `c1025f3` | 5 | 4 | 4 | 4 | 4 | 3 | 4 | 4.1 | v1 |
| [2026-09-05](./2026-09-05-abcb17d.md) | `abcb17d` | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4.2 | v1 |
| [2026-09-10](./2026-09-10-bfd6da2.md) | `bfd6da2` | 5 | 5 | 4 | 5 | 2 | 3 | 5 | 4.4 | v1 |
| [2026-09-15](./2026-09-15-bfd6da2.md) | `bfd6da2` | 5 | 5 | 3 | 5 | 2 | 3 | 5 | 4.2 | v2 |
| [2026-09-15](./2026-09-15-aea557e.md) | `aea557e` | 5 | 4 | 4 | 3 | 2 | 3 | 5 | 3.9 | v2 |

Rows three and four are **the same tree under two methods**, which is what a version bump buys: the
0.2 between them is the method moving, not the repo. Compare 4.4 against 4.2 and 4.2 against
whatever comes next — never 4.2 against 4.4 as if the repo had regressed in five days.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Reviews of one area rather than the whole tree | A partial review can't produce a comparable total — it would need its own filename shape (`YYYY-MM-DD-<sha>-<card>.md`) and a row that leaves the other columns blank, not a total computed from three cards |
| A review that reverses an earlier one's finding | Nothing to do: reviews are dated snapshots, so the newer row simply disagrees. Don't edit a past review to keep the history tidy |
| A third row at a sha that already has two | Two rows share a commit only across a method bump, and only the most recent version's row is ever re-scored. A third would mean re-scoring a re-score, which measures nothing — bump, re-score the newest row's commit, and leave every older row where it is |
| Trends worth charting | The history table is the data; a chart needs six or seven rows before it says anything a column of numbers doesn't |
| Reviewing a tree other than `master` | The commit column already records what was scored, but a review of a feature branch scores work in progress — say so in the review's opening line, or don't write it |
