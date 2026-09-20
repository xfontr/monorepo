---
issue: 66
status: implemented
decision: accepted
---

# 🧭 The developer portal's flaws are duplicated facts, not bad code

## Context

[`apps/developer-portal`](../../apps/developer-portal/README.md) was written end to end by an agent
and never reviewed. #66 asks whether the result is structurally sound before more work lands on it,
and names six worries: crappy code, a real architecture or only a described one, documentation,
boundaries — the app shells out to `nx` and `git`, which no other app does — and a UI layer too
thick or too coupled to work on.

The framing assumes the flaws are where vibe-coded flaws usually are, in the code. They are not.

## Result

**The architecture is sound and honestly implemented; every defect found is a fact written down
twice.** The three-layer split the README claims — `shared/` pure and specced, `tools/` node-only,
`app/` neither — holds under measurement: nothing under `app/` or `server/` imports `tools/`, and
nothing under `shared/` imports `node:`. So the `nx` and `git` knowledge is already quarantined
where it cannot reach a browser bundle. The `git` allowlist, the `tryRun` isolation and the
absent-is-its-own-state discipline in the collectors are the best code in the app.

The six worries, answered:

| Worry | Finding |
| --- | --- |
| Crappy code | No. One real duplication — `StatTile.vue` writes its template twice for the link and non-link branch, where `StatusPill.vue` beside it does it correctly with `<component :is>` |
| Architecture, and is it real | Real. Verified by grep, not by reading the README |
| Boundaries | Respected, and only by discipline. Nothing stops `app/**` importing `tools/lib/run.ts`, which spawns processes |
| UI too thick | The opposite — under-componentised. Five components for thirteen pages, the same raw `<table>` scaffolding hand-written four times. Business logic is already out in `shared/` and specced; only the markup never got extracted |
| Documentation | The 312-line README describes the design accurately, except where the code drifted out from under it — rows 1 and 3 below |
| Tests | `shared/` is well specced. `app/utils/format.ts` is four pure functions at 0%. The suite itself is #67, blocked by this |

### The duplicated facts

Each row is one change. Line numbers are as of this report.

| # | Where | What is wrong | The change |
| --- | --- | --- | --- |
| 1 | `app/pages/projects.vue:35` | Links the portal's Deploys button at `docs-deploy.yml`; the workflow is `developer-portal-deploy.yml`. The rename reached the workflow and the README, not the code | Correct the filename. It is a dead link on a live page |
| 2 | `nuxt.config.ts:40` | Prerender `ignore` is the literal `/monorepo/storybook/`, hardcoding the repository name the README says is never written down | Derive it from `process.env.NUXT_APP_BASE_URL` (the deploy workflow sets it), defaulting to `/` |
| 3 | `app/pages/projects.vue:29,33,35,41,45,47` | Four functions switch on `"@monorepo/ui"`, `"@monorepo/huella-legal"` and `"@monorepo/developer-portal"`. The page is built from the Nx graph *except* its links, which are a hand-kept catalog beside it | Replace the four switches with one `Record<string, { storybook?, deploys?, environment? }>` const at the top of the file, keyed by project name |
| 4 | `shared/issues.ts:93` and `shared/deployments.ts:24` | `issuesApiUrl` and `deploymentsApiUrl` are the same parse, the same `.git` strip and the same null contract, specced twice | Extract `repoApiUrl(repoUrl, resource)` into a new `shared/github.ts`; both call it. Keep the two named wrappers so the specs and call sites are unchanged |
| 5 | `shared/types.ts:201,215` | `Issue` documents itself as "what `gh issue list --json` hands over" and `IssuesArtifact` as "null when `gh` answered". The `gh` read was deleted when issues moved into the browser; a comment asserting behaviour that no longer exists is worse than none | Move both into `shared/issues.ts` (they are not snapshot artifacts — nothing collects them), rename `IssuesArtifact` to `IssuesRead`, and rewrite the two comments to describe the browser fetch |
| 6 | `app/components/StatTile.vue:17-72` | The whole template is written twice, once under `<NuxtLink v-if="to">` and once under `<div v-else>` | One `<component :is="to ? 'NuxtLink' : 'div'">`, as `StatusPill.vue:16` already does |
| 7 | `app/pages/projects.vue` | 38 ESLint warnings, every one of them in this file — it is the only page not formatted like the rest | `pnpm exec eslint app/pages/projects.vue --fix`, then hand-fix the ~11 that remain |

### Every prerendered route ships the whole snapshot

`app/layouts/default.vue:6` awaits `useSnapshot()` to render one nav badge, and the layout wraps
every page. `/issues` — whose entire content is fetched from GitHub in the browser, and which reads
no artifact at all — prerenders to **77,950 bytes**, all of it the collected snapshot. So do all 111
routes: 10.8 MB of payload, roughly 8.7 MB of it the same JSON repeated. This is the defect the
README already describes fixing once, for the search index that rode in at 725 KB a payload; moving
that index out left the snapshot behind it.

Two changes, in this order:

1. **Stop the layout reading the snapshot.** It needs one number: `advisories` at
   `default.vue:10`, for the Dependencies badge. Add a `server/api/badges.get.ts` returning only the
   counts the nav shows, and point the layout at it. This alone empties `/issues` and `/reviews`.
2. **Split `/api/snapshot` into one route per artifact**, so a page fetches only what it reads —
   `/scorecards` pulls 10 KB instead of 78 KB, `/coverage` 7 KB, `/deps` 24 KB. `useSnapshot()`
   becomes `useArtifact("docs")` and friends; `SnapshotAge` still needs the manifest, which is 836
   bytes and can stay on every page.

The ~100 wiki routes still pull the whole `docs` artifact to render one page's word count. That is
the residue, and it is worth measuring again after step 2 before deciding whether to add a per-page
lookup — do not attempt it in the same change.

### 37% of the snapshot is never rendered

Eleven collected fields have no reader anywhere in `app/` or `server/`. Remove each from
`shared/types.ts` and from the collector that writes it:

| Field | Artifact | Written by |
| --- | --- | --- |
| `headings` — 14,751 bytes, a third of `docs.json` | `docs` | `tools/collect/docs.ts` |
| `deferred`, `project` | `docs` | `tools/collect/docs.ts` |
| `edges`, `targets`, `private` | `projects` | `tools/collect/graph.ts` |
| `specRatio`, `sources`, `hasReadme`, `hasAgentMd` | `metrics` | `tools/collect/metrics.ts` |
| `boundaryViolations` | `metrics` | `tools/collect/metrics.ts` |
| `vulnerableVersions`, `dependencyType` | `deps` | `tools/collect/deps.ts` |

`boundaryViolations` is the expensive one: removing it also deletes the `boundaryViolations()`
function in `metrics.ts`, which runs `pnpm exec eslint .` once per project and is most of `collect`'s
45 seconds. Nothing shows the number. `edges` is read nowhere despite the name appearing in a heading
on `graph.vue:62` — that is prose, not a binding.

### The boundary that nothing enforces

Add a `no-restricted-imports` rule to `@monorepo/configs` forbidding `app/**` and `server/**` from
importing `tools/**`, modelled on
[`coreIsolation.ts`](../../packages/configs/src/eslint/lib/coreIsolation.ts), which this repo already
uses for exactly this kind of intra-project layer split. Nothing violates it today; the rule is what
keeps that true.

## Options considered

| Option | Why not |
| --- | --- |
| Rewrite the app | The architecture is the part that is right. A rewrite discards the specced `shared/` layer and the collectors to fix link text and a nav badge |
| Write the tests first (#67) | Tests would pin `issuesApiUrl` and `deploymentsApiUrl` separately and pin a snapshot shape 37% of which nothing reads. #67 is blocked by this for that reason |
| Enforce the `app/` ↔ `tools/` split with a new Nx tag | The split is inside one project; Nx boundaries are between projects |
| Keep the unread fields for a future page | Each is a build input, a payload byte and a typed promise to a reader. The collector is the cheapest thing here to add a field back to |
| Split `/api/snapshot` per artifact and stop there | Fixes the pages that read one artifact; leaves the ~100 wiki routes pulling all 260 doc records for one word count. It is still the right first step, just not the whole fix |
| Extract a shared table component for the four raw `<table>`s | Real, but cosmetic next to the two structural findings, and it touches four pages at once. Worth its own issue, not this one |

## Consequences

The app stops being a counter-example to the rule it exists to enforce.

**Order.** Rows 1–7 first: they are independent, one file each, and none depends on the others. Then
the unread fields, then the layout and the `/api/snapshot` split — that order, because dropping the
fields shrinks what the split still has to carry. The lint rule last, once nothing would trip it.

**Tripwires an implementer will hit.**

- `.claude/hooks/check-invariants.sh` hard-blocks any write containing a literal endpoint or host. It
  fires on row 2 and on anything deriving a `github.io` URL — including `projects.vue:53`, which
  already does. Leave that line alone in this change; it predates the rule and removing it needs the
  Pages URL to come from the deployments read instead.
- Rows 2, 3 and 5 change what the README describes. Re-read it against the code afterwards and use
  the `doc-drift-check` skill; README edits follow `house-docs`.
- `pnpm exec nx check-docs @monorepo/developer-portal` runs in CI and fails on a broken relative link,
  so a moved file breaks the build, not just a page.
- `@monorepo/configs:lint` fails locally with a `MODULE_NOT_FOUND` on `nx@23.2.0`. Pre-existing,
  unrelated, not yours to fix — run `pnpm exec eslint .` inside the app instead.
- **Do not** add `shared/**` to the coverage `include` in `@monorepo/configs` while doing this. It is
  why the app reports 24% while its best-tested layer counts for nothing, but it is a workspace-wide
  input that moves every project's number and belongs in its own change.

This gets revisited if a page ever needs a field dropped here, or if the snapshot grows a second
consumer; today it has exactly one.

## Confirmation

| Claim | Check |
| --- | --- |
| No workflow filename or repo name in the code | `grep -rn "docs-deploy\|/monorepo/" apps/developer-portal/app apps/developer-portal/nuxt.config.ts` returns nothing |
| No project name switched on outside the link table | `grep -n '@monorepo/' apps/developer-portal/app/pages/projects.vue` returns only the const |
| The endpoint derivation exists once | `grep -rn 'api\.\${' apps/developer-portal/shared` returns one hit |
| A page that reads no artifact carries none | `pnpm exec nx build-static @monorepo/developer-portal`, then `wc -c apps/developer-portal/.output/public/issues/_payload.json` is far below the 77,950 bytes measured here |
| Nothing collects a field nothing reads | Every field name in `shared/types.ts` greps in `app/` or `server/` |
| The layer split is enforced | Adding `import { git } from "../../tools/lib/run.ts"` to any file under `app/` fails `pnpm exec eslint .` |
| The app is formatted like the rest of the repo | `pnpm exec eslint .` in `apps/developer-portal` reports 0 warnings, against 38 today |
| Nothing regressed | `pnpm exec nx run-many -t test typecheck --projects=@monorepo/developer-portal` passes, and `pnpm exec nx collect @monorepo/developer-portal` still writes a full snapshot |
