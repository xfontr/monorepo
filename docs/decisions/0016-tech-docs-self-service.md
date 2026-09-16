---
issue: 102
status: to-implement
decision: accepted
---

# 🧭 tech-docs becomes an IDP by reading GitHub, not by installing one

## Context

tech-docs is documented as a pure leaf/reader — `type:app scope:internal`, imports nothing but
`@monorepo/configs`, nothing imports it, and its only store is a disposable, rebuild-from-scratch
`.report/` snapshot. #102 asked whether it should grow beyond that, listing an `nx` run panel,
deploy status, deploy triggers for `huella-legal` and a feature-flag/analytics vendor integration —
each in tension with the "reads only, holds no credential, never acts" posture its README commits to.

The ask has since grown past that list: tech-docs should become something closer to an internal
developer platform, and the question raised with it is whether that means installing a framework,
Backstage being the obvious candidate.

Three facts about the repo decide the answer, and all three are newer than the original framing:

| Fact | Where |
| --- | --- |
| tech-docs is built and deployed — a prerender published to GitHub Pages, no host and no secret | [`docs-deploy.yml`](../../.github/workflows/docs-deploy.yml), [`0014`](./0014-tech-docs-deployment.md) |
| `huella-legal` has a production pipeline, and every deploy is recorded as a GitHub Deployment | [`netlify-deployment.yml`](../../.github/workflows/netlify-deployment.yml) |
| tech-docs requires exactly one env var, `NUXT_PUBLIC_REPO_URL` — the observability URLs belong to `huella-legal` | [`apps/tech-docs/.env.example`](../../apps/tech-docs/.env.example) |

## Result

**The framework question answers itself, and it is not the load-bearing one.** Backstage is a second
monorepo with its own package manager: `packageManager: yarn@4.18.0` and Yarn workspaces against
this repo's pnpm catalog, a React `packages/app` against this repo's Vue, a Node `packages/backend`,
PostgreSQL for anything but local development, and a documented floor of **20 GB disk and 6 GB
memory** for the standalone install with demo data. Its docs plugin, TechDocs, renders markdown
through MkDocs — `pip install mkdocs-techdocs-core`, Python 3.11 or newer, in a Docker container by
default — and stores the output on a filesystem or an object store.

| IDP capability | What Backstage brings | What is here already |
| --- | --- | --- |
| Software catalog | `catalog-info.yaml` per component, hand-written and kept in sync | The Nx project graph, collected into `.report/` — derived, so it cannot drift |
| Docs | TechDocs: MkDocs, Python, a storage backend | The wiki, reading every tracked `*.md` in place at its own path |
| Scorecards | A plugin, scored against catalog metadata | [`SCORECARDS.md`](../reviews/README.md) and the scorecards page |
| Golden paths | Software Templates, a scaffolder backend | `new-package`, `ui:new-component`, `scripts:new-script`, `nuxt-module-route`, `pnpm issue:pick` |
| Self-service actions | The scaffolder and plugin actions, behind an auth provider | **Nothing** |

Only the last row is missing, which is what makes this a "no" worth writing down rather than a
reflex: adopting Backstage would mean reimplementing four working things in a second stack to obtain
the fifth. **Nothing else surveyed is a candidate either** — the hosted portals are paid and would
hold this repo's data in a vendor account, and the open-source platform orchestrators in this
category assume a Kubernetes control plane this workspace does not have. The honest answer to "which
dependency" is none; what blocks the capability is elsewhere.

**The `type:app` boundary tag was never the blocker, and neither is auth.**
[`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts) governs import edges, not
execution: it stops tech-docs from `import`ing a workspace package it isn't allowed to, and says
nothing about spawning a child process or calling an external API. The "reader, not actor" posture
is a design choice written in prose, not an enforced boundary.

**What blocks it is that the deployed site is frozen at build time.** Self-service actions are what
separate a portal from a dashboard, and they need an actor and a credential at the moment the button
is clicked. The mechanism is sharper than "there is no server": a prerendered route *is* answered,
once, during the build, and then baked into the payload —
[`snapshot.get.ts`](../../apps/tech-docs/server/api/snapshot.get.ts) is served exactly that way. A
route whose whole purpose is to compute something when the reader asks has nowhere to run. So the
question "does it need a credential" needs a second axis beside it, and the second one reorders the
original list:

| Capability | Needs a credential | Survives prerendering | Where that leaves it |
| --- | --- | --- | --- |
| Links out to a live surface | No | Only if baked at build time | Free, but each new URL is another `env:` entry in the deploy workflow, not a runtime read |
| Deploy status | No | Yes — a browser-side read | Free, now that a pipeline exists to report on |
| Per-project stats | No | Yes, if collected rather than fetched | Free at collect time; see the request budget below |
| `nx` run panel | No | **No** — the answer would be frozen at build | Looks like the cheapest of the five and is the only one that cannot exist on the deployed site at all — only under `pnpm dev` |
| Deploy trigger, flag toggle | Yes | No | Blocked, and blocked twice over |

**GitHub is already this repo's control plane, and reading it needs no credential.** The issues page
established the pattern — unauthenticated REST from the reader's own browser, because the repo is
public — and the same call answers for everything an IDP surface wants to show. Each of these
returns `200` unauthenticated today, and `deployments` carries both environments this repo deploys:

```sh
curl -s -o /dev/null -w "%{http_code}\n" \
  https://api.github.com/repos/<owner>/<repo>/deployments   # 200 → netlify-huella-legal, github-pages
```

`actions/workflows`, `releases` and `stats/participation` answer the same way. The actions half
resolves in the same direction: a self-service action here is a `workflow_dispatch`, and GitHub
already renders a **Run workflow** button for one, behind its own identity and its own permission
model. A link out to that button is a self-service action in which this repo still holds no
credential — the posture kept rather than traded away.

**The split that decides what gets built is collect-time versus browser-time.** Unauthenticated REST
is **60 requests an hour per address**, shared by everyone behind it, and the issues read already
spends one per viewer per session. Nine projects × one commit-history request each would spend ten
more and buy nothing: `git rev-list` and `git log` are both on
[the collector's allowlist](../../apps/tech-docs/tools/lib/run.ts), the deploy checks out with
`fetch-depth: 0`, and anything derivable from the tree is free at collect time. The browser read is
for what changes *after* the build — a deploy, a workflow run — and nothing else.

## Options considered

| Option | Why not |
| --- | --- |
| Self-host Backstage | Yarn 4 workspaces, React, a Node backend and PostgreSQL inside a pnpm/Nx/Vue workspace, plus MkDocs and Python for docs this repo already renders in place. Four of the five capabilities it brings exist here; the fifth is the one a static site can't host anyway |
| A hosted portal — Roadie, Spotify Portal, Port, Cortex, OpsLevel, Compass | All paid and external: the catalog, the scorecards and the review history would live in a vendor's account rather than in the tree, and this repo's premise is that the docs travel with the commit |
| Adopt the Backstage entity model as a format — `catalog-info.yaml` per project, no dependency | The format is free; what it costs is the file. A hand-written descriptor beside a derived graph is a second answer to "what projects exist", free to drift, which is the failure [`0011`](./0011-docs-system-enforcement.md) and the invariant checks exist to prevent — and generating one from the graph would buy only portability to a portal this report declines |
| Drop the static deploy and run tech-docs as a server, so actions have somewhere to run | A host, a secret and an auth mechanism this repo has never had, for an action GitHub already renders a button for. [`0014`](./0014-tech-docs-deployment.md) chose the snapshot deliberately; nothing here is worth reversing it |
| Build an auth system now so every capability lands uniformly | Two of the five need no credential at all, and `CLAUDE.md`'s dependency rule argues against infrastructure built ahead of the write action that would justify it |
| Build a general IDP abstraction — plugins, a capability registry — before any capability exists | One portal with one consumer. That rule cuts the same way against a hand-rolled framework as against an installed one |

## Consequences

Unblocks **#119** — "How should tech-docs surface each app/package with links and stats?" — which is
explicitly blocked by #102 and is the implementation vehicle for all of this. Its three asks now
have answers: stats are collected from `git` at build time, links out are baked into the deploy
workflow, and running a script is the one thing off the table for the deployed site.

**#66 and #67 come first.** #66 refactors the app on the grounds that it was vibe-coded, #67 adds
the tests and is blocked by it. New surface built before that refactor gets refactored twice.

The `nx` run panel is not cancelled but demoted: it is a `pnpm dev` feature, and shipping one means
the deployed site renders something in its place. That asymmetry is new work rather than a free win,
and it would be the first place this app has two behaviours to keep honest.

A flags/analytics vendor, if one lands, gets a tech-docs-owned vendor type rather than a shared one.
There is no shared `Vendor` package to reuse: `packages/i18n` and `packages/content` each define
their own, deliberately, for reasons their READMEs argue out. A third copy is the honest
continuation of that — and if a fourth shows up, that repetition is the signal to extract one.

Forecloses nothing about Backstage. What would reopen it is a second consumer — another repo whose
projects belong in the same catalog — because everything above holds precisely while the catalog,
the graph and the docs are one workspace's own.

Revisit the static deploy if an action turns up that GitHub cannot already render a button for. That
is the day the auth question becomes real, and it still hasn't.

## Confirmation

The framework decision holds while `apps/tech-docs/package.json` lists no `@backstage/*` dependency,
`apps/tech-docs/.env.example` still carries `NUXT_PUBLIC_REPO_URL` and nothing else, and no
`catalog-info.yaml` exists anywhere in the tree:

```sh
grep -rl "@backstage/" --include=package.json . | grep -v node_modules   # no output
find . -name "catalog-info.y*ml" -not -path "*/node_modules/*"           # no output
```

The reads stay free while the endpoints above answer `200` without a token; the first one that
returns `401` is the signal that a capability has drifted into needing an actor. The collect-time
rule is checkable the same way — a browser-side request count that grows with the number of projects
is the thing this report says not to build.

Deploy trigger and flag toggle stay blocked on this repo getting an auth mechanism it has never had.
`grep -riE "next-auth|passport|jwt|authOptions|session" apps packages` returns nothing today; a hit
is the signal to re-evaluate those two, not this report.
