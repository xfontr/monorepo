# 🔒 Method version

Method **version 5**.

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
| `docs/reviews/SCORECARDS.md` | `9c14239963c4` |
| `.agents/skills/repo-review/SKILL.md` | `c0071c35114d` |
| `.claude/agents/repo-review-card.md` | `ae86215a400d` |
| `.agents/skills/repo-review/collect-facts.sh` | `5842670cfe06` |

| Artifact | Decides |
| --- | --- |
| `SCORECARDS.md` | The cards, the anchors, the caps and the weights |
| `repo-review/SKILL.md` | The reconcile rules that drop and re-score what the agents report |
| `repo-review-card.md` | The card agents' model, tool access and isolation rule |
| `collect-facts.sh` | Every count each card is scored against |

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
| A bump that doesn't warrant a re-score (a typo in `SKILL.md`) | Nothing here can tell a typo from a rule change, and a version that people argue their way out of stops meaning anything. The re-score is cheap because it applies new caps to the old review's own evidence, not a fresh read of the tree |
| Blocking the bump at commit time rather than in CI | `check-invariants.sh` only sees the one file a Claude Code edit touched, and this check compares four. CI is where the whole-tree checks already live |
