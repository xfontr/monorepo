# 🔒 Method version

Method **version 7**.

A review's total is only readable against another total, and that comparison holds only if both were
produced the same way. Four artifacts decide how a score comes out, and until version 2 only one of
them carried a version — so a change to the other three moved every future score while the history
table went on reading `v1`.

This file closes that. It records the version and a digest of each artifact;
`pnpm review:version --check` fails a tree where an artifact's bytes don't match what the version
recorded, and CI runs it beside `docs:map --check`.

## 🧩 What the version covers

| Artifact | Digest |
| --- | --- |
| `docs/reviews/SCORECARDS.md` | `e5d2afa84c23` |
| `.agents/skills/repo-review/SKILL.md` | `2f027de5bcce` |
| `.claude/agents/repo-review-card.md` | `47d64ce1a38f` |
| `.agents/skills/repo-review/collect-facts.sh` | `889822fb58a4` |

| Artifact | Decides |
| --- | --- |
| `SCORECARDS.md` | The cards and their questions, the anchors, how to judge, and the weights |
| `repo-review/SKILL.md` | How the thesis is formed and the agents' proposed scores are tested |
| `repo-review-card.md` | The card agents' brief, tool access and return shape |
| `collect-facts.sh` | The facts and measurements every judgement leans on |

The digest is the first 12 hex characters of the file's SHA-256. `README.md`, `TEMPLATE.md` and this
file are deliberately not on the list: they hold the output and the furniture, and none of them
changes how a score is arrived at.

## 🔁 Bumping it

```sh
pnpm review:version
```

Re-records the digests and **bumps the version if any of them moved**. The bump is a consequence of
the change rather than a number anyone types, because the person editing the method is the one least
likely to notice they owe a bump — versioning by hand put the decision in exactly the wrong hands.

A bump owes one more thing in the same pass: **the previous review's commit gets re-scored under the
new method, once**, and that row goes in the [history table](./README.md#-history) beside the old
one. A version alone says the numbers aren't comparable; two rows at the same sha say by how much,
which is the question a reader of that table is actually asking.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A fifth artifact deciding a score (a second agent, a scoring script) | Add its path to `METHOD_ARTIFACTS` in [`manifest.ts`](../../infrastructure/scripts/src/review-version/domain/manifest.ts) and run `pnpm review:version` — the list is the definition, and the table above is rendered from it |
| Digests for the v1 method | Version 1 predates this file, and the artifacts have moved since, so the digests would have to be reconstructed from a tree nobody scored. The three v1 rows stand on their own reviews' citations instead |
| A bump that doesn't warrant a re-score (a typo in `SKILL.md`) | Nothing here can tell a typo from a rule change, and a version that people argue their way out of stops meaning anything. The re-score is a fresh review of the old commit, so a cosmetic bump costs a full review: batch method edits into one change |
| Blocking the bump at commit time rather than in CI | `check-invariants.sh` only sees the one file a Claude Code edit touched, and this check compares four. CI is where the whole-tree checks already live |
