---
issue: 66
status: to-implement
decision: accepted
---

# 🧭 A review takes frontmatter for its method version, not for its scores

## Context

A decision report opens with a YAML frontmatter block; a review opens with prose. The question is
whether reviews could take the same shape, and whether reading from them would get easier.

Two corrections to the premise first. Neither directory is MADR — `docs/decisions/README.md`'s
deferred table rejects full MADR by name, and what a report carries above its H1 is a YAML
frontmatter block. And the two directories already document opposite contracts: decision frontmatter exists
because `status` and `decision` are "the one thing in the file expected to change after the report is
written", while a review is a dated snapshot that
[README.md](../reviews/README.md#-deliberately-deferred) says never to edit. So `status:` and
`decision:` have no review analogue — the answer can't be "the same block".

## Result

**Frontmatter isn't what makes a decision readable; it's where its mutable state lives, and a review
has none. But a review's opening line carries three facts nothing parses, and one of them — the
method version — is the only number in the whole system with no machine-readable copy anywhere.
That one field belongs in frontmatter. The scores do not.**

### What is read, and by what

| Fact | Where it lives | Read by |
| --- | --- | --- |
| Date, commit | The filename | `FILENAME` in [`collect/scorecards.ts`](../../apps/developer-portal/tools/collect/scorecards.ts) |
| Seven scores, total, Δ, verdicts | The `## 🧮 Scores` table | [`parseScoresTable`](../../apps/developer-portal/tools/lib/scorecards.ts), guarded by `scorecardShapeProblems`, `compareScorecardShape`, a `parseError` field and a paragraph of [`SKILL.md`](../../.agents/skills/repo-review/SKILL.md) |
| Branch, **method version**, previous review | The opening line | Nothing |

The scores half works. The regex is best-effort by design, a malformed table degrades to fewer cards
plus a named `parseError`, and all five filed reviews parse clean. Moving it would buy nothing.

### The method version is the fact that drifts

Measured, not argued:

| Finding | Evidence |
| --- | --- |
| The opening line's own label drifted mid-corpus | `Rubric v1` on the three 09-04 → 09-10 reviews, `Method v2` on the two 09-15 ones. A regex keyed on either spelling silently misses the other half |
| `METHOD.md` is at **version 6**; the newest review and the newest history row both say **v2** | Four bumps, each of which [`METHOD.md`](../reviews/METHOD.md#-bumping-it) says owes a calibration re-score "in the same pass". None was filed, and `pnpm review:version --check` passes anyway — it compares artifact digests, never a review |
| The dashboard compares across methods | `scorecards.vue`'s History card lists 4.1 · 4.2 · 4.4 · 4.2 · 3.9 newest-first with no method shown — exactly the read `README.md` tells a human never to make |
| The 45 numbers in the history table are checked by nobody | `compareReviewHistory` and `check-invariants.sh` both only substring-match the *filename*. Every row happens to agree with its review today; nothing keeps that true |

### The change

One field, `method: <n>`, in a frontmatter block on every review; the opening line drops `· Method
v<n> ·` and keeps branch and previous, which are prose for a human and have no second copy to
disagree with.

```md
---
method: 2
---

# 📊 Review — 2026-09-15

Commit `aea557e` on `feature/technical-docs/103-broken-links` · Previous: [2026-09-15](./<previous>.md)
```

`content.config.ts` needs no schema for it: in `@nuxt/content@3.16.0` a frontmatter key a collection
doesn't declare lands in `meta`, and `title` still comes from the H1. The collector reads the field
off disk anyway, never through a query.

### Step 1 — the mechanical half, no version bump

| # | File | Change |
| --- | --- | --- |
| 1 | The five dated reviews | Add the block — `method: 1` on `2026-09-04-c1025f3`, `2026-09-05-abcb17d` and `2026-09-10-bfd6da2`, `method: 2` on both `2026-09-15` files — and delete `· Rubric v1 ·` / `· Method v2 ·` from each opening line |
| 2 | [`TEMPLATE.md`](../reviews/TEMPLATE.md) | The same block with `method: <n>`, the same deletion |
| 3 | `shared/types.ts` | `method: number \| null` on `ReviewScorecard`; null when the block is missing or unparseable, the absent-is-its-own-state the neighbouring `parseError` already uses |
| 4 | `tools/collect/scorecards.ts` | Read it with `frontmatterFields`, imported from `tools/lib/decisions.ts` — leave that helper where it is |
| 5 | `tools/lib/invariants.ts` | `compareReviewMethod`: a review's `method` against the `v<n>` in the last cell of its history row, wired into `collectInvariants` beside `compareReviewHistory` |
| 6 | The specs beside 4 and 5 | Per `writing-tests`: a row that agrees, a row that disagrees, a review with no block |
| 7 | `app/pages/scorecards.vue` | The method on every History row, so 4.4 and 4.2 stop reading as a regression |

Nothing here is a `METHOD_ARTIFACTS` file, so the version stays at 6 and no re-score is owed.

### Step 2 — the half that bumps, and isn't mechanical

| # | Step | Note |
| --- | --- | --- |
| 1 | `repo-review/SKILL.md` step 4 | The version goes in frontmatter, not the opening line; then `pnpm agents:sync` |
| 2 | `pnpm review:version` | Once, after every artifact edit is final — editing `SKILL.md` again afterwards bumps to v8 and owes a second re-score |
| 3 | The v7 re-score of `aea557e` | A **new file**, `2026-09-20-aea557e.md`, not an edit — the `repo-review` skill applying v7's caps to the existing review's evidence. Its history row lands in the same pass, or `check-invariants.sh` blocks the write |
| 4 | The second `check-docs` rule | The highest `method:` filed must equal `METHOD.md`'s version. Red until step 3 lands, which is the point |

## Options considered

| Option | Why not |
| --- | --- |
| Move the scores into frontmatter too | GitHub is where these are read first, and Δ and the verdicts exist only in the table. Frontmatter would be a second copy of the seven scores *inside one file* — [`0018`](./0018-developer-portal-duplicated-facts.md)'s defect, and the trap `AGENTS.md` already names for `METHOD.md`'s digest rows |
| Render the Scores table from frontmatter, the way `docs:map` renders `FEATURES.md` | A renderer that runs once per review, for a file no one regenerates, to remove a regex that already works |
| Regex the opening line instead — no frontmatter at all | A free-form subtitle is what drifted in the first place, and the repo already has a frontmatter parser and validator (`frontmatterFields`, `decisionProblems`) that a fourth prose regex would sit beside |
| Copy the decision block wholesale — `status`, `decision`, `supersededBy` | Nothing about a review changes after it is written; a superseding review is just the next dated row disagreeing |
| Apply it to new reviews only | Two shapes and a parser that tolerates both, forever, to avoid touching five files |

## Consequences

The retrofit is five reviews plus `TEMPLATE.md`, as one labelled whole-corpus migration — the carve-out
`docs/decisions/README.md` already grants for exactly this, since no finding in any review changes.

**It costs a method bump, and the bump is the point.** `SKILL.md` step 4 tells the writer the version
goes "in the opening line"; correcting that edits a `METHOD_ARTIFACTS` file, so `pnpm review:version`
moves to v7 and owes the calibration re-score of `aea557e`. `TEMPLATE.md`, `README.md` and `METHOD.md`
are deliberately outside the manifest, so the rest of the change is free.

**Step 2's last rule is red on arrival.** The highest `method:` filed is 2 against `METHOD.md`'s 6 —
four bumps deep in un-re-scored debt before this change adds a line. The debt collapses into the one
re-score step 2 already owes, since only the newest review is ever re-scored, and `aea557e` is the
one to re-score because it has a single history row today where `bfd6da2` already has the two a
method bump is allowed to give a commit.

The two steps are separable and the bump is the seam: step 1 merges green on its own. The cost of
stopping between them is that `SKILL.md` still points at the opening line while `TEMPLATE.md` doesn't
— either step 2 follows immediately, or that window is accepted deliberately.

This gets revisited if a review ever grows a field that changes after it is written — at which point
the decision block's two axes become the model, not the exception.

## Confirmation

| Claim | Check |
| --- | --- |
| No review states its method in prose | `grep -rl "Rubric v\|Method v" docs/reviews/` returns `METHOD.md` and nothing else — `TEMPLATE.md` carries the line too, and loses it in the same pass |
| The version is machine-readable | `nx collect @monorepo/developer-portal` writes a `method` on every `ReviewScorecard`, and the History card renders it |
| The two copies can't disagree | Editing one history row's Method column fails `pnpm exec nx check-docs @monorepo/developer-portal` |
| No bump goes un-re-scored | The same command fails while `METHOD.md`'s version exceeds the highest `method:` filed — by design, from the bump until the re-score row lands |
