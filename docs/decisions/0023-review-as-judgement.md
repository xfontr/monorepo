---
issue: 161
status: implemented
decision: accepted
---

# 🧭 A repo review is a scored judgement, not a set of predicates

## Context

[`0012`](./0012-review-rubric-validity.md) found that every cap in the rubric was a greppable
predicate, so the cards "measure what a grep can confirm". It kept the caps anyway, and added a
fifth one (the test-density floor). Its two alternatives were rejected on grounds that turned out
not to hold:
- **A judgement card** would, under the same citation rule, "produce the same surface findings".
- **Prose reviews** would lose the history table.

The 2026-09-23 review showed the cost. One `.catch` in a private dashboard's collector took
🧩 Implementation from 4 to 2 and the total down 0.40, the largest single movement in the review.
A missing `outputs` array had already taken ⚙️ Tooling from 5 to 3 in the review before. Meanwhile
everything a reader would actually act on sat outside the rubric, and the review file never saw it:
- over-engineering: the review machinery at about 3× the size of the product code it scores;
- markdown roughly equal to source;
- three accepted decisions reversed in code with no supersession.

## Result

A review is a senior engineer's macro judgement of the repository as a system, scored on seven
cards. Individual defects are [audits](../audits/README.md).

| Change | Where |
| --- | --- |
| Caps, the calibration-rule table and the density floor are gone. Each card is a set of questions, plus 5/3/1 anchors for its own dimension | [`docs/reviews/SCORECARDS.md`](../reviews/SCORECARDS.md) |
| New ⚖️ How to judge rules: judge the whole, not the worst line; proportionality is quality; enforcement is evidence, not the definition; unevenness and trajectory are findings; every score is steelmanned in both directions | `SCORECARDS.md` |
| The orchestrator writes the thesis first and sets scores last. A score resting on one bug is wrong by definition | [`.agents/skills/repo-review/SKILL.md`](../../.agents/skills/repo-review/SKILL.md) |
| Card agents are no longer isolated. They read git history, return strengths, weaknesses as patterns, over- and under-engineering, low-hanging fruit and trajectory, and carry no model pin | [`.claude/agents/repo-review-card.md`](../../.claude/agents/repo-review-card.md) |
| The template gains 🔭 The big picture, 🔥 What's really wrong, 🏗 Over- and under-engineering and 🍒 Low-hanging fruit. The Scores table shape is unchanged, so the portal parser is untouched | [`docs/reviews/TEMPLATE.md`](../reviews/TEMPLATE.md) |
| The collector reports sizes, markdown against code, agent-guidance and review-machinery weight, and per-project activity since the last review. It picks the previous review by date, with commit time breaking a tie. It labels nothing as a cap | [`collect-facts.sh`](../../.agents/skills/repo-review/collect-facts.sh) |

Three of `0012`'s four adopted changes survive unchanged:
- method versioning over all four artifacts;
- the re-score a bump owes;
- reading the card reports together before scoring, which is now the orchestrator's whole job.

Only the density floor is reversed, along with the predicate caps it sat among.

## Options considered

| Option | Why not |
| --- | --- |
| Keep the caps and scope them to shipped code and gates | Still lets one line decide a 20-weight card. It narrows where the arithmetic misfires, but the review stays a bug list |
| Weight caps by severity | Severity needs judgement, so this is judgement with extra bookkeeping. The steelman rule does the same job in one sentence |
| Drop scores, prose only | The history table is the one thing the series does well. The scores stay, as the summary of a judgement rather than its source |
| Keep "an uncited finding is dropped" | It deletes every synthesis, which is exactly the class of finding `0012` said the rubric was blind to. Replaced with "an impression with nothing behind it is dropped": representative evidence, not one line |

## Consequences

A score can now move on judgement, which is the point, and also the risk: two reviewers can
disagree. The guards against inflation are the steelman in both directions, anchors specific to
each card, the orchestrator testing every proposed score, and the history table exposing a drift
nobody can justify.

The v6 rows stay as they are. The bump owes a v7 re-score of `61b6f7f`, which under this method is
a fresh review rather than new caps applied to old evidence. Future method edits should be batched,
because every bump costs a full review.

Revisit if two consecutive reviews at different commits move a card by two or more points with no
change in the code the card is about. That would mean judgement is noise, not signal.

## Confirmation

- `pnpm review:version --check` passes at method v7.
- `SCORECARDS.md` contains no `Caps the card at` table.
- The portal's parser still reads every filed review, including v6 files:
  `scorecardShapeProblems(parseScoresTable(...))` returns `[]` for each.
- The first v7 review has every template section filled, and no card score rests on a single
  defect.
