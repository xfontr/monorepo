---
issue: 108
status: implemented
decision: accepted
---

# 🧭 Deploying developer-portal is a snapshot problem, not a build step

## Context

[`0011`](./0011-docs-system-enforcement.md) adopted deploying `apps/developer-portal` as change 7, listed
four blockers and deliberately left them unaddressed. Issue #108 restates those four as acceptance
criteria, the last of them being *"a `build` script exists so `nx affected -t build` (and CI)
actually builds the project"*.

The assumption worth testing was that those four are the list, and that the build script is the
cheap one. Both are wrong. The app does not build today, and the three things the criteria do not
mention — where the markdown lives, when the collected snapshot is needed, and what tells CI that
any of it changed — are the work.

## Result

**`nuxt build` fails on this project today.** Not "there is no build script": there is no build.
Fourteen files under `app/` import `shared/` by relative path with a `.ts` extension
(`import { toTitleCase } from "../../shared/wiki.ts"`), and Nitro's prerender pass cannot resolve
them, off by one directory:

```
ERROR  Could not resolve "../../../../../../../../apps/developer-portal/shared/spikeReports.ts"
       from "node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/spikes-GqWH_gI8.js"
```

`apps/huella-legal` never hit this because it has no `shared/` directory and no such import, so the
one app CI does build says nothing about this one. Rewriting the fourteen to Nuxt 4's `#shared`
alias — already generated in `.nuxt/tsconfig.json` — makes `nuxt build` complete.

**The markdown is not a deploy blocker; it is a freshness one.** `content.config.ts` points
`@nuxt/content` at the workspace root, and a build bakes the whole corpus into
`.output/public/__nuxt_content/docs/sql_dump.txt` — 308 KB gzipped, ~1 MB decoded, carrying every
README, `CLAUDE.md`, decision, review and skill. The docs travel with the build. What does not survive
is the claim the app's README makes about them: *"the README you edit for GitHub is the same file
this renders, so the two cannot drift."* That holds for `nuxt dev`, which reads the files in place.
A deployed instance is as fresh as its last build.

**Nothing marks that build as needing to re-run.** Three measurements, `nx.json` unchanged:

| Change | `nx show projects --affected` | Why |
| --- | --- | --- |
| `docs/decisions/README.md` | `[]` | The `docs/` tree belongs to no project, so no target anywhere depends on it |
| `packages/ui/README.md` | `@monorepo/ui`, `@monorepo/huella-legal` | Never `developer-portal`, though `developer-portal` is what renders it |
| `apps/developer-portal/README.md` | `@monorepo/developer-portal` | Affected, but `build`'s `production` input carries `!{projectRoot}/**/*.md`, so the task hash is unchanged |

Two independent mechanisms produce the same result, and the second survives the first: `production`
resolves to `{projectRoot}/**/*` minus markdown, so no markdown anywhere — inside the project or
out — is a build input. Measured end to end: `nx nuxt:build`, then an edit to a collected file under
`public/embed/` and a touch on `docs/decisions/README.md`, then `nx nuxt:build` again — **1/1 cache
hit**. Nx replays an `.output` built from the previous snapshot and the previous docs.

**The snapshot's two halves are needed at different times**, which is what makes `collect` a build
prerequisite rather than a deploy step:

| Half | Needed at | Evidence |
| --- | --- | --- |
| `public/embed/**` — the Nx graph client and the merged coverage report, 5.1 MB | **Build time** | Nuxt copies `public/` into `.output/public/embed/` |
| `.report/*.json` — 420 KB | **Runtime** | `server/utils/store.ts` reads `SNAPSHOT_DIR` per request |

**And the runtime half breaks silently in the bundle.** `tools/lib/paths.ts` derives
`PROJECT_ROOT` as `resolve(here, "../..")` from `import.meta.url`, with a comment claiming that
survives both a `node tools/…` process and a server route. It survives bundling and not relocation:
in the built server the module is `.output/server/chunks/nitro/nitro.mjs`, so `PROJECT_ROOT` lands
on `.output/server` and `SNAPSHOT_DIR` on `.output/server/.report`. `readJson` catches, so every
artifact reads `null` and every page renders its "never collected" state — a deploy that looks
entirely successful and shows an empty dashboard.

**Static does not dodge that bug, it moves it earlier.** The prerenderer runs the bundled server, so
it reads the same wrong path and bakes the nulls into the HTML: the first prerendered payload
measured here carried `{"manifest": null, "projects": null, …}` for all seven artifacts. The fix is
the same either way — resolve the directory in `nuxt.config.ts`, where the project's location is
still known, and hand it to the server through `runtimeConfig`.

**The snapshot has three clocks, not two.** `0011` framed it as *"the content and snapshot surfaces
are static per commit, and only the issues surface is live"*. `tools/collect/deps.ts` runs
`pnpm audit` and `pnpm outdated` against the npm registry: an advisory appears without a commit. So
the surfaces are commit-derived (graph, metrics, docs, scorecards, coverage), **time**-derived
(deps), and live (issues) — and only the first group is honestly reproducible from a tagged build.

**Collect cannot ride the existing `checks` job.** `boundaryViolations` in
`tools/collect/metrics.ts` runs `eslint .` in every project, sequentially; a complete coverage
artifact needs `nx run-many -t test:coverage` plus the merge script, where CI runs
`nx affected -t test` and no coverage at all. Different input set — full, not affected — and a
different cost. It is a second job on a different trigger, not a step appended to the first.

**The auth criterion dissolves.** The repo is public (`gh repo view` → `"isPrivate": false`), so the
Istanbul embed inlining every file's source publishes nothing that is not already published, and
the issue list is public too. Grepping `/Users/` across `.report/*.json`, `public/embed/coverage/`
and `public/embed/graph/` finds nothing — the collectors already relativise every path they emit.
The residue is `manifest.branch` / `metrics.branch`, which names a local branch. So *"authenticated,
or every rendered path is scrubbed"* is already met on the scrubbing branch, and the issues surface
gains a third option `0011` did not price: unauthenticated `api.github.com` from the browser, which
needs no credential on a public repo and so lapses the README's stated reason for keeping `gh` on
the server. Measured: `GET /repos/{owner}/{repo}/issues` answers `200` with
`access-control-allow-origin: *` and `x-ratelimit-limit: 60`. What it does **not** answer is anything
about GitHub Projects — that is GraphQL only, and `POST /graphql` answers `403` without a token — so
the option is real but not free, and change 5 states the price.

**Prerendering finds a link model the filesystem check cannot see.** `nuxt build --prerender`
renders the site and then exits on **32 distinct links that resolve to no route**, in four kinds:

| Kind | Examples | Fix |
| --- | --- | --- |
| Case — the page exists, lower-cased | `/README`, `/CLAUDE`, `/packages/ui/README`, `/.agents/skills/house-docs/SKILL` | Lower-case the href, as `toCollectionPath` already does elsewhere |
| Not markdown — there will never be a page | `/.husky/pre-push`, `/nx.json`, `/.mcp.json`, `/packages/configs/src/tsconfig/base.json` | Link out to GitHub |
| A line range on a file | `/.agents/skills/writing-tests/SKILL.md:91-94` | Strip the suffix, then as above |
| A directory, or a sibling resolved from the wrong base | `/.claude/agents/`, `/2026-09-10-bfd6da2` | Link out to GitHub |

`pnpm exec nx check-docs @monorepo/developer-portal` passes on the same tree with `brokenLinkCount: 0`,
and both are right. `checkLink` resolves against the filesystem on purpose — these files are read on
GitHub first — while a deployed site resolves against a route table that lower-cases every path and
has no entry for a file that is not markdown. `.husky/pre-push` is a shell script: it is a correct
link on GitHub and can never be a page here. The mismatch is invisible under `nuxt dev`, which
404s one link at a time without failing anything, and the count is easy to under-read — a partial
log shows nine, because the prerenderer stops crawling once it has errors to report.

**And the 32 are the half that announces itself.** Another **33 links land on `/docs/[...slug]`**,
which renders "No such page" at HTTP 200: the catch-all matches, so the prerenderer is satisfied,
the build is green, and the reader gets a dead end. Nothing in CI, in `check-docs` or in the build
log distinguishes one of these from a page — only grepping the prerendered HTML for the empty
state's own copy finds them, which is the check any fix here has to keep passing.

**Every page carries the full-text search index.** `app/layouts/default.vue` calls
`queryCollectionSearchSections("docs")`, and the default layout wraps every page, so each of the 128
`_payload.json` files the prerender writes runs to roughly 650 KB — **619 KB of it that one index**,
against a 1 KB review list and a snapshot that contributes nothing. That is 78 MB under `/docs`
alone, next to a 5.1 MB embed tree. Not a static-only cost either: under SSR the same payload ships
with every page response. The index is needed when someone opens the search dialog, which is not
on load and not on most pages.

Measured after change 6 landed, on 103 prerendered pages: **73.0 MB of payloads became 7.6 MB**, a
mean of 725 KB a page against 75 KB, and the whole static output went from 93 MB to 27 MB. The cost
moves rather than vanishing — the first open of the dialog fetches a 206 KB chunk and an 844 KB
SQLite WASM, once per reader — but it is paid by the readers who search instead of by every page
load, and `queryCollectionSearchSections` runs client-side against the prerendered dump, which is
what makes it available at all without a server.

**Nine changes are adopted**, in this order — the first two are prerequisites for everything after
them, and 3–6 are what a static deploy costs:

1. **Rewrite `app/**`'s fourteen `../../shared/*.ts` imports to `#shared/*`.** This is what makes
   any build of this project complete, and it is a rename, not a redesign — `server/` and `tools/`
   keep their relative imports, which Nitro resolves.
2. **Add `"build": "nx nuxt:build"`** to `apps/developer-portal/package.json`, the shape
   `apps/huella-legal` already uses, so `nx affected -t build` stops skipping the project. Delete
   the README paragraph that explains why it is absent.
3. **Deploy statically** — `nuxt build --prerender` to GitHub Pages — rather than running a Node
   server. No host and no secret; and no auth story, since the repo is public. It does not dodge
   the `PROJECT_ROOT` bug — the prerenderer hits it too — so that is fixed first, by resolving the
   snapshot directory in `nuxt.config.ts` and passing it through `runtimeConfig`, which also gives
   CI an `NUXT_SNAPSHOT_DIR` to point at its own artifact. Static is the option that does **not**
   build today; SSR is the one that completes once change 1 lands, and change 4 is what makes
   static build.
4. **Reconcile the two link models, in the parser rather than the renderer.** A remark plugin
   registered on `content.build.markdown` rewrites every href as the file is parsed: a target that
   is markdown on disk becomes a route, everything else becomes a link to GitHub. Leave
   `failOnError` on. The decision cannot be made from the href alone — these docs may omit `.md`
   when a renderer routes the link, and `checkLink` accepts that — but at parse time the **source
   file's path and the filesystem are both in reach**, which is what settles it; a component
   rendering the built AST has neither, and pays a per-page payload to approximate them. **Remark,
   not rehype**: the mdast-to-hast step strips `.md` from a relative href on its way through, so by
   the rehype stage the one signal that distinguishes a page from a directory is already gone.
   This also makes the route-table check in `check-docs` unnecessary rather than merely cheaper —
   a route is only ever emitted for a file the parser has just confirmed exists, so a link that
   resolves on disk and routes nowhere can no longer be constructed. A link to a *missing* file is
   still caught by `checkLink`, which already fails the build.
5. **Move the issues surface into the browser**, unauthenticated against `api.github.com`, with the
   endpoint derived from `NUXT_PUBLIC_REPO_URL` rather than written down. Keep the current behaviour
   of rendering a failure rather than throwing — a rate-limited response degrades exactly like an
   unauthenticated `gh` does now — and drop `server/utils/issues.ts` with its `KNOWN_DIRS` binary
   resolution. **This costs the board surfaces**, which the criterion above did not price:
   `projectItems` is a GraphQL field, GraphQL answers `403` unauthenticated, and REST carries nothing
   about GitHub Projects — measured, not assumed. So the board badge, the board filter and the
   Overview's "filed and never placed" count go with it, because a `project` that is permanently
   `null` makes that last one report **every** open issue as unplaced: the same class of silently
   wrong number as the empty dashboard in change 3. Two smaller differences follow from the endpoint
   rather than the credential: `/issues` returns pull requests, which `gh issue list` did not and
   which have to be filtered on the `pull_request` key, and the issue's link is `html_url` — `url` is
   the API's own address for it.
6. **Load the search index on demand rather than in the layout.** It is 619 KB of the 650 KB each
   prerendered page currently carries, and nothing needs it until the search dialog opens. The
   trigger is `UDashboardSearch`'s own `open` model, which both ⌘K and the sidebar button already
   flip, so nothing new decides when the dialog is open. `immediate: false` plus `server: false` on
   the `useAsyncData` is what keeps it out of the prerendered payload; a `loading` prop covers the
   wait on first open.
7. **Give the build the inputs it actually has.** A per-project `production` `namedInput` in
   `apps/developer-portal/package.json` — the workspace default is wrong for the one project whose inputs
   are the workspace. Without it the deploy job restores a cached `.output` and publishes the
   previous snapshot. Both open questions above are now measured:

   | Question | Answer |
   | --- | --- |
   | Does `{workspaceRoot}/**/*.md` also make `nx affected` see a file belonging to no project? | **Yes** — `nx show projects --affected --files=docs/decisions/README.md` prints `["@monorepo/developer-portal"]`, where it printed `[]`. No `implicitDependencies` entry is needed; the input does both jobs |
   | Can the collected snapshot be a file input? | **No.** `.report/` is gitignored, so it is absent from Nx's file map and `{projectRoot}/.report/**/*` hashes nothing — added it, re-stamped the manifest, still a 1/1 cache hit. A `runtime` input whose stdout is the manifest is the mechanism that works |

   The target the deploy actually runs is `build-static`, not `build`; both take `production`, so the
   one override covers them. Committing `.report/` would make it a file input and is still refused
   for the reason below — and it would not help anyway, since `collect` re-stamps it every run.
8. **A separate `docs-deploy` workflow** on push to `master` plus `workflow_dispatch`:
   `nx run-many -t test:coverage` and the merge script, then `nx collect`, then the build, then
   publish. Not a step on the `checks` job, which is `affected` by design.
9. **Correct the two READMEs.** `apps/developer-portal/README.md`'s "cannot drift" claim becomes a
   statement about `nuxt dev`, and its *"Serving this anywhere"* deferred row plus
   `docs/README.md`'s publishing row are spent — as `0011` said they would be.

## Options considered

| Option | Why not |
| --- | --- |
| SSR on a Node host — `nuxt build`, verified working once change 1 lands | Buys the live issues route and its one-minute memo, and costs a host, a runtime environment, and a fix for a `SNAPSHOT_DIR` that resolves inside `.output` and fails by rendering an empty dashboard. A public repo makes the browser do the same job with no server |
| Prerender the issue list at build time | An issue list as old as the last deploy is worse than no issue list; the README's whole claim for this page is that GitHub owns the state and nothing here mirrors it |
| `failOnError: false` on the prerenderer | Ships 32 real 404s on a site whose own Overview page counts broken links |
| Commit `.report/` so a build has a snapshot without running `collect` | "One store, and it is disposable" exists because a committed snapshot goes stale silently, and it would not fix the Nx inputs either — the build would still be a cache hit |
| Deploy the wiki only, dropping the snapshot pages | The coverage, the graph and the invariant findings are the half a reader cannot already get by browsing the repo on GitHub |
| Add `collect` to the existing `checks` job | Full `test:coverage` plus `eslint` per project on every pull request, to produce an artifact no check reads |
| Point `@nuxt/content` at a copy of the docs inside the app | A second copy of every README in the repo, which is the drift the in-place read exists to prevent |

## Consequences

The docs on a deployed instance become a build-time snapshot, so the app's README stops being able
to claim they cannot drift and says instead that the local server reads them in place. Staleness
becomes a deploy-frequency question, which is why change 7 triggers on every push to `master`.

Change 4 adds no class of CI finding, which was the expectation going in and is worth stating because
it is the opposite: rewriting at parse time removes the failure rather than reporting it, so the
route-table check drafted alongside it had nothing left to catch and was deleted. The cost is that a
doc's rendered links now depend on a build-time plugin, so a link's behaviour cannot be read off the
markdown alone — `resolveDocLink` and its spec are where that behaviour is pinned.

Change 5 puts a dependency on the repo staying public into the app. If it ever goes private the
issues surface breaks and the coverage embed becomes a leak — that is the revisit trigger, and it
is the one change here that is not reversible by editing CI alone. It also trades the board data for
the deploy, permanently: nothing short of a stored token brings `projectItems` back, so a future need
to see a card's column is a need for a credential, not for a query. The rate limit moves with the
read — 60 an hour per address, shared by everyone behind it, rather than one `gh` invocation a minute
per server — and the one-minute memo becomes a per-viewer, per-session one.

`deps` stays in the snapshot and stays time-derived, so a deployed dashboard will show an advisory
count that was true when the build ran. Nothing here fixes that; it is named so the next reader
does not mistake it for a commit-accurate number.

Revisit if a second project needs deploying. Hosting is this app's own problem exactly once; two
apps make it a workspace concern with a boundary question attached, and none of the above assumes
otherwise.

## Confirmation

Each is false today and true when the work lands:

1. `pnpm exec nx build @monorepo/developer-portal` exits 0. It currently fails to resolve
   `shared/spikeReports.ts`.
2. Two consecutive builds with a markdown edit between them report a cache **miss** on the second.
   Measured at 1/1 hit today — this is the half change 7 is known to fix.
3. `pnpm exec nx show projects --affected --files=docs/decisions/README.md` lists
   `@monorepo/developer-portal`. It currently prints `[]`, and which mechanism gets it there is the open
   question in change 7.
4. A prerendered build contains no page carrying the wiki's "No such page" copy, and the prerenderer
   reports no unresolved route — the 32 and the 33 it found while `check-docs` reported
   `brokenLinkCount: 0`.
5. The build completes with the prerenderer's `failOnError` left at its default.
6. A markdown edit pushed to `master` is readable at the deployed URL without anyone running
   `nx collect` or `nuxt dev` — which is the staleness this report is about, and the one thing a
   `manifest.commit` the page renders itself cannot attest to. This is the one confirmation landing
   the work does **not** settle: it needs the repo's Pages source set to GitHub Actions, which no
   file here can do — `actions/configure-pages` reads that setting rather than creating it, so the
   first run fails until someone has changed it. The repo had no Pages site at the time of writing.
