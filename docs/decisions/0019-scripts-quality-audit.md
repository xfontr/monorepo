---
issue: 66
status: implemented
decision: accepted
---

# 🧭 The scripts package is architecturally sound and owes two unfinished cleanups

## Context

`infrastructure/scripts` was written fast and mostly by an agent. [`0004`](./0004-scripts-architecture.md)
specified a four-layer architecture for it — entry → command → `adapters/` → `domain/` — and stated
plainly that the direction is "convention, not lint, today". Nothing has checked since whether that
convention is actually *implemented* or merely documented, and the package has roughly doubled in
size since 0004 was written: two whole scripts (`agents-sync/`, `coverage-report/`) postdate it.

Five questions were put to it: is the code bad, is the architecture real, are the docs honest, do the
boundaries hold, and what should change. The answers are not evenly distributed — the structural ones
come back clean, and what is left is two cleanups that were already specified here and never
finished.

## Result

**The architecture is implemented, not just described. The quality problems are two, and both are
failures to apply rules this repo had already written down** — the comment discipline from
[`0009`](./0009-comment-discipline.md), whose `status` still reads `to-implement` and whose
Confirmation criterion names this package, and 0004's own instruction to move logic into `domain/`,
which has not been applied to a command since 0004 was filed. Neither is a design mistake; both are
the code failing to catch up with its docs.

### What holds

The layer rule from 0004 is respected with no exceptions. Four greps over `src/`, all empty:

| Invariant | Check | Result |
| --- | --- | --- |
| No sideways imports between script folders | `grep -rn 'from "\.\./\.\./\(issue\|ship\|map\|drift\|dev\|agents-sync\|review-version\|coverage-report\)/' src` | empty |
| `domain/` is pure | `grep -rn 'node:fs\|node:child_process\|@clack\|node:process\|node:os' src/*/domain/ src/shared/domain/` | empty |
| `domain/` never reaches an adapter | `grep -rn 'adapters/' src/*/domain/ src/shared/domain/` | one hit, a doc link inside a comment |
| Nothing calls `process.exit` | `grep -rn 'process.exit(' src` | empty |

Boundaries hold too. The package is tagged `type:tooling`, which
[`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts) restricts to `type:config`
only; its sole workspace dependency is `@monorepo/configs`, and nothing in the workspace imports it.
`lint` and `typecheck` are clean, and 121 tests across 14 spec files pass. Every `domain/` module
that carries real logic has a spec beside it.

The docs are the best part of the package and better than the code they describe. The layer table in
[`0004`](./0004-scripts-architecture.md), the package README, the per-script READMEs and
[`shared/README.md`](../../infrastructure/scripts/src/shared/README.md) agree with each other and
with the filesystem. Three claims in them have gone stale (below), which is drift rather than
invention.

### The comment problem is 0009's, unfinished

0009 measured this package at **599 comment lines / 2421 code lines = 24.7%**, the worst in the
workspace, called 4–6% "the house range", and called for a sweep down to **~120 comment lines**. A
partial sweep has landed — comment lines have halved — but the ratio has barely moved and the target
is still far off:

| Measure | 0009 baseline | Today | 0009's target |
| --- | --- | --- | --- |
| Comment lines | 599 | **86** | ~120 |
| Comment / code | 24.7% | **5.16%** (86 / 1666) | 4–6% |
| Blocks over the two-sentence cap | 22 ran 7–19 lines | **0** | 0 |

The package now sits in the house range named by 0009. The sweep removed narration and duplicated
explanations while retaining scanner findings, API traps, units, and outside constraints.

**The distribution is bimodal, and that is the more useful finding.** Bloat is concentrated in the
six scripts that predate 0004; the two that postdate it carry *zero* comments across every file:

| Vintage | Scripts | Comment lines |
| --- | --- | --- |
| Pre-0004 | `shared/`, `issue/`, `dev/`, `drift/`, `map/`, `ship/` | 299 |
| Post-0004 | `agents-sync/`, `coverage-report/` | 0 |

That confirms 0009's claim that density "tracks recency of agent authorship rather than complexity of
the code" — and it means the house style is already achievable here. `coverage-report/` retains the
one line that genuinely needs a comment:
[`adapters/nx.ts:11`](../../infrastructure/scripts/src/coverage-report/adapters/nx.ts) sets
`const PATH = "/usr/bin:/bin"` and overrides the child's `PATH`, which is exactly the kind of outside
constraint 0009's keep-test says to write down, and nothing explains it.

### Concrete defects

Seven, none of them severe, ordered by what they cost:

| # | Defect | Location | Cost |
| --- | --- | --- | --- |
| 1 | Module-scope `require.resolve` — violates the AGENTS.md rule whose own rationale is that breaking it made modules unimportable | [`coverage-report/adapters/nx.ts:9-10`](../../infrastructure/scripts/src/coverage-report/adapters/nx.ts) | The file cannot be imported where `nx` isn't resolvable, which is why it has no spec |
| 2 | The `setup` → `quick-start` rename in `6f2a58f` never finished | [`map/domain/render.ts:19`](../../infrastructure/scripts/src/map/domain/render.ts), [root README](../../README.md) lines 87 and 114 | `pnpm setup` does not exist; the generated [`FEATURES.md`](../FEATURES.md) tells readers to run it |
| 3 | README §Tests names 9 of the 14 spec files; AGENTS.md says only one exists | [`scripts/README.md`](../../infrastructure/scripts/README.md) §✅ Tests, [`scripts/AGENTS.md:38`](../../infrastructure/scripts/AGENTS.md) | Both read as "this package barely tests anything", which is no longer true |
| 4 | Two different `currentBranch` implementations answering one question | [`issue/adapters/git.ts:15`](../../infrastructure/scripts/src/issue/adapters/git.ts) (`branch --show-current`) vs [`ship/adapters/git.ts:5`](../../infrastructure/scripts/src/ship/adapters/git.ts) (`rev-parse --abbrev-ref HEAD`) | They disagree on detached HEAD — `""` vs `"HEAD"`. 0004's adapter-naming rule licenses two `git.ts` files, not two answers |
| 5 | Title-casing implemented twice | [`dev/domain/projects.ts:22-23`](../../infrastructure/scripts/src/dev/domain/projects.ts), [`drift/domain/detect.ts:50-54`](../../infrastructure/scripts/src/drift/domain/detect.ts) | The `drift` copy has no acronym list, so it would render "Ui" — the exact case the `dev` copy exists to avoid |
| 6 | One prompt bypasses `orExit`, against the stated invariant that every prompt unwinds through it | [`issue/add.ts:106`](../../infrastructure/scripts/src/issue/add.ts) | Behaviour is correct; the inconsistency is the cost |
| 7 | `parseManifest(before)` parsed three times in one function | [`review-version/main.ts:20,27,33`](../../infrastructure/scripts/src/review-version/main.ts) | Cosmetic |

### The command layer carries more logic than the domain layer, and none of it is tested

28.5% statement coverage reads alarming and mostly isn't: the architecture puts side effects in
`adapters/`, and the README is right that a spec over `gh` asserts a mock against itself. Split by
layer, the number says something more specific:

| Layer | Statements | Covered | Coverage |
| --- | --- | --- | --- |
| `domain/` | 227 | 220 | **96.9%** |
| `adapters/` | 356 | 37 | 10.4% |
| command | 335 | 8 | **2.4%** |
| entry | 12 | 0 | 0% |

**The domain layer is doing its job — every one of the ten `domain/` modules has a spec, and six are
at 100% statements and branches.** The defect is the inversion above it: the command layer holds
*more* statements than the domain layer it sits on (335 vs 227) at 2.4% covered. In a layout whose
whole premise is that decisions move into pure functions, commands should be thin orchestration and
`domain/` should be the fat part. Here it is the other way round.

What is stranded in commands is decidable logic, not I/O, and the package's own rule already says to
extract it — that rule just hasn't been applied since 0004:

| File | Statements | The logic that should be in `domain/` |
| --- | --- | --- |
| [`issue/pick.ts`](../../infrastructure/scripts/src/issue/pick.ts) | 87 | The `BACK` re-prompt loop, and the three-way offline / auth-error / online fallback in `pickIssue` — which is a decision about an error, not a subprocess call |
| [`issue/add.ts`](../../infrastructure/scripts/src/issue/add.ts) | 46 | `pickLabel`'s filter predicate and the empty-pick-to-omitted-flag mapping |
| [`shared/cli.ts`](../../infrastructure/scripts/src/shared/cli.ts) | 39 | `parse`, `invocation`, `detailOf` and `report`'s error-to-exit-code mapping — all pure, all untested |
| [`drift/main.ts`](../../infrastructure/scripts/src/drift/main.ts) | 36 | The fingerprint-seen skip, and the decision to record a fingerprint *before* deciding whether to warn |
| [`ship/main.ts`](../../infrastructure/scripts/src/ship/main.ts) | 29 | The `passed`/`merged` branching that decides the exit code |

`shared/cli.ts` is the sharpest case: it is the file every entry point stands on, it defines what an
exit code means for the whole package, it is pure apart from reading `process.argv`, and it has no
spec at all. `shared/adapters/io.ts` (15.8%) is second — `isInteractive()` and the clack-vs-plain
dialect switch are pure branching wearing an adapter's name.

Two nits ESLint does not catch, both instances of open issue #138 (JSON linting): `package.json:19`
indents `"lint"` by nine spaces where every sibling uses four, and
[`issue/domain/search.ts:22-25`](../../infrastructure/scripts/src/issue/domain/search.ts) has a
one-space blank line and a six-space operator continuation.

## Options considered

| Option | Why not |
| --- | --- |
| Report the package as broadly low quality | It isn't. Lint, typecheck, boundaries and all four layer invariants pass, and 121 tests do too. What is left is seven small defects and two stalled cleanups |
| Treat the 19.0% comment ratio as a new finding | 0009 already found it, measured it, set the target and shipped the `comment-cleanup` skill for it. This report records that the sweep stalled on this package, and reuses 0009's numbers rather than inventing a second standard |
| Gate the comment ratio in `check-invariants.sh` | 0009 rejected exactly this: the ratio is a symptom, a legitimately dense file would fail and 40 tidy narrations would pass. Unchanged here |
| Land `no-restricted-imports` to enforce the layer rule now | The greps come back clean, so there is nothing to catch today, and the README's deferral cost still stands — it would replace this package's thin-wrapper `eslint.config.ts`. Worth doing when a violation actually appears, not before |
| Fold the two `currentBranch` into `shared/adapters/git.ts` | Tempting, but it re-opens what 0004 settled: the shared module holds `git` itself, not each script's questions. Picking one implementation per call site is the smaller fix (defect 4) |
| Rewrite `coverage-report/adapters/nx.ts` onto `shared/adapters/exec.ts` | Its spawn-to-temp-file shape may be load-bearing for output size, and nothing says so. Moving the module-scope resolve inside the function (defect 1) gets the testability win without guessing at the rest |
| Do the comment sweep in this pass | Scoped and left as follow-up at the user's direction. It touches nearly every file in `src/` and wants the `comment-cleanup` skill, not a hand pass |
| Read 28.5% coverage as the test finding | It is the wrong unit. Split by layer, `domain/` is at 96.9% and `adapters/` is untested on purpose; the finding is the command layer holding more statements than the domain layer at 2.4% covered |
| Raise coverage by writing specs against the commands as they stand | That means mocking `gh`, clack and `git` to assert orchestration — the specs the README already refuses, and they would pin the wiring rather than the decisions. Extract the decision into `domain/` first, then the spec is worth having |
| Set a coverage threshold in the vitest config | It would be met by testing adapters against their own mocks, which is the outcome this package correctly avoids. The layer split in Confirmation is the check that can't be gamed that way |

## Consequences

The seven defects and the targeted domain extraction are now implemented; the comment sweep completes
0009's package-level confirmation without changing 0009's own status.

**1. The seven defects, smallest diff first.** Each is independent:

| # | Change |
| --- | --- |
| 1 | Move `createRequire`/`require.resolve` from `coverage-report/adapters/nx.ts` module scope into `nx()`. While there, add the missing `import process from "node:process"` — it is the only non-spec file in the package that uses `process` without it — and write the one sentence that explains `PATH = "/usr/bin:/bin"` |
| 2 | Replace `pnpm setup` with `pnpm quick-start` in `map/domain/render.ts:19` and root README lines 87 and 114, then `pnpm docs:map`. This also closes the `—` in FEATURES.md's `pnpm quick-start` row: that cell is empty *because* the README calls the command by its old name |
| 3 | Rewrite `scripts/README.md` §✅ Tests to stop enumerating spec files — the list has gone stale twice — and fix `scripts/AGENTS.md:38`. Then `pnpm agents:sync`, since `CLAUDE.md` is generated |
| 4 | Change `issue/adapters/git.ts:15` to `git("rev-parse", "--abbrev-ref", "HEAD")`, matching `ship/`. **Not the reverse** — `branch --show-current` returns `""` on a detached HEAD, and `issue/add.ts:103` compares the result against `"master"`, so an empty string silently reads as "not on master" and offers a branch prompt from a detached checkout |
| 5 | Move `titleCase` and `ACRONYMS` out of `dev/domain/projects.ts` into `shared/domain/layout.ts` and have `drift/domain/detect.ts`'s `displayName` call it. Both are pure and `layout.ts` is already the shared pure module, so this needs no new file. Do **not** leave the divergence commented — `drift` would keep rendering "Ui" for `packages/ui` |
| 6 | Route `issue/add.ts:106` through `orExit`, dropping the direct `isCancel` import |
| 7 | Hoist `parseManifest(before)` to one call in `review-version/main.ts` |

**2. Tests, in the order the layer table argues for.** The target is not a coverage percentage —
it is moving decisions out of commands so they *can* be tested:

| Work | Why first |
| --- | --- |
| A spec for `shared/cli.ts` | Highest value per line in the package: `run`'s error-to-exit-code contract is what every script relies on, and `parse`, `invocation` and `detailOf` are pure. Needs no extraction — write the spec against the file as it stands |
| Extract `pickIssue`'s offline / auth-error / online decision from `issue/pick.ts` into `issue/domain/` | 87 untested statements, and the branch that decides whether a stale cache is acceptable is the one most worth pinning |
| Extract `ship/main.ts`'s exit-code branching into `ship/domain/report.ts` | `shipMessage` already lives there and is tested; the `passed`/`merged` decision that picks the message does not |
| Extract `drift/main.ts`'s fingerprint-seen skip into `drift/domain/detect.ts` | It decides whether a push nags, and the ordering — fingerprint recorded before the warn decision — is currently unstated and unpinned either way |
| A spec for `shared/adapters/io.ts`'s `isInteractive()` | Pure branching on `isTTY`/`CI`; the only adapter here worth a spec |

Leave `adapters/` otherwise untested. That is the architecture working, not a gap.

**3. Finish 0009's sweep: 299 → 86 comment lines.** The pass ran worst-ratio-first through the 13
listed files, then covered every remaining over-cap block.

**Shorten, do not delete.** The facts in these comments are the ones 0009's keep-test says to hold
onto — what a scanner flagged, why a strange sort order exists, a trap in an API. Deleting the block
loses them; the job is to find the one sentence and drop the argument around it. The shape to aim
for, from [`shared/adapters/exec.ts:17-22`](../../infrastructure/scripts/src/shared/adapters/exec.ts):

```ts
// Before — 6 lines, 3 sentences, the last two arguing with a reader who isn't there:
/**
 * A value starting with `-` would be read as a flag instead of the flag's value — the injection
 * shape SonarCloud flags where a flag's value is untrusted text (a typed title, a picked label).
 * `run` can't check this itself since it also carries real flags like `--title`, so callers like
 * `createIssue` call this on just their untrusted values.
 */

// After — the fact that can't be reconstructed from the code, and nothing else:
/** A value starting with `-` is read as a flag, not a value — the injection shape SonarCloud flags. */
```

The second and third sentences go because the next reader can reconstruct both from the signature:
that `run` takes real flags is visible at its call sites, and that callers pass untrusted values is
what the `field` parameter is for. What survives is the one thing the code cannot say — that a
scanner flagged this shape.

The order to work in, worst ratio first. A file at or under roughly 1 comment line per 15 of code is
done:

| File | Comment / code | Over-cap blocks |
| --- | --- | --- |
| `shared/adapters/exec.ts` | 13 / 12 | 2 |
| `dev/adapters/nx.ts` | 13 / 10 | 2 |
| `drift/adapters/git.ts` | 13 / 15 | 2 |
| `issue/domain/branch.ts` | 11 / 11 | 1 |
| `shared/adapters/git.ts` | 6 / 6 | 1 |
| `shared/errors.ts` | 6 / 2 | 1 |
| `ship/adapters/git.ts` | 11 / 18 | 1 |
| `dev/adapters/pnpm.ts` | 10 / 19 | 2 |
| `shared/adapters/cache.ts` | 23 / 43 | 1 |
| `shared/adapters/io.ts` | 16 / 30 | 2 |
| `ship/adapters/gh.ts` | 20 / 51 | 0 |
| `shared/cli.ts` | 21 / 57 | 2 |
| `map/domain/capabilities.ts` | 28 / 82 | 2 |

The remaining 21 files are already at or near the house range; `map/domain/render.ts` (2 / 70) and
`issue/pick.ts` (6 / 144) are the in-package models of what the rest should look like.

The 26 over-cap blocks, for the sentence-level pass — the cap is *one sentence, two at most*, counted
by sentence and not by line, so a two-sentence block wrapped over five lines is already compliant:

`map/domain/capabilities.ts:102` (4 sentences), `dev/index.ts:5` (4), then three-sentence blocks at
`drift/adapters/git.ts:4` and `:28`, `dev/adapters/nx.ts:8` and `:19`, `dev/adapters/pnpm.ts:6` and
`:30`, `ship/domain/report.ts:6`, `ship/adapters/git.ts:7`, `shared/cli.ts:30` and `:66`,
`shared/adapters/io.ts:4` and `:14`, `shared/adapters/git.ts:10`, `shared/adapters/exec.ts:4` and
`:17`, `shared/adapters/gh.ts:12`, `shared/adapters/cache.ts:15`, `shared/errors.ts:1`,
`map/adapters/files.ts:85`, `map/domain/capabilities.ts:69`, `issue/domain/search.ts:1`,
`issue/domain/branch.ts:6`, `issue/adapters/git.ts:3`, `issue/add.ts:31`.

Forecloses nothing. The layer rule stays convention rather than lint, on the evidence that it is
being followed without enforcement — which is the first time that claim has been checked rather than
assumed, and is the thing to re-check before anyone spends the `eslint.config.ts` to enforce it.

## Confirmation

The seven defects:

```sh
grep -rn "pnpm setup" README.md docs/FEATURES.md infrastructure/scripts/src   # empty
grep -rn "^const nxPath" infrastructure/scripts/src                           # empty
pnpm docs:map --check                                                         # passes
```

The four architecture invariants are the four greps in Result, all of which must stay empty; they
are the check this report adds, and they are cheap enough to re-run by hand on any change to the
package.

The test work is confirmed by the layer split rather than by the headline percentage, which stays low
by design while `adapters/` goes untested. `pnpm exec nx test:coverage @monorepo/scripts` reports
**`domain/` at 272/279 statements (97.5%) and the command layer at 320 statements**, below the 335
statement baseline.

0009's sweep is confirmed the way 0009 already specified — this package landing in the 4–6%
comment-line-to-code-line band — with the count reproducible as comment lines over code lines across
non-spec files under `infrastructure/scripts/src`. **5.16% today; 0009 remains `to-implement`** until
its separate developer-portal confirmation passes.
