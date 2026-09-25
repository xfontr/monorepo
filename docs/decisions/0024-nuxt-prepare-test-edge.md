---
issue: 144
status: implemented
decision: accepted
---

# 🧭 `test` waits on `nuxt-prepare` again, beside the Vitest self-heal

## Context

[`0015`](./0015-nuxt-prepare-wiring.md) moved `.nuxt` repair into a Vitest `globalSetup`
([`prepareNuxt.mjs`](../../packages/configs/src/vitest/prepareNuxt.mjs)) and took every
`dependsOn: ["nuxt-prepare"]` off the Vitest targets in [`nx.json`](../../nx.json), leaving it on
`lint` and `typecheck` only. Its Confirmation named a third entry in `nx.json` as the sign of that
decision being reversed. While working on #144, a test run failed on a missing `.nuxt` with the
self-heal in place, and `f51a6b3` put the edge back on `test`. The failing run wasn't kept.

## Result

**Both mechanisms are in place, and neither replaces the other.**

| Mechanism | Covers |
| --- | --- |
| `targetDefaults.test.dependsOn: ["nuxt-prepare"]` in `nx.json` | Every `test` task Nx schedules, including the ones `pnpm test` and pre-push run. `.nuxt` exists before Vitest starts, so `prepareNuxt.mjs` finds it and does nothing |
| `prepareNuxt.mjs` in every Vitest preset | What never enters the task graph through `test`: `test:coverage`, the per-spec targets `@nx/vitest` generates, and a bare `pnpm vitest` |

`nuxt-prepare` now appears on `lint`, `typecheck` and `test`. `test:coverage` still has no edge.

A side effect worth having: 0015 flagged two `nuxi prepare` processes writing one `.nuxt` when a run
included both `lint` and `test`. With both tasks waiting on the same `nuxt-prepare` task, that race is
gone for `test`.

## Options considered

| Option | Why not |
| --- | --- |
| Find out why the `globalSetup` missed, and fix it there | The failing run wasn't kept, so there was nothing to diagnose, and the edge is one line 0015 had already measured working |
| Drop the self-heal now that the edge is back | 0015's findings 1, 2, 4 and 6 still hold: targets outside `test`, and a bare `pnpm vitest`, never wait on any graph edge |
| Add the edge to `test:coverage` too | It hasn't failed, and `pnpm quick-start` runs it cold on a fresh clone, where the self-heal already covers it |

## Consequences

The root `AGENTS.md` paragraph on `.nuxt` names three edges now, not two. 0015 is marked superseded
by this report: its finding and measurements stand, and only its "`test` carries no edge" outcome is
reversed.

A new Nuxt app still needs a `nuxt-prepare` script by hand. Nx silently drops an edge to a target a
project doesn't have, so without the script `test` falls back to the self-heal, and `lint` fails on
every file.

Revisit if the failure comes back with the edge in place. That would mean something outside both
mechanisms is reading the app `tsconfig.json`.

## Confirmation

| Claim | Check |
| --- | --- |
| Three edges, not four | `grep -n -B3 '"nuxt-prepare"' nx.json` lists `lint`, `typecheck` and `test`, and not `test:coverage` |
| The self-heal still covers what the graph can't | Delete `apps/*/.nuxt`, then run `pnpm exec vitest run` inside either app. It passes |
