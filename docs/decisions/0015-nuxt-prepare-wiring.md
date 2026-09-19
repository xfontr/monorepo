---
issue: 120
status: implemented
decision: accepted
---

# 🧭 `.nuxt` is repaired where it's used, not wired target by target

## Context

#117 fixed a CI failure: `test:coverage` ran in both Nuxt apps without `.nuxt`, so Vite's oxc
transform threw `Tsconfig not found: .nuxt/tsconfig.app.json` in `huella-legal`, while in
`developer-portal` the same missing file first surfaced as a wave of `@vitest/coverage-v8` "Failed to
parse … Excluding it from coverage" noise before failing on the identical error further down. The
fix was one line in [`nx.json`](../../nx.json) — `"dependsOn": ["nuxt-prepare"]` on the
`test:coverage` target default, which `lint`, `typecheck` and `test` already carried.

The question is how to stop the next one, since the same omission is available to every target
added and every Nuxt app added. Two candidates were proposed: an invariant check in the shape this
repo already uses for cross-file rules, or the local `createNodesV2` plugin
[`CLAUDE.md`](../../AGENTS.md) earmarks for "if a **third** one lands".

## Result

**Neither proposal is sized to the problem, because the target list is not enumerable by hand and
the task graph is not where most of the breakage is reachable from.** Every claim below was measured
by moving `apps/developer-portal/.nuxt` aside and running the target cold.

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
target per file — eight in `developer-portal` today, `test-ci--shared/wiki.spec.ts` and siblings — named
at graph-computation time, and each one fails cold. `targetDefaults` cannot reach them: adding both
`"test-ci"` and `"test-ci--*"` applied the first and left every atomized target at
`dependsOn: null`. Glob keys are not target defaults.

**3. Those eight are latent, not live.** `nx run @monorepo/developer-portal:test-ci` refuses outright —
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

**One change is adopted, and it is neither of the two proposed.**
[`@monorepo/configs`](../../packages/configs/README.md) ships the `nuxi prepare` `globalSetup` as
`.mjs`, carried by the preset every project's `vitest.config.ts` already calls. That closes findings
1, 2, 4 and 6 at once — every Vitest target, inferred or hand-written, inside the graph or outside
it — and it makes the four `dependsOn: ["nuxt-prepare"]` entries on `test` and `test:coverage`
redundant, so they come out of [`nx.json`](../../nx.json) with it. `lint` and `typecheck` keep
theirs: neither is Vitest, and `eslint` is measured failing cold.

**No check is adopted.** One was built — a `compareNuxtPrepare` beside the mirrored invariants in
`apps/developer-portal`, asserting that a `nuxt.config.ts` project declares the script and that every
tsconfig-reading target of one carries the edge — and it was removed. Two reasons, in order. It was
in the wrong project: an Nx build-graph rule reaching across the workspace from inside an app, gating
a target called `check-docs`, where the existing invariants at least have a dashboard that renders
them. And once the self-heal landed, the half of it worth having was the one assertion the graph
can't make — a Nuxt app with no `nuxt-prepare` script — for which the symptom is already a red
`lint`, and the remedy 150 lines of checker for a three-word `package.json` entry.

## Options considered

| Option | Why not |
| --- | --- |
| The invariant check (built, then removed) | Finding 2: over every target its only live findings are the eight atomized ones, which have no expressible fix, so the first thing it earns is a permanent allowlist entry. Narrowed to what the self-heal leaves — a project missing the script — it is 150 lines guarding a three-word `package.json` entry whose absence already turns `lint` red |
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

The self-heal trades a graph edge for a runtime check, and two costs come with that. A Vitest run
that finds no `.nuxt` pays `nuxi prepare` itself — 1.8s in `developer-portal` — instead of reusing the
cached `nuxt-prepare` output. And because `test` no longer waits on that task, a run that includes
`lint` can have Nx preparing for `lint` while Vitest prepares for itself, two `nuxi prepare`
processes writing one directory. Neither has bitten; the second is the one to watch, and re-wiring
`test` alone undoes it.

The `.mjs` extension is load-bearing and silent — the one fact about this that can't be
reconstructed from reading it, and therefore the one comment it gets.

Revisit if Nx Cloud is adopted, which turns finding 3's eight latent targets live and leaves the
self-heal as the only thing covering them; or if a tool outside Vitest and outside Nx starts
resolving the app `tsconfig.json`, which is the case nothing here reaches. Finding 5 stays open by
choice: a Nuxt app added without a `nuxt-prepare` script still fails `lint` with a parse error on
every file and nothing names the cause.

## Confirmation

Delete both `apps/*/.nuxt` and run `pnpm exec nx run-many -t test test:coverage`, then
`pnpm exec vitest run` from inside either app directory. All of it passes with no `nuxt-prepare`
edge anywhere near a Vitest target, and the second is the one no task-graph wiring can make pass.
The check that would fail if the decision stopped holding is the same one that proved the bug:
`.nuxt` deleted, `nx run <app>:test:coverage` green.

`grep nuxt-prepare nx.json` is the other half — `lint` and `typecheck` only. A third entry appearing
there means a Vitest target was re-wired by hand, which is this decision being reversed rather than
applied.
