---
issue: 106
status: implemented
decision: accepted
---

# 🧭 The review rubric measures what a grep can confirm, and nothing marks when it changes

## Context

Three reviews scored this repo 4.1 → 4.2 → 4.4 with 🧱 Architecture at 5/5 throughout, while
📚 Documentation swung 4 → 2 on a single stale command reference. The question raised was whether
those numbers mean anything: the rubric appears highly sensitive to individually verifiable surface
facts and blind to the architectural and quality judgements that carry 40 of its 100 points.

A second question followed from it. A total is only readable against the previous total, so a
reader needs to know whether a swing came from the repo or from a change to how reviews are
scored — and today nothing in the history table can tell them apart.

Issue #106 raised two questions and both are answered as reports, so this file shares its number
with [`0011-docs-system-enforcement.md`](./0011-docs-system-enforcement.md). That collision is
itself a finding of the sibling report.

## Result

**The rubric's prose is not the problem.** `SCORECARDS.md` asks the right questions — *"Is the
layering real, or only drawn?"*, *"What does the suite actually pin?"* — and its calibration rules
are strict in the right direction: `Evidence or it didn't happen`, `Assertion caps a card at 3`,
`A 5 needs an attempted breakage`, `Never score by feature count`.

**Four mechanisms below the prose select for surface findings.**

*Every cap is a greppable predicate.* All five Architecture caps resolve to a config or filename
check — tag tables disagreeing, an SDK import outside an adapter, boundaries set to warn, two
projects solving one problem twice. None can express "the code inside this boundary is
thoughtless." Implementation's caps are the same shape: `any`, a duplicated block, a single-caller
abstraction. A rubric whose ceilings are all mechanical cannot cap a card for poor judgement,
because poor judgement has no predicate.

*`Evidence or it didn't happen` filters toward the greppable.* A stale command cites cleanly as
`README.md:8`. "This package was written without supervision" cites nothing, so the reconcile step
— *"An uncited finding is dropped, not softened"* — deletes it. The rule that stops inflation also
deletes the findings that require judgement.

*Card isolation fragments cross-cutting problems.* `repo-review-card.md` instructs each of seven
agents to *"stay inside your card — a finding that belongs to another card is noise here."* An
architectural problem is cross-cutting by definition. A package that is undocumented, untested,
unbounded and duplicated presents one shard to each agent, and no agent sees the shape.

*The agents cannot execute.* `tools: Read, Grep, Glob`, `model: sonnet`, no Bash — deliberate, and
it means every card is scored from reading, against counts a shell script produced beforehand.

**The empirical test is the 2026-09-10 review against `apps/tech-docs`.** At that commit the app
held 4,201 lines across 40 source files against 5 spec files — the largest codebase in the
workspace and its thinnest test ratio. The review saw it: 🧪 Testing scored **4/5**, deducting two
named files (`tools/collect/metrics.ts`, `deps.ts`). In the same review, 📚 Documentation fell
**4 → 2** because that app's `README.md` said `pnpm tech-docs` where the script is
`pnpm dev tech-docs`.

One app, one review: a stale command string cost two points; an eight-to-one source-to-spec ratio
across the workspace's largest codebase cost one. The earlier two reviews are not evidence either
way — `apps/` held only `huella-legal` at `abcb17d`, and the app did not exist at `c1025f3`.

**The cards are not wrong within their own scope.** 🧱 Architecture's 5/5 in that review is earned
against its anchor: it cites `boundaries.ts` matching the README row for row,
`@nx/enforce-module-boundaries` set to `"error"`, a clean grep of `content`/`i18n`'s `core/` for
transport imports, and `apps/tech-docs/tools/lib/invariants.spec.ts:63-82` exercising
`compareTagTables` against a deliberately-drifted pair. That is a real attempted breakage.

That is the finding, not a counter to it. The card asks *"Is the layering real, or only drawn?"*
and answers it rigorously. Nothing in the rubric asks whether the code **inside** a correctly drawn
boundary was written with care, so a 4,201-line app can sit inside sound layering and cost the
review one point on one card.

**The scoring model amplifies this.** A cap is a ceiling, so one qualifying fact moves a card two
points regardless of everything else, and weights turn that into 0.2 on the total. A card cannot
move at all for a finding no cap covers. The history table then presents those totals as
comparable across reviews.

**A score cannot currently be attributed to the repo rather than to the method.** Four artifacts
decide a number, and one of them is versioned:

| Artifact | Decides | Versioned |
| --- | --- | --- |
| `docs/reviews/SCORECARDS.md` | Cards, anchors, caps, weights | Yes — `Rubric v1`, bumped by hand |
| `.claude/skills/repo-review/SKILL.md` | The reconcile rules that drop and re-score agent findings | No |
| `.claude/agents/repo-review-card.md` | Model, tool access, the stay-inside-your-card rule | No |
| `.claude/skills/repo-review/collect-facts.sh` | Every count each card is scored against | No |

A change to any of the last three moves scores while the history table still reads `v1`. Nothing
enforces the bump either: `check-invariants.sh` requires that a review **has** a history row, never
that its rubric column is honest. `SKILL.md` has been edited twice since v1 was set (`74c57c4`,
`112a414`), both times cosmetically, so the gap has not yet produced a wrong number — but the
changes below would.

**Four changes are adopted.** None of them closes the judgement gap above; the one candidate that
would have is rejected below, so every cap in the rubric stays a greppable predicate.

1. **A cross-card reconciliation pass**, run after the seven agents report and before the total is
   computed, whose only job is the findings no single card owns. Card isolation stays — it is what
   keeps the agents from triple-counting — but something has to read the seven sets together.
2. **A test-density floor that caps 🧪 Testing**, expressed per project rather than repo-wide. At
   40 source files to 5 specs, `apps/tech-docs` would have capped the card at 3 in the 2026-09-10
   review instead of costing it one point for two named files.
3. **The version covers the method, not the rubric document** — all four artifacts above — and the
   bump is enforced rather than remembered: a commit touching any of them without changing the
   version constant fails CI, the same shape as `docs:map --check`.
4. **A method bump re-scores the previous review's commit** under the new method, once, and that
   row lands in the history table as a calibration point.

## Options considered

| Option | Why not |
| --- | --- |
| Retune the caps and weights | Treats calibration as the fault. The Documentation swing was the rubric working as written, and so was Architecture's 5/5; the gap is that no rule fires on 4,201 lines written without supervision |
| Add a "code quality" or "supervision" card | A seventh judgement card scored by the same read-only isolated agent under the same citation rule produces the same surface findings under a new heading |
| A per-package attestation capping 🧩 Implementation — a named person recording that they read the package at a given commit | The one input a predicate could not satisfy, and the reason it is not implemented is who would sign it: this repo has **one collaborator**, so the row is its author vouching for their own work and certifies nothing a second reader would. It is also unmaintainable at nine projects — an attestation goes stale on that project's next commit, so the card would sit at its stale cap in perpetuity while nine rows get re-signed by hand — and no reviewing convention outside this repo asks for such a register, so a reader of the history table would have to be taught what the number means |
| Give the card agents Bash | Helps Testing and Tooling, which need counts. It does not help Architecture, whose gap is synthesis across cards, not measurement |
| Drop scoring, write prose reviews | Loses the one thing the current system does well — the history table is real data, and `Evidence or it didn't happen` is why these reviews are not flattery |
| Score per package instead of per repo | Would surface `tech-docs`, but `reviews/README.md` already rejects partial reviews: a per-area review cannot produce a comparable total |
| Keep versioning the rubric alone | Three of the four artifacts that decide a score carry no version, so a method change ships under the version of a document it didn't touch |
| Version by hand, as today | The bump is remembered, not enforced, and the reviewer bumping it is the one who just changed the method — the case where it is least likely to be noticed |
| Mark a version change and leave the numbers | Says the scores aren't comparable without saying by how much, which is the question a reader of the history table is actually asking |
| Trust the totals as-is | Each card is defensible on its own terms, but a total is read as a verdict on the repo, and no card's terms cover the code inside a sound boundary. `SCORECARDS.md` names the risk itself: *"A card that scores 5 everywhere has stopped measuring anything"* |

## Consequences

Cards 1 and 2 carry 40 points on the stated grounds that *"those two are what a rewrite costs"*.
Until a card can move on judgement, that weighting is asserted rather than earned, and every total
— the three existing ones and every one after this spike — should be read as a measure of surface
hygiene rather than of architecture. Rejecting the attestation leaves that gap open rather than
narrowing it, which is the price of not putting a person in the loop.

Change 4 buys the thing a version alone cannot: two rows at the same sha under two versions
separate the policy delta from the repo delta, which is what the history table is read for. It sits
in tension with `SCORECARDS.md`'s *"quietly re-scoring history is worse than a gap in it"* — the
word doing the work is *quietly*, and one labelled row at a known sha is the opposite of a silent
rewrite. The three v1 rows stay untouched.

A review stays reproducible from the repo alone, which is what dropping the attestation preserves:
no step waits on a person, and nothing in the method can go stale between reviews. The cost lands
on change 2 instead — it makes a card movable by adding spec files, which is the feature-count
scoring `SCORECARDS.md` warns against, and the floor is a cap rather than a bonus for that reason.

All four bump the method to version 2, so the calibration re-score is owed in the same pass.
Revisit the attestation when the repo has a second collaborator: the objection is the headcount and
the upkeep, not the mechanism, and a signature means something once the signer isn't the author.

## Confirmation

The four changes are built. What confirms them: a CI step fails a commit that edits
`SCORECARDS.md`, `repo-review/SKILL.md`, `repo-review-card.md` or `collect-facts.sh` without
bumping the shared method-version constant — the same shape as `docs:map --check` — and
`docs/reviews/README.md`'s history table carries the version-2 calibration row at the same sha as
the last version-1 review, both readable side by side.
