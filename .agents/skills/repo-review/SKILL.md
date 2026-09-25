---
name: repo-review
description: Judge the whole repository as a system — architecture, code, tests, tooling, docs, agent setup, process — against the seven cards in docs/reviews/SCORECARDS.md, and write a dated review to docs/reviews/. Use when asked to rate, score, grade or review the repo, the codebase or the architecture as a whole, or "how good is this project". Finding the bugs in one project is `audit-report`; the current diff is `/code-review`.
---

# Reviewing the repo

A review is a senior engineer's macro judgement of the repository, written down and scored: what
the repo is, what it's good at, what's wrong with it, and where it's heading. The rubric lives in
[`SCORECARDS.md`](../../../docs/reviews/SCORECARDS.md). Read it before anything else, and especially
its ⚖️ How to judge section, which is what separates a review from a bug list.

A review **changes nothing**: no fixes, no refactors, no doc edits. A measurement that edits what it
measures is worthless as a baseline.

## 1. Collect the facts

```sh
.agents/skills/repo-review/collect-facts.sh
```

This takes a few minutes: it runs `lint`, `typecheck`, `test` and `build` across every project and
prints sizes, ratios and activity since the last review. The figures are **context for judgement,
not triggers**: nothing in them moves a score by itself. Pass `--quick` only on a re-run.

Act on the guard at the top first:

| The output says | Do this |
| --- | --- |
| Nothing committed since the last review | Stop and ask; offer to re-read the last one instead |
| The last review is under 7 days old | Ask before continuing, unless something large landed |
| Untracked source files | Say so in the review; every count is blind to them |
| Not on `master`, or a dirty tree | Continue, and say it in the review's opening line |

If a target fails, find out why before treating it as a finding. A stale local install is not a
broken repo.

## 2. Gather evidence per card

Launch seven [`repo-review-card`](../../../.claude/agents/repo-review-card.md) agents in one message,
one per card, so they run concurrently. Codex uses seven general subagents with the same prompt.
Give each one:

```
Read docs/reviews/SCORECARDS.md, in full, then assess the "<card>" card. The facts are attached.
Read the code and the history, not just the READMEs. Previous review: <file>.
```

Attach the fact-collector output, plus the last review's recommendations so trajectory can be
judged. If the agents fail on a rate limit, re-run them with a model override and say so in the
review's opening line.

The agents gather evidence and propose; they don't decide. Each returns the shape the card agent
defines: an assessment, strengths, weaknesses as patterns, over- and under-engineering, low-hanging
fruit, and a proposed score with its steelman.

## 3. Form the thesis, then the scores

This is your job, not the agents'. Read the seven reports together, and read enough of the repo
yourself to have a view of your own.

1. **Write the big picture first.** What this repo is, what it's good at, what's really wrong, and
   whether its effort is going where the risk is. The scores follow from this thesis; they don't
   produce it.
2. **Find the root causes.** Group the agents' findings by project and by cause. A problem that
   shows up on four cards is usually one fact about the repo, so say what it is. Let a root cause
   lower each card it genuinely harms, and say so where it does, but not a card that only happens
   to mention it.
3. **Test every proposed score against the anchors.** Keep the agent's number only if the steelman
   holds up. Agents inflate on familiar strengths and deflate on vivid single defects: correct
   both. A score that rests on one bug is wrong by definition, so move the bug to the
   recommendations and rescore on the pattern.
4. **Compute the total yourself.** `Σ(score × weight) / 100`, one decimal. If it contradicts the
   thesis, a card is wrong: fix the card, never the arithmetic.

## 4. Write it

Copy [`TEMPLATE.md`](../../../docs/reviews/TEMPLATE.md) to `docs/reviews/<YYYY-MM-DD>-<short sha>.md`,
with the date and HEAD from the fact collector. The method version in the opening line comes from
[`METHOD.md`](../../../docs/reviews/METHOD.md). Fill Δ against the previous review's row, and say
when it crosses a method version. Follow `house-docs`.

The `## 🧮 Scores` table is machine-read: `@monorepo/developer-portal` parses it. Keep the shape
`TEMPLATE.md` has, byte for byte: the same seven cards in the same order, a bare `n/5` in the Score
column, and the total as `**n.n/5**` in a `**Total**` row. A malformed table silently shows fewer
cards on the dashboard.

Every section of the template gets filled. What's really wrong, over- and under-engineering, and
the low-hanging fruit are the parts the reader acts on, so none of them is optional.

## 5. Append the history row

Add the row to the table in [`docs/reviews/README.md`](../../../docs/reviews/README.md) in the same pass.
[`check-invariants.sh`](../../../.claude/hooks/check-invariants.sh) flags a review file whose row is
missing.

## 6. Report, then stop

Give the user the scores, the thesis in a paragraph, and the top of what's really wrong. Offer to
file the recommendations as issues, to run [`audit-report`](../audit-report/SKILL.md) on any project
whose code-level problems the review only sampled, and to turn an architectural fork into a
[decision report](../decision-report/SKILL.md). File nothing without being asked.
