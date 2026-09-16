---
issue: 117
status: to-implement
decision: accepted
---

# 🧭 `.nuxt` is repaired where it's used, not wired target by target

## Context

#117 fixed a CI failure: `test:coverage` ran in both Nuxt apps without `.nuxt`, so Vite's oxc
transform threw `Tsconfig not found: .nuxt/tsconfig.app.json` in `huella-legal`, while in
`tech-docs` the same missing file first surfaced as a wave of `@vitest/coverage-v8` "Failed to
parse … Excluding it from coverage" noise before failing on the identical error further down. The
fix was one line in [`nx.json`](../../nx.json) — `"dependsOn": ["nuxt-prepare"]` on the
`test:coverage` target default, which `lint`, `typecheck` and `test` already carried.

The question is how to stop the next one, since the same omission is available to every target
added and every Nuxt app added. Two candidates were proposed: an invariant check in the shape this
repo already uses for cross-file rules, or the local `createNodesV2` plugin
[`CLAUDE.md`](../../CLAUDE.md) earmarks for "if a **third** one lands".

## Result

**Neither proposal is sized to the problem, because the target list is not enumerable by hand and
the task graph is not where most of the breakage is reachable from.** Every claim below was measured
by moving `apps/tech-docs/.nuxt` aside and running the target cold.

**1. One cause, three error messages.** Both apps' `tsconfig.json` is `files: []` plus `references`
into `.nuxt/`, so anything that resolves it fails when the directory is absent — the tool decides
only what the error looks like:

| Target | Cold failure |
| --- | --- |
| `test`, `test:coverage`, `test:dev`, `test-ci--<spec>` | `[TSCONFIG_ERROR] Failed to load tsconfig '.nuxt/tsconfig.app.json'` from `vite:oxc`, at transform time |
| `eslint:lint` | `app.vue was not found by the project service`, once per file, after 11.4s |

So this is not a vitest problem with a vitest fix. Any future target that opens the app's
`tsconfig.json` joins the list.

**2. The targets can't be listed, because Nx mints them.** `@nx/vitest` atomizes specs into one
target per file — eight in `tech-docs` today, `test-ci--shared/wiki.spec.ts` and siblings — named
at graph-computation time, and each one fails cold. `targetDefaults` cannot reach them: adding both
`"test-ci"` and `"test-ci--*"` applied the first and left every atomized target at
`dependsOn: null`. Glob keys are not target defaults.

**3. Those eight are latent, not live.** `nx run @monorepo/tech-docs:test-ci` refuses outright —
*"should only be run with Nx Cloud"* — and Nx Cloud was rejected in
[`0005`](./0005-nx-generators-and-ai-agent-setup.md). An edge on the aggregate would not help
anyway: Cloud dispatches the atomized tasks directly, so a `dependsOn` on their parent never
applies to them.

**4. One hole is live today: `test:dev`.** It's a `package.json` script in both apps with no target
default, and it fails on 8 of 8 spec files cold. The same class as #117, unfixed, and it predates
it.

**5. A `dependsOn` naming a target the project lacks is silently dropped.**
`@monorepo/content` has no `nuxt-prepare` script and still shows `dependsOn: ["nuxt-prepare"]` on
`test` and `test:coverage`; nothing errors, which is why the workspace-wide defaults are safe. The
cost is that `CLAUDE.md`'s manual step — a new Nuxt app "needs the script added by hand" — fails
silently rather than loudly: the wiring reads as present and does nothing.

**6. The graph only protects what runs through it.** `pnpm exec vitest run` inside the app
directory fails identically. On a fresh clone that is the first thing a newcomer's editor or test
runner does, and no `dependsOn` in any shape reaches it.

**7. Vitest can repair it itself — in `.mjs` only.** A `globalSetup` that runs `nuxi prepare` when
`.nuxt/tsconfig.app.json` is missing took a cold spec from failing to green, 2.8s end to end
including Nx's own overhead. Written as `.ts` it fails **before it runs**: the setup file is itself
transformed by the oxc pipeline it exists to repair, and the error just moves onto it. Referenced
as a package specifier
(`@monorepo/configs/vitest/prepareNuxt`) it resolves and works, so it lives once in
[`@monorepo/configs`](../../packages/configs/README.md) rather than once per app — where it becomes
that package's first non-TypeScript export, against a `CLAUDE.md` that describes it as shipped as
raw TypeScript. No build step is involved either way; it is still source.

**8. A local plugin can attach the edge but cannot find the names.** A `createNodesV2` over
`**/nuxt.config.ts` merged `dependsOn: ["nuxt-prepare"]` onto both `test:dev` and an atomized
`test-ci--<spec>` target inferred by another plugin — merging is not the obstacle. Discovering
those names is: it takes either re-implementing `@nx/vitest`'s atomization or wrapping the
`createNodesV2` it exports, both of them a hard dependency on another package's internals.

**Three changes are adopted, and none of them is a plugin.**

| Change | Closes |
| --- | --- |
| `test:dev` gets `"dependsOn": ["nuxt-prepare"]` in [`nx.json`](../../nx.json) | Finding 4 — the live hole |
| `@monorepo/configs` ships the `nuxi prepare` `globalSetup` as `.mjs`, and both apps' vitest configs declare it | Findings 1, 2, 6 — every vitest target, inferred or hand-written, inside the graph or outside it |
| An invariant over `nuxt.config.ts` ↔ `nuxt-prepare`, in [`invariants.ts`](../../apps/tech-docs/tools/lib/invariants.ts) | Finding 5 — and the next hand-written target that forgets the edge |

The invariant asserts two things and deliberately stops there: a project with a `nuxt.config.ts`
declares a `nuxt-prepare` script, and every target that project defines **by hand** — a
`package.json` script, excluding `nuxt-prepare` itself, the `nuxt`-run `dev`/`serve`/`preview`/
`build` family that prepares internally, and the vitest family the change above covers — carries the
edge. Scoping it to hand-written targets is what keeps it honest: those are the ones a person can
actually fix. It goes where the other mirrored invariants already live, so it runs in CI through
`pnpm exec nx check-docs @monorepo/tech-docs` and in the `PostToolUse` hook, with no new script and
no new project.

## Options considered

| Option | Why not |
| --- | --- |
| The invariant check alone, over every target | Finding 2: its only live findings would be the eight atomized targets, which have no expressible fix — so the first thing it earns is a permanent allowlist entry, and the check that follows protects nothing outside the graph (finding 6) |
| A local Nx plugin injecting the edge into every target | Finding 8: attaching works, enumerating doesn't. Buying the inferred targets means coupling to `@nx/vitest`'s internals — the failure [`0005`](./0005-nx-generators-and-ai-agent-setup.md) already recorded for `nx_project_details` against Nx 23 — to protect tasks only Nx Cloud can run |
| A `"test-ci--*"` glob key in `targetDefaults` | Measured: no effect. The exact `"test-ci"` key beside it applied, so this isn't a caching artefact |
| `"test-ci"` with the edge, letting it cover its children | Finding 3: the target refuses to run without Nx Cloud, and Cloud runs the atomized tasks directly rather than through their parent |
| A `.ts` `globalSetup` | Finding 7: transformed by the pipeline it repairs, so it fails before its first line runs |
| Point vitest at a tsconfig that always exists | Vite 8's `OxcOptions` is `Omit<TransformOptions, … \| "tsconfig" \| …>` — the path isn't configurable, and `oxc: false` would disable the TypeScript transform altogether |
| A `postinstall` running `nuxi prepare` | Lifecycle scripts are banned here and both workflows install with `--ignore-scripts`; it would work locally and do nothing in CI |
| Commit `.nuxt` | A generated tree of hundreds of files, regenerated by every `nuxt` command, in a repo where `nx release` already owns what's derived |

## Consequences

`CLAUDE.md`'s `.nuxt` paragraph goes stale twice over when this lands: it names four targets that
`dependsOn` `nuxt-prepare`, and it earmarks the plugin this report retires. Both are part of the
work, not follow-up — that paragraph is the repo's own "two places that must agree" class.

The self-heal trades a graph edge for a runtime check. For the targets that keep the edge nothing
changes; for the ones that don't, a cold run pays a `nuxi prepare` — 1.8s in `tech-docs` — rather
than reusing the cached `nuxt-prepare` output, and two vitest processes in one app could prepare
concurrently. The
`.mjs` extension is load-bearing and silent — the one fact about it that can't be reconstructed from
reading it, and therefore the one comment it gets.

Revisit if Nx Cloud is adopted, which turns finding 3's eight latent targets live and leaves the
self-heal as the only thing covering them; or if a tool outside vitest and outside Nx starts
resolving the app `tsconfig.json`, which is the case neither change reaches.

## Confirmation

None of the three changes is in the repo yet, so both checks below describe how they will be
verified once they land.

Once the invariant exists, `pnpm exec nx check-docs @monorepo/tech-docs` fails when a project with
a `nuxt.config.ts` has no `nuxt-prepare` script, or when a hand-written target of one lacks the
edge — that is the check for changes 1 and 3, and it already runs in CI.

Change 2 is checked cold: with both `apps/*/.nuxt` deleted, `pnpm exec nx run-many -t lint
typecheck test test:coverage` passes, and so does `pnpm exec vitest run` from inside either app
directory. The second is the one no task-graph wiring can make pass, and it fails today.
