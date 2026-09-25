# 🔒 review-version

Keeps [`docs/reviews/METHOD.md`](../../../../docs/reviews/METHOD.md) honest: it fingerprints the four
artifacts that decide a repo review's score, records them, and bumps the version whenever one of them
moves. A review total is only readable against another total, and that comparison only holds if both
were produced the same way.

```sh
pnpm review:version              # re-record the digests, bumping the version if any moved
pnpm review:version --check      # fail if one moved without a bump — what CI runs
```

## 🗂 Structure

```
index.ts                hands main to run()
main.ts                 the --check branch and the write
adapters/files.ts       reads the four artifacts and METHOD.md, writes METHOD.md
domain/manifest.ts      the digest, the parse and the in-place rewrite — the only real logic here
```

## 🔑 Why four artifacts and not one

`SCORECARDS.md` carried a version of its own, and the other three carried nothing — so editing the
skill or the fact collector moved every future score while the history table went on reading `v1`.
[`0012-review-rubric-validity.md`](../../../../docs/decisions/0012-review-rubric-validity.md) measured
that gap; this closes it.

| Artifact | Decides |
| --- | --- |
| `docs/reviews/SCORECARDS.md` | The cards and their questions, the anchors, how to judge, and the weights |
| `.agents/skills/repo-review/SKILL.md` | The reconcile rules that drop and re-score what the agents report |
| `.claude/agents/repo-review-card.md` | The card agents' model, tool access and isolation rule |
| `.agents/skills/repo-review/collect-facts.sh` | Every count each card is scored against |

The list lives in `METHOD_ARTIFACTS` in [`manifest.ts`](./domain/manifest.ts) and the table in
`METHOD.md` is written from it, never the reverse.

## 🔁 The bump is derived, not typed

Nobody enters a version number. If a digest moved, the version increments; if none moved, the file is
left byte-identical and re-running is not a bump. That is the whole design: the person changing the
scoring method is the one least likely to notice they owe a bump, so it can't be their job to
remember. `--check` in [`ci.yml`](../../../../.github/workflows/ci.yml) is what makes forgetting
impossible rather than merely discouraged, the same shape as `docs:map --check`.

Only the version line and the digest rows are rewritten — the prose around them stays hand-written,
which is why this edits in place rather than rendering the file the way [`map/`](../map/README.md)
does. A `METHOD.md` with no digest table at all is left alone rather than bumped into, since a file
that can't record the new digests would climb a version on every run.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A fifth artifact deciding a score (a second agent, a scoring script) | Add its path to `METHOD_ARTIFACTS` and run the script — the list is the definition |
| Telling a typo apart from a rule change | Nothing here can, so a whitespace fix in `SKILL.md` bumps the version like a reworded card. A version people argue their way out of stops meaning anything, and the re-score a bump owes is a fresh review of the old commit, so batch method edits into one change |
| Blocking the bump at commit time | `.claude/hooks/check-invariants.sh` sees only the one file an edit touched, and this compares four. CI and the push gate are where whole-tree checks already live |
| Verifying the calibration re-score actually happened | The bump prints the reminder and `docs/reviews/README.md`'s history table is where the row lands, but nothing fails if it doesn't. Worth a check once a second bump has happened and the habit is real |
