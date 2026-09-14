# 🧭 The docs tree scales; the mechanisms that keep it true do not

Spike: #106
Status: To implement

## Context

`docs/` holds 28 files written between 2026-09-04 and 2026-09-14, ten of them spikes. The question
raised was whether the tree survives many teams and many apps, and whether ~200 spikes in one flat
folder is a structure problem. Behind it sat an assumption worth testing: that volume is what
breaks first.

## Result

**The structure is sound and the volume is not the problem.** The ownership rule — *"A subject
enters `docs/` only if no single project owns it"* — is what keeps app count off this tree, and
consolidating project READMEs is already foreclosed. Nothing loads all of `docs/`; spikes are
pulled only when cited, so per-task cost is proportional to spikes *cited*, not spikes *filed*. At
200 files the cost is discovery and truth, not context.

**`docs/spikes/` is the ADR pattern**, arrived at independently: one immutable numbered file per
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

Five symptoms follow from that, all present today: `0040-docs-drift-detection.md` reads
`Status: Implemented` while none of its three layers was built; `0082-comment-discipline.md` was
rewritten in place against the rule that only `Status:` may change; two reports share issue #38;
five of ten spikes have no inbound link because `docs/spikes/README.md` links to none of them; and
`Superseded by` has never been written or parsed.

**The status line tracks the wrong axis.** `To implement | Implemented | Won't implement` describes
whether *work landed*. MADR's `proposed | rejected | accepted | deprecated | superseded by
ADR-0123` describes whether the *decision still holds*. This repo has no way to say a decision was
overturned, which is why supersession had to be invented as a separate unparsed line. Two axes are
being squeezed into one field.

**Numbering by issue cannot be unique.** The convention makes the issue number the link back, but
the `spike-report` skill also tells an agent to hang a report off "the closest existing issue" when
none was filed. #38 collided that way, and this report collides with its sibling at #106. MADR's
consecutive `NNNN` with the issue as a separate field is unique by construction.

**Three MADR elements are taken, and two are not.**

| MADR 4.0.0 element | Verdict |
| --- | --- |
| `Confirmation` — how compliance with the decision is verified | **Take.** Exactly what `0040` lacked when it claimed three layers no check ever looked for; the highest-value item here |
| `superseded by ADR-0123` as a *status value* | **Take.** Supersession belongs on the status axis, machine-read, not in a prose line nothing parses |
| Decision status as an axis distinct from work state | **Take the distinction.** A spike here is written after the call is made, so `proposed` and `rejected` have no readers, but decision-validity and work-state still need separate fields |
| Consecutive `NNNN` numbering, issue as a separate field | **Leave.** Unique by construction where issue numbers are not, but it costs every inbound link and the `[NN]` commit trail, and #106 shows a shared prefix is survivable when the index states it |
| Renumbering the ten existing reports | **Leave**, for the same reason |

**How far the template itself follows MADR is not decided here.** The retrofit in change 6 rewrites
all ten reports, so the migration cost that would normally settle this is being paid anyway, and
the choice turns on discipline rather than effort:

| Shape | Gains | Costs |
| --- | --- | --- |
| MADR-compatible — frontmatter, `Confirmation`, MADR's status vocabulary, this repo's four sections and its losers-table rule | Machine-readable metadata; `@nuxt/content` parses frontmatter natively, so `spikeStatusOf`'s hand-rolled `^Status:` regex is deleted rather than replaced | Not a MADR document, so MADR-specific tooling still doesn't apply |
| Full MADR sections — `Context and Problem Statement`, `Decision Drivers`, `Considered Options`, `Decision Outcome`, `Consequences`, `Confirmation`, `Pros and Cons of the Options` | Standard vocabulary and compatibility with MADR tooling | `Pros and Cons of the Options` invites a pro/con essay per option, which is what `Options considered` as a table of losers exists to prevent |
| Frontmatter only — metadata block, everything else unchanged | Smallest change; still deletes the regex | Leaves supersession and the two-axis problem unsolved, so it does not close what this report opened |

Deciding between them needs one thing this investigation did not do: read a real MADR corpus to see
whether `Pros and Cons of the Options` stays short in practice or reliably bloats.

**Seven changes are adopted.** The first five close the enforcement gap; the last two close the
reachability one — docs a teammate cannot read without running the app are not team docs.

1. **The link check and the mirrored invariants move into CI.** `checkLink`/`brokenLinkCount` and
   `apps/tech-docs/tools/lib/invariants.ts` already run in the `collect` path and gate nothing;
   that path shells out only to `git`, so CI needs no `gh` token. This is the change that makes the
   invariants hold for a human editor rather than only for Claude Code.
2. **The spike index is generated from `git ls-files`**, as a second renderer or a sibling script —
   not another `SECTIONS` entry, since `map`'s domain is `Capability` with one output path, and not
   from its filesystem walk, which would render untracked files locally and fail `--check`
   unreproducibly in CI.
3. **A validator over spike filenames and `Status:` values** — well-formed `NNNN-slug.md`, a
   recognised status, and a body whose `Spike: #N` matches its own prefix. It does **not** forbid a
   shared prefix: one issue raising two questions is legitimate, as #106 shows. What was wrong with
   #38 was silence, so a shared number becomes a fact the index states rather than an error.
4. **`Confirmation` joins the spike template**, recording how the decision will be verified. `0040`
   is the case it exists for.
5. **Supersession becomes a parsed status rather than a prose line**, so a reversed decision stops
   rendering as `Implemented`.
6. **The ten existing reports are migrated to the new template**, `Confirmation` included — blocked
   on the template-shape decision above, which is the one question this report leaves open. Writing
   that line onto the five `Implemented` reports is a truth audit rather than a formatting pass:
   `0040` cannot state how its three layers would be verified, because none was built.
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
| Archive or prune old spikes | Solves volume, which is not the failing constraint; an old spike whose decision still holds is still true |
| Subdivide `docs/spikes/` by area, team or status | The README already rejects folder-per-status: every flip becomes a `git mv` nothing enforces. Area folders add a second placement question to every report |
| Hand-written index table in `docs/spikes/README.md` | The literal deferred entry, but it is a new manual cross-file sync obligation — the class that rots fastest as contributors are added |
| Generate the index with `docs:map` | Right idea, wrong source: `docs:map` discovers by filesystem walk, so an untracked file renders locally and not in CI, failing `--check` unreproducibly. `map`'s domain is also `Capability` with one output path |
| Adopt MADR wholesale — frontmatter, sections, renumbering | The four sections here already carry what MADR's eight do, minus `Confirmation`. Migrating for the rest buys a standard name for a shape the repo already has, and spends every inbound link to get it |
| Keep `docs/drift` as the answer | It is a size-and-age proxy that never reads a doc's content, and it can never fail a push |

## Consequences

This forecloses nothing about the tree's shape, and deliberately leaves the numbering scheme alone
— the collision between this report and its sibling is the price of keeping the issue number as the
link back, paid knowingly rather than by oversight.

`docs/spikes/README.md` stops being the place a spike is discovered by hand, and the three deferred
rows about indexes are spent, as is `apps/tech-docs/README.md`'s *"Serving this anywhere"* row and
`docs/README.md`'s publishing row.

`Confirmation` is a claim about future verification, so a report carrying one that nothing checks
is a new drift class — the failure mode it was added to prevent, one level up. Change 6 also edits
every section of ten reports the README calls immutable; that rule needs to distinguish a labelled
migration from the silent in-place rewrite `0082` did, or it stops meaning anything.

Change 1 turns an advisory check into a gate, so the first run after it fails on the broken
`../decisions/README.md` link in `2026-09-04-c1025f3.md`. That is fixed as part of the work, not
discovered by it — and a review is a dated snapshot, so the fix is the link, never the finding.

One question is left open deliberately: how closely the template follows MADR. Changes 4 and 5 name
the fields the template must carry, so they are answerable now; change 6 cannot start until the
shape is picked, and picking it wrong costs the ten-file migration twice.

Revisit if the ownership rule stops cutting cleanly — that, not file count, is the trigger for
subdividing `docs/`.
