---
issue: 106
status: to-implement
decision: accepted
---

# 🧭 The docs tree scales; the mechanisms that keep it true do not

## Context

`docs/` holds 28 files written between 2026-09-04 and 2026-09-14, ten of them decisions. The question
raised was whether the tree survives many teams and many apps, and whether ~200 decisions in one flat
folder is a structure problem. Behind it sat an assumption worth testing: that volume is what
breaks first.

## Result

**The structure is sound and the volume is not the problem.** The ownership rule — *"A subject
enters `docs/` only if no single project owns it"* — is what keeps app count off this tree, and
consolidating project READMEs is already foreclosed. Nothing loads all of `docs/`; decisions are
pulled only when cited, so per-task cost is proportional to decisions *cited*, not decisions *filed*. At
200 files the cost is discovery and truth, not context.

**`docs/decisions/` is the ADR pattern**, arrived at independently: one immutable numbered file per
resolved decision, a status field, a supersession rule. MADR 4.0.0 and Nygard's 2011 original
describe the same shape, and ADR corpora are known to run to hundreds of files flat. The layout
needs no change.

**What fails is enforcement, and it fails already at ten files.**

| Mechanism | Reach |
| --- | --- |
| `pnpm docs:map --check` (`ci.yml:37`) | The only blocking doc check in the repo; asserts a byte match on one generated file |
| `pnpm docs:drift` | `.husky/pre-push` behind `\|\| true`; advisory, and absent on a fresh clone since lifecycle scripts are banned |
| `check-invariants.sh` | A `PostToolUse` hook — fires only when Claude Code writes the file, never for a human or a web edit |
| Link checking | `checkLink`/`brokenLinkCount` exist in `apps/tech-docs/tools/collect/docs.ts` and gate nothing; `collect` runs in no workflow |

Five symptoms follow from that, all present today: `0002-docs-drift-detection.md` reads
`Status: Implemented` while none of its three layers was built; `0009-comment-discipline.md` was
rewritten in place against the rule that only `Status:` may change; two reports share issue #38;
five of ten decisions have no inbound link because `docs/decisions/README.md` links to none of them; and
`Superseded by` has never been written or parsed.

**The status line tracks the wrong axis.** `To implement | Implemented | Won't implement` describes
whether *work landed*. MADR's `proposed | rejected | accepted | deprecated | superseded by
ADR-0123` describes whether the *decision still holds*. This repo has no way to say a decision was
overturned, which is why supersession had to be invented as a separate unparsed line. Two axes are
being squeezed into one field.

**Numbering by issue cannot be unique, and sorts by the wrong thing.** The convention makes the
issue number the link back, but the `decision-report` skill also tells an agent to hang a report off
"the closest existing issue" when none was filed. #38 collided that way, and this report collided
with its sibling at #106. The second problem is worse than the collision: the reports were written
on 09-04, 09-05 and 09-06 in an order the issue numbers don't reflect — `0061` predates both `0038`s
— so the directory listing sorted by when a GitHub issue happened to be opened rather than by when
anything was decided. MADR's consecutive `NNNN` with the issue as a separate field is unique by
construction and reads in decision order.

**All five MADR elements considered are taken.**

| MADR 4.0.0 element | Verdict |
| --- | --- |
| `Confirmation` — how compliance with the decision is verified | **Take.** Exactly what `0002` lacked when it claimed three layers no check ever looked for; the highest-value item here |
| `superseded by ADR-0123` as a *status value* | **Take.** Supersession belongs on the status axis, machine-read, not in a prose line nothing parses |
| Decision status as an axis distinct from work state | **Take the distinction.** A decision here is written after the call is made, so `proposed` and `rejected` have no readers, but decision-validity and work-state still need separate fields |
| Consecutive `NNNN` numbering, issue as a separate field | **Take.** It costs every inbound link once, and buys uniqueness by construction plus a listing in decision order. The first draft of this report kept issue numbering on the grounds that the repo's existing links were worth more; that weighed a young experimental repo's conventions as if they were established practice, which is backwards |
| Renumbering the twelve existing reports | **Take**, for the same reason — twelve files and ~20 relative links is the cheapest this migration will ever be |

**The template goes MADR-compatible, not full MADR.** The retrofit in change 6 rewrites every
report, so the migration cost that would normally settle this is paid either way, and the choice
turned on discipline rather than effort:

| Shape | Gains | Costs |
| --- | --- | --- |
| MADR-compatible — frontmatter, `Confirmation`, MADR's status vocabulary, this repo's four sections and its losers-table rule | Machine-readable metadata; `@nuxt/content` parses frontmatter natively, so `spikeStatusOf`'s hand-rolled `^Status:` regex is deleted rather than replaced | Not a MADR document, so MADR-specific tooling still doesn't apply |
| Full MADR sections — `Context and Problem Statement`, `Decision Drivers`, `Considered Options`, `Decision Outcome`, `Consequences`, `Confirmation`, `Pros and Cons of the Options` | Standard vocabulary and compatibility with MADR tooling | `Pros and Cons of the Options` invites a pro/con essay per option, which is what `Options considered` as a table of losers exists to prevent |
| Frontmatter only — metadata block, everything else unchanged | Smallest change; still deletes the regex | Leaves supersession and the two-axis problem unsolved, so it does not close what this report opened |

The first row wins because it takes the machine-readable half of MADR without importing the section
that this repo's `Options considered` table exists to prevent. Frontmatter also stops being
hand-parsed: `@nuxt/content` already reads it as YAML to render the page, and the checker now uses
`yaml` so both agree on what a valid report looks like.

**Seven changes are adopted.** The first five close the enforcement gap; the last two close the
reachability one — docs a teammate cannot read without running the app are not team docs.

1. **The link check and the mirrored invariants move into CI.** `checkLink`/`brokenLinkCount` and
   `apps/tech-docs/tools/lib/invariants.ts` already run in the `collect` path and gate nothing;
   that path shells out only to `git`, so CI needs no `gh` token. This is the change that makes the
   invariants hold for a human editor rather than only for Claude Code.
2. **The reports are renumbered consecutively in decision order**, and the issue moves to an
   `issue:` frontmatter field. A directory listing then reads in the order the calls were made, and
   two reports off one issue stop fighting over a prefix.
3. **A validator over decision filenames and frontmatter** — well-formed `NNNN-slug.md`, a recognised
   `status` and `decision`, a numeric `issue:`, a `supersededBy` that names a real report, and a
   number no other report has taken. It runs inside `check-docs` rather than as its own script: the
   vocabulary it enforces is the same `shared/decisions.ts` constant the dashboard renders from, so
   there is no second copy to drift.
4. **`Confirmation` joins the decision template**, recording how the decision will be verified. `0002`
   is the case it exists for.
5. **Supersession becomes a parsed status rather than a prose line**, so a reversed decision stops
   rendering as `Implemented`.
6. **The existing reports are migrated to the new template**, `Confirmation` included. Writing that
   line onto the `Implemented` reports is a truth audit rather than a formatting pass: `0002`
   cannot state how its three layers would be verified, because none was built.
7. **`apps/tech-docs` gets deployed.** Its README currently calls this "a different project", and
   the four blockers below are why; the decision here is that it stops being deferred.

**Deploying the wiki is not a build step.** Four separate things block it:

| Blocker | What it needs |
| --- | --- |
| `/api/issues` shells out to `gh` at runtime (`server/utils/issues.ts:22,68`, resolving the binary from `KNOWN_DIRS`) | A deployed instance has neither the binary nor credentials. Either drop the live issue surface, or move it to the GitHub API behind a server-side token |
| `/api/snapshot` reads `.report/*.json` off the filesystem (`server/utils/store.ts`) | The snapshot becomes a CI-built artifact shipped with the deploy, not a local `nx collect` output |
| No auth, and every path rendered is a local filesystem path | Auth, or a path-scrubbing pass — the README names this as the reason it stays local |
| No `build` script, and `@nx/nuxt` infers the target as `nuxt:build`, so `nx affected -t build` skips the project | A `build` script plus the CI wiring the current shape deliberately avoids |

The split that makes it tractable already exists: the content and snapshot surfaces are static per
commit, and only the issues surface is live. Deploying the first two and dropping or gating the
third is the smaller project the README's "different project" is pointing at.

## Options considered

| Option | Why not |
| --- | --- |
| Archive or prune old decisions | Solves volume, which is not the failing constraint; an old decision whose decision still holds is still true |
| Subdivide `docs/decisions/` by area, team or status | The README already rejects folder-per-status: every flip becomes a `git mv` nothing enforces. Area folders add a second placement question to every report |
| Hand-written index table in `docs/decisions/README.md` | The literal deferred entry, but it is a new manual cross-file sync obligation — the class that rots fastest as contributors are added |
| A generated `INDEX.md`, rendered and asserted in CI | Built, then removed. Over a directory listing that now sorts in decision order it added a title and two frontmatter values, both of which the dashboard already shows as pills — a generated file, a CI step and a renderer to keep a table nobody needed |
| A standalone `docs:decisions-index` script under `infrastructure/scripts` | The validation is worth keeping; a separate CLI for it is not. `check-docs` already reads every doc in CI, and living there lets the validator share `shared/decisions.ts` with the dashboard instead of mirroring the vocabulary across a `type:tooling` boundary that forbids the import |
| Full MADR sections — `Decision Drivers`, `Considered Options`, `Pros and Cons of the Options` | The four sections here plus `Confirmation` carry what MADR's eight do. `Pros and Cons of the Options` invites a pro/con essay per option, which is what `Options considered` as a table of losers exists to prevent |
| Keep `docs/drift` as the answer | It is a size-and-age proxy that never reads a doc's content, and it can never fail a push |

## Consequences

This forecloses nothing about the tree's shape. The renumbering spends every inbound link once —
~20 relative paths across docs, READMEs and two `CLAUDE.md` files — and buys a listing that reads
in decision order. Every future report costs one lookup of the next free number, which is what the
`decision-report` skill now says to do.

`apps/tech-docs/README.md`'s *"Serving this anywhere"* row and `docs/README.md`'s publishing row
are spent by change 7.

`Confirmation` is a claim about future verification, so a report carrying one that nothing checks
is a new drift class — the failure mode it was added to prevent, one level up. Change 6 also edits
every section of the existing reports the README calls a record; that rule now distinguishes a
labelled whole-corpus migration from the silent in-place rewrite `0009` did.

Change 1 turns an advisory check into a gate, so the first run after it fails on the broken
`../decisions/README.md` link in `2026-09-04-c1025f3.md`. That is fixed as part of the work, not
discovered by it — and a review is a dated snapshot, so the fix is the link, never the finding.

Revisit if the ownership rule stops cutting cleanly — that, not file count, is the trigger for
subdividing `docs/`.

## Confirmation

**Changes 1–6 are in the repo; change 7 is not, which is why `status` stays `to-implement` rather
than flipping.** Verified per change:

1. `pnpm exec nx check-docs @monorepo/tech-docs` runs in CI (`ci.yml`) and fails on a broken link
   or a mirrored-invariant finding, over every tracked doc rather than only a Claude Code edit.
2. `ls docs/decisions/` runs `0001`–`0012` with no gaps and no repeats, and every report carries an
   `issue:` field. The check in 3 fails if a thirteenth report reuses a number.
3. The same command fails on a malformed filename, an unrecognised `status:`/`decision:`, a missing
   `issue:`, or a `supersededBy:` naming a report that isn't filed — pinned by
   [`tools/lib/decisions.spec.ts`](../../apps/tech-docs/tools/lib/decisions.spec.ts).
4. Every decision report's frontmatter is now followed by a `## Confirmation` section, this one
   included.
5. `decision: superseded` plus `supersededBy:` is a parsed, validated frontmatter pair — see
   [`docs/decisions/README.md`](./README.md#-superseding-a-decision) — not a prose line.
6. All twelve reports carry the frontmatter template. The vocabulary they're checked against is
   `DECISION_STATUSES`/`DECISION_OUTCOMES` in
   [`shared/decisions.ts`](../../apps/tech-docs/shared/decisions.ts), which the dashboard's own types
   derive from — so a widened vocabulary can't reach one reader and not the other.
7. **Not done, and not yet filed.** `apps/tech-docs` is not deployed; its four blockers are
   unaddressed. Deliberately kept out of this pass rather than attempted alongside it — no issue
   exists for it yet.
