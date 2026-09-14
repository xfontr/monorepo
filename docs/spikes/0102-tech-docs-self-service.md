# 🧭 What tech-docs can do before it needs an auth story

Spike: #102
Status: To implement

## Context

tech-docs is documented as a pure leaf/reader — `type:app scope:internal`, imports nothing but
`@monorepo/configs`, nothing imports it, never built or deployed, and its only store is a
disposable, rebuild-from-scratch `.report/` snapshot. Recent discussion floated giving it real
actions: an `nx` run panel (lint/test/build/typecheck per project), deploy status and eventually
deploy triggers for `huella-legal`, and a feature-flag/analytics vendor integration, following the
vendor-config shape `@monorepo/content` and `@monorepo/i18n` already use. Each of those reads as in
tension with the "reads only, holds no credential, never acts" posture the boundary and the app's
own README commit to.

## Result

The five capabilities don't share one blocker — they split on a question the original framing
conflated: **the `type:app` boundary tag governs import edges, not execution.**
[`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts) stops tech-docs from
`import`ing a workspace package it isn't allowed to; it says nothing about spawning a child process
or calling an external API, and it never has. Nothing in that config, or in
[`.claude/settings.json`](../../.claude/settings.json), or anywhere else in the repo restricts what
tech-docs is allowed to *do* at runtime — the "reader, not actor" posture is a design choice written
in prose, not an enforced boundary today.

Given that, what actually gates each capability is whether it needs a credential or an authenticated
actor distinct from "whoever is running tech-docs on their own machine right now":

- **Dashboard links** (Grafana, SonarCloud, Nx Cloud) — no new capability at all. Every URL is
  assembled from env vars the app already requires (`NUXT_PUBLIC_OBSERVABILITY_URL` and siblings,
  per [`apps/huella-legal/README.md`](../../apps/huella-legal/README.md)). Nothing to decide.
- **`nx` run panel** — the first time tech-docs would execute something, but it needs no credential:
  tech-docs "runs locally only" per its own README, so the process it would spawn runs with the same
  permissions the developer already has in their shell. There is no separate actor to authorize.
- **Feature-flag/analytics vendor** — read-only, it's the same shape again: whichever vendor token
  is used stays server-side, exactly like `content`'s and `i18n`'s BFF routes keep their vendor
  tokens out of the browser. But "follow the vendor pattern" turned out to mean *copy the shape*,
  not *depend on it*: there is no shared `Vendor` package. `packages/i18n/src/core/domain/vendor.ts`
  defines its own `Vendor<T>` type, and `content` does the same independently — each package
  hand-rolls this because, per [`i18n`'s CLAUDE.md](../../packages/i18n/CLAUDE.md), a shared
  abstraction or validation library is a check-in this repo takes seriously, not a default. A third,
  tech-docs-owned vendor type is the honest continuation of that, not a regression.
- **Deploy status** — has nothing to read yet. `.github/workflows/` today holds only `ci.yml`,
  `dependabot-auto-merge.yml`, `pr-metadata.yml` and `release.yml`; there is no CD pipeline for
  `huella-legal` and no AWS or other cloud target anywhere in the repo. This isn't a boundary
  question, it's a missing prerequisite.
- **Deploy trigger and flag toggle** — the two genuine write actions, and the two that actually
  need an answer to "who is allowed to act." Searching the whole workspace for any existing
  authentication pattern (`next-auth`, `jwt`, session middleware, an `authOptions`-shaped config)
  turns up nothing in any app or package. This repo has no auth infrastructure today, for anything.
  Building one to gate a button is a materially different scope of work than everything above it.

## Options considered

| Option | Why not |
| --- | --- |
| Build an auth system now, upfront, so all five capabilities land uniformly | Nothing exists yet for it to gate — two of the five need no credential at all, and `CLAUDE.md`'s dependency rule ("say what it buys you... don't just add it") argues against infra built ahead of a write action that would justify it |
| Extract a shared `Vendor` abstraction for tech-docs to reuse from `content`/`i18n` | No such abstraction exists to extract — both packages independently chose to hand-roll validation over one shared dependency, for reasons their own READMEs argue out; a third copy for one new call site repeats that choice, it doesn't violate it |
| Treat all five capabilities as one blocked-on-auth decision and wait | Two of them (links, run panel) never touch the boundary or auth question at all; bundling them with the two that do only delays the free wins |
| Build the deploy-trigger button alongside the CD pipeline in one push | There is no pipeline to wire the button to yet — the trigger is the easy 10% once the pipeline exists, and building it first is a button with nothing behind it |

## Consequences

Unlocks the links panel and the `nx` run panel now, with no further spike needed — neither touches
the import boundary and neither needs a credential beyond the one the developer already has locally.

Forecloses nothing: a tech-docs-owned vendor type for flags/analytics doesn't commit the repo to a
shared abstraction later. If a third vendor-shaped integration shows up after this one, that
repetition is the signal to reconsider extracting one — the same "third one lands, replace the
copy-paste" rule `CLAUDE.md` already applies to the `nuxt-prepare` wiring.

Deploy status stays blocked on a CD pipeline existing at all, which is a separate decision (cloud
target, workflow shape) this spike doesn't make. Deploy trigger and flag toggle stay blocked on this
repo getting an auth mechanism it has never had — revisit both once a specific write action is
actually about to be built, not speculatively ahead of one.

Implementation is a follow-up issue rather than part of this record; none has been filed yet.
