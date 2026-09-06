# 🧭 Where a blackboard-style pattern would actually help

Spike: #38
Status: To implement

## Context

No issue raised this — it came out of a conversation prompted by Martin Fowler's
[*An accidental blackboard*](https://martinfowler.com/articles/exploring-gen-ai/an-accidental-blackboard.html),
which describes the blackboard pattern (Hearsay-II, tuple spaces): independent producers and
consumers coordinate through small labelled facts in a shared space, rather than through direct
calls or deeply threaded state. The question was whether this repo has coordination problems that
shape fits — places where components agree on state through tight coupling or hand-kept-in-sync
duplication, across a package or module boundary, that a shared-fact model would actually
decouple.

## Result

**The pattern already exists here, unnamed, in two places**, which is the first finding: OpenTelemetry's
`traceparent` propagation in [`@monorepo/observability`](../../packages/observability/README.md) lets
a browser span and a server span agree on one trace with no call between them, and
[`apps/dashboard`](../../apps/dashboard/README.md)'s `.report/` snapshot lets `tools/collect` write
once and every page, composable and `server/api/` route read a slice, with neither side calling the
other.

**The one real opportunity is the doc-duplication problem CLAUDE.md already names as this repo's
standing failure mode** — the Nx tag table copied by hand into both
[`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts) and the root README, the
workspace-layout block, and the `docs/reviews` history table. Today each pair is two independent
copies kept honest only by a `PostToolUse` hook diffing them after an edit. That is exactly the
gap the blackboard framing names: no single written fact, two copies standing in for one, agreement
enforced after the fact instead of by construction. The repo has already fixed this once, for
`docs/FEATURES.md` — nothing hand-edits it, `pnpm docs:map` renders it from source, and CI runs
`--check` — it just hasn't been extended to the other three duplicated tables.

**Everywhere else examined, it would add indirection without removing real coupling.** The
branch-name convention parsed independently by `.husky/commit-msg`, `.github/workflows/pr-metadata.yml`
and `infrastructure/scripts/src/issue` looked like a candidate, but it is duplicated *derivation
logic* (a regex), not duplicated *state* — the two call sites already cross-reference each other in
comments, and a written fact would add a new drift risk (the fact going stale if a branch is
renamed) that doesn't exist today. `apps/huella-legal`'s Nitro `h3App.handler` wrapper is tight
coupling to a framework internal, but it has exactly one producer and one reason to exist — OTel's
`HttpInstrumentation` cannot patch `node:http` under this ESM build — so there is no second
consumer to decouple it for. And splitting the dashboard's `.report/` snapshot into independent
per-feature facts would not remove any coupling either, because `tools/collect` is already the
single producer for all of it.

`@monorepo/content` and `@monorepo/i18n` were also checked, on the original hunch that Nuxt
assumptions leak into their domain logic — they don't: both already enforce a framework-agnostic
`core/` behind ports and adapters, with the Nuxt module as a separate entry point `core/` cannot
see, checked by module resolution rather than discipline. `apps/huella-legal` has no
`app/layers/` yet, so there is no feature-level state coordination in the app tier to evaluate —
that's a question for whenever the first layer lands, not now.

## Options considered

| Option | Why not |
| --- | --- |
| Apply the pattern broadly across package/app boundaries | Most candidates surveyed either already avoid the coupling by design (`content`, `i18n`, `ui`) or don't have enough feature code yet to coordinate anything (`huella-legal` has no layers) |
| Turn the branch-name convention into a written, committed fact | Fixes duplicated logic with a new duplicated *state* problem — the fact can drift from the branch name it describes. Extracting the regex into one shared script both environments call is cheaper and doesn't introduce that risk |
| Split the dashboard's `.report/` snapshot into independent per-feature facts | There is only one producer (`tools/collect`) for the whole snapshot today; splitting the storage removes no coupling because there was never more than one writer to decouple from |
| Decouple `apps/huella-legal`'s observability plugin from `nitroApp.h3App.handler` | Single producer, single consumer, coupled to a framework limitation with no workaround today — there is nothing on the other side of the indirection |

## Consequences

Unlocks widening `pnpm docs:map` to render the boundary table, the workspace-layout block and the
reviews history table the same way it already renders `docs/FEATURES.md` — a single written source
per table, checked in CI, instead of three hand-kept-in-sync copies whose only defence is a hook
noticing after the fact.

Forecloses hand-editing those three spots directly, the same trade `docs/FEATURES.md` already made:
whoever changes a tag or adds a project edits the source and re-renders, rather than editing the
README section in place.

Revisit this once `apps/huella-legal` grows its first `app/layers/` entry, or once a package
actually starts using the reserved `type:feature`/`type:domain` tags — that is the point where
real cross-boundary state coordination in the app tier would exist to evaluate, and today it
doesn't yet.
