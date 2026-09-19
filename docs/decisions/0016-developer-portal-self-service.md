---
issue: 102
status: implemented
decision: accepted
---

# 🧭 developer-portal becomes an IDP by reading GitHub, not by installing one

## Context

developer-portal is documented as a pure leaf/reader — `type:app scope:internal`, imports nothing but
`@monorepo/configs`, nothing imports it, and its only store is a disposable, rebuild-from-scratch
`.report/` snapshot. #102 asked whether it should grow beyond that, listing an `nx` run panel,
deploy status, deploy triggers for `huella-legal` and a feature-flag/analytics vendor integration —
each in tension with the "reads only, holds no credential, never acts" posture its README commits to.

The ask has since grown past that list: developer-portal should become something closer to an internal
developer platform, and the question raised with it is which dependency that means installing,
Backstage being the obvious candidate.

Three facts about the repo decide the answer, and all three are newer than the original framing:

| Fact | Where |
| --- | --- |
| developer-portal is built and deployed — a prerender published to GitHub Pages, no host and no secret | [`docs-deploy.yml`](../../.github/workflows/docs-deploy.yml), [`0014`](./0014-developer-portal-deployment.md) |
| `huella-legal` has a production pipeline, and every deploy is recorded as a GitHub Deployment | [`netlify-deployment.yml`](../../.github/workflows/netlify-deployment.yml) |
| developer-portal requires exactly one env var, `NUXT_PUBLIC_REPO_URL` — the observability URLs belong to `huella-legal` | [`apps/developer-portal/.env.example`](../../apps/developer-portal/.env.example) |

## Result

**Backstage would relocate maintenance rather than remove it, and add a category this repo doesn't
have.** developer-portal is 4,859 lines of hand-written source plus 838 of spec. Of that, `tools/` is 1,321
lines and **Backstage replaces none of it**: something still has to compute *this* workspace's graph,
coverage, doc links, invariants and scorecard shapes, and Backstage would consume that output through
a plugin also written here. What it replaces is `app/` — 2,723 lines of Vue, swapped for React — and
what it adds is a second package manager (`packageManager: yarn@4.18.0`, Yarn workspaces against this
repo's pnpm catalog), a Node backend, PostgreSQL for anything but local development, and MkDocs with
Python 3.11+ for the docs plugin. Its own docs describe it as "more of a library than an application
… meant to be evolved", on a monthly release line bumped all-packages-at-once with
`backstage-cli versions:bump`.

The part that isn't a matter of taste is the catalog. Backstage's is a hand-written
`catalog-info.yaml` per component; this repo's is the Nx project graph, derived. **Adopting it
converts derived state into maintained state**, which is the exact direction the invariant checks in
[`invariants.ts`](../../apps/developer-portal/tools/lib/invariants.ts) exist to prevent.

**No other framework is a candidate, because the category has no open-source member that isn't
Backstage.** Everything else in it is either a Backstage distribution (Roadie, Spotify Portal, Red
Hat Developer Hub) or commercial SaaS (Port, Cortex, OpsLevel, Compass), and a SaaS portal would hold
this repo's catalog, scorecards and review history in a vendor account — against the premise that the
docs travel with the commit. The platform orchestrators sometimes listed alongside them assume a
Kubernetes control plane this workspace does not have.

**Decomposed, though, the answer is that every plane already has its library — chosen one at a time,
which is why no portal fits over the top of them:**

| IDP plane | Already in this repo |
| --- | --- |
| Docs | `@nuxt/content`, reading every tracked `*.md` in place at its own path |
| Software catalog | The Nx project graph, collected into `.report/` — derived, so it cannot drift |
| Component catalog | **Storybook 10 in `@monorepo/ui`**, with a `build-storybook` target writing `storybook-static` |
| Scorecards | [`SCORECARDS.md`](../reviews/README.md) and the scorecards page |
| Golden paths | `new-package`, `ui:new-component`, `scripts:new-script`, `nuxt-module-route`, `pnpm issue:pick` |
| Action runner | GitHub Actions |

A portal framework would be a fifth wrapper over four working tools. The one plane with nothing under
it is self-service actions — and that is blocked by something a dependency can't fix.

**The `type:app` boundary tag was never the blocker, and neither is auth.**
[`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts) governs import edges, not
execution: it stops developer-portal from `import`ing a workspace package it isn't allowed to, and says
nothing about spawning a child process or calling an external API. The "reader, not actor" posture is
a design choice written in prose, not an enforced boundary.

**What blocks it is that the deployed site is frozen at build time.** The mechanism is sharper than
"there is no server": a prerendered route *is* answered, once, during the build, and then baked into
the payload — [`snapshot.get.ts`](../../apps/developer-portal/server/api/snapshot.get.ts) is served exactly
that way. A route whose whole purpose is to compute something when the reader asks has nowhere to
run. So "does it need a credential" needs a second axis beside it, and the second one reorders the
original list:

| Capability | Needs a credential | Survives prerendering | Where that leaves it |
| --- | --- | --- | --- |
| Deploy status, and the prod URL with it | No | Yes — a browser-side read | Free, now that a pipeline exists to report on |
| Per-project stats | No | Yes, if collected rather than fetched | Free at collect time |
| Links out to a live surface | No | Only if the target is published | Free once it is; a URL not in the Deployments API is another `env:` entry in the deploy workflow |
| `nx` run panel | No | **No** — the answer would be frozen at build | Looks like the cheapest of the five and is the only one that cannot exist on the deployed site at all |
| Deploy trigger, flag toggle | Yes | No | Blocked, and blocked twice over |

**GitHub is already this repo's control plane, and reading it needs no credential.** The issues page
established the pattern — unauthenticated REST from the reader's own browser, because the repo is
public — and the same call answers for the rest. `deployments` returns both environments this repo
deploys, and each one's `statuses` carries `state` and `environment_url`, so **deploy state and the
production URL come from one read and need no new env var**:

```sh
curl -s https://api.github.com/repos/<owner>/<repo>/deployments          # 200, unauthenticated
curl -s https://api.github.com/repos/<owner>/<repo>/deployments/<id>/statuses
```

`actions/workflows`, `releases` and `stats/participation` answer the same way. The actions half
resolves in the same direction: a self-service action here is a `workflow_dispatch`, and GitHub
already renders a **Run workflow** button for one, behind its own identity and permission model. A
link out to that button is a self-service action in which this repo still holds no credential — the
posture kept rather than traded away.

**The split that decides what gets built is collect-time versus browser-time.** Unauthenticated REST
is **60 requests an hour per address**, shared by everyone behind it, and the issues read already
spends one per viewer per session. Nine projects × one commit-history request each would spend ten
more and buy nothing: `git rev-list` and `git log` are both on
[the collector's allowlist](../../apps/developer-portal/tools/lib/run.ts), the deploy checks out with
`fetch-depth: 0`, and anything derivable from the tree is free at collect time. The browser read is
for what changes *after* the build — a deploy, a workflow run — and nothing else.

## Options considered

| Option | Why not |
| --- | --- |
| Self-host Backstage | Replaces no line of the 1,321 that compute this workspace's state, swaps 2,723 lines of Vue for React, and adds Yarn, a Node backend, PostgreSQL, MkDocs and a monthly all-packages version bump. The catalog goes from derived to hand-written, which is the drift these docs are built to prevent |
| A hosted portal — Roadie, Spotify Portal, Red Hat Developer Hub, Port, Cortex, OpsLevel, Compass | Every one is a Backstage distribution or commercial SaaS. The catalog, scorecards and review history would live in a vendor's account rather than in the tree |
| Adopt the Backstage entity model as a format — `catalog-info.yaml` per project, no dependency | The format is free; what it costs is the file. A hand-written descriptor beside a derived graph is a second answer to "what projects exist", free to drift — and generating one from the graph buys only portability to a portal this report declines |
| Drop the static deploy and run developer-portal as a server, so actions have somewhere to run | A host, a secret and an auth mechanism this repo has never had, for an action GitHub already renders a button for. [`0014`](./0014-developer-portal-deployment.md) chose the snapshot deliberately |
| Build an auth system now so every capability lands uniformly | Four of the five need no credential at all, and `CLAUDE.md`'s dependency rule argues against infrastructure built ahead of the write action that would justify it |
| Build a general IDP abstraction — plugins, a capability registry — before any capability exists | One portal with one consumer. That rule cuts the same way against a hand-rolled framework as against an installed one |

## Consequences

No dependency is added. What gets built instead, in order, each row naming the one thing it needs:

| Build | Needs | Runs where |
| --- | --- | --- |
| One card per project, off the collected graph | Nothing new | Both |
| Per-project stats — commits, frequency, coverage, test count | `git rev-list`/`log` at collect time; both already allowlisted | Both |
| Deploy status per environment, and the production URL with it | One browser read of `deployments` + `statuses` | Both |
| A link to `@monorepo/ui`'s Storybook | **Publishing `storybook-static` first** — it builds today and no workflow deploys it | Both |
| `nx` run panel | A deliberate answer for what the deployed site renders in its place | `pnpm dev` only |
| Deploy trigger, flag toggle | A link out to GitHub's own **Run workflow** button | GitHub's UI |

**#66 first, then #67, then #119.** #66 refactors the app on the grounds that it was vibe-coded and
#67 adds the tests behind it; #119 — "How should developer-portal surface each app/package with links and
stats?", explicitly blocked by #102 — is where the table above gets built. New surface landed before
that refactor gets refactored twice.

A flags/analytics vendor, if one lands, gets a developer-portal-owned vendor type rather than a shared one:
`packages/i18n` and `packages/content` each define their own, deliberately, for reasons their READMEs
argue out. A third copy is the honest continuation; a fourth is the signal to extract one.

Forecloses nothing about Backstage. What would reopen it is a second consumer — another repo whose
projects belong in the same catalog — because everything above holds precisely while the catalog, the
graph and the docs are one workspace's own. Revisit the static deploy if an action turns up that
GitHub cannot already render a button for; that is the day the auth question becomes real.

## Confirmation

The framework decision holds while `apps/developer-portal/package.json` lists no `@backstage/*` dependency,
`apps/developer-portal/.env.example` still carries `NUXT_PUBLIC_REPO_URL` and nothing else, and no
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
