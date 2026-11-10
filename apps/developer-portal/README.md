# 📦 @monorepo/developer-portal

A read-only portal for exploring the monorepo's projects, documentation, architecture and engineering
health. It gives newcomers a clear starting point while keeping deeper developer views close by.

It renders every markdown file in the workspace as a wiki — READMEs, `CLAUDE.md`s, the
[`docs/`](../../docs/README.md) tree, reviews and changelogs — beside the things that are not written
down anywhere: coverage, the project graph, open GitHub issues and which two files have stopped agreeing.

It runs two ways. `pnpm dev developer-portal`, from the workspace root, reads the working tree and shells out to `git`, so it shows
the branch you are on; the deployed site is a prerendered snapshot of `master`, published by
[`developer-portal-deploy.yml`](../../.github/workflows/developer-portal-deploy.yml) — see
[🚢 The deployed site is a snapshot](#-the-deployed-site-is-a-snapshot).

## 🚪 The public entry points

The interface starts with three public intents, using ordinary language before repository-specific
terms.

| Intent | Starts with |
| --- | --- |
| Explore what exists | Overview, Projects and What's new |
| Understand how it works | Documentation, Architecture, Decisions and Audits |
| Run or contribute | The first-hour guide and the repository documentation |

Engineering health remains available after that introduction: the homepage places it below the featured
projects, and the sidebar keeps it as the final group. Coverage, dependencies, reviews, scorecards and
work in progress remain directly addressable without creating a second application or navigation tree.

## 🗂 Structure

| Path | What lives there |
| --- | --- |
| `app/` | The shell: the layout and its sidebar, the Overview page, and the parts every layer draws with — `StatTile`, `StatusPill`, `toneClass` and the date helpers |
| `layers/` | One Nuxt layer per capability — see [🧱 Layers](#-layers) |
| `tools/collect/` | Builds the derived snapshot: graph, coverage, metrics, docs, scorecards, usage |
| `tools/lib/` | Node-only helpers — paths, the `git` allowlist, the invariant checks, and the remark plugin that rewrites a doc's links as it is parsed |

## 🧱 Layers

Nuxt registers every directory under `layers/` by itself, and each one repeats the app's own
layout: `app/`, `server/`, `shared/` and a `nuxt.config.ts`, which a layer needs even when it is
empty. The split follows [`apps/huella-legal`](../huella-legal/CLAUDE.md): a layer has its own
domain logic, its own config, or is something you'd switch off whole.

| Layer | Kind | What it owns |
| --- | --- | --- |
| `design` | Core | Every token and shared class, and the Nuxt UI theme — see [🎨 Design system](#-design-system) |
| `snapshot` | Core | The `.report/` store, the snapshot and badge routes, the artifact types, `useSnapshot` and `SnapshotAge` |
| `docs` | Core | The wiki pages and nav, the link rewriting, and the path helpers every markdown-backed page uses |
| `github` | Core | The two reads the browser makes of GitHub, issues and deployments, and their rules |
| `decisions`, `audits`, `reviews` | Feature | Each record's pages, its list logic and its labels |
| `projects` | Feature | Projects, Architecture and What's new |
| `health` | Feature | Work in progress and its row, Coverage and Dependencies |
| `telemetry` | Feature | The Telemetry page and the usage rules the collector shares |
| `workflows` | Feature | The Workflows pages, their components, routes, config and colours |

A feature uses the cores and the shell's parts, never another feature, so each one comes out alone.
Only the shell uses everything: the Overview and the sidebar's badges read issues, reviews and the
snapshot. Nothing checks this but review, since auto-imports hide every edge from the linter.

Any import into another layer, from `app/`, `shared/`, `server/` or `tools/`, reads
`#layers/<name>/…`. Nuxt resolves it as its own alias; the collector and the `node` test project run
outside Nuxt and resolve the same string through the `imports` field in
[`package.json`](./package.json). An import within one layer, or within `tools/`, stays relative.
A root-level `shared/` is gone on purpose:
a relative import into it is what broke the prerendered build in
[`0014`](../../docs/decisions/0014-developer-portal-deployment.md).

Each layer lists its sidebar links under `nav` in its `app/app.config.ts`, and
[`default.vue`](./app/layouts/default.vue) only arranges those keys, skipping one no layer declares.

### Removing a feature

Deleting the folder removes the pages, the routes and the sidebar entry. What is left is whatever
the collector holds for it, since `tools/` is one program outside Nuxt:

| Feature | Besides `layers/<name>/` |
| --- | --- |
| `workflows` | [`tools/lib/workflows.ts`](./tools/lib/workflows.ts) and its call in [`invariants.ts`](./tools/lib/invariants.ts), the `docs/workflows` line under `namedInputs` in [`package.json`](./package.json), and `@dagrejs/dagre` |
| `telemetry` | [`tools/collect/usage.ts`](./tools/collect/usage.ts), [`tools/lib/lintRules.ts`](./tools/lib/lintRules.ts), the `usage` step in [`tools/collect/index.ts`](./tools/collect/index.ts), and the `usage` reader and types in `snapshot` |
| `decisions`, `audits` | Nothing to delete, but the collector still parses both into `docs.json` and checks their shape |
| `reviews` | [`tools/collect/scorecards.ts`](./tools/collect/scorecards.ts) and its step, and the layout's review badge |
| `health` | The Overview tiles and the sidebar badge that read them |

## 🚀 Development

| Command | What it does |
| --- | --- |
| `pnpm dev developer-portal` | Start the portal, from the workspace root |
| `pnpm exec nx collect @monorepo/developer-portal` | Rebuild the snapshot — graph, coverage, metrics, docs, scorecards |
| `pnpm exec nx nuxt-prepare @monorepo/developer-portal` | Regenerates `.nuxt` (`nuxi prepare`) — [`nx.json`](../../nx.json) already runs it before `lint`/`typecheck`/`test`/`build`, so this is only for calling it by hand |
| `pnpm exec nx build-static @monorepo/developer-portal` | `nuxt build --prerender` — the build the deploy publishes, and the only one that renders every route |

The collector reads each project's `coverage/coverage-summary.json` and copies in the merged report
`pnpm test:coverage` renders at the workspace root, so both are only as fresh as the last run of it.

`build` delegates to `build-static`, because `nx affected -t build` only ever looks for a target
called `build` — the same indirection [`apps/huella-legal`](../huella-legal/README.md) uses, pointed
at a different target. **CI therefore builds the artifact that deploys**, which is the point: this
app was broken under `--prerender` while the SSR build went green, so an SSR build here would verify
a mode nothing runs. It survives as the plugin's inferred `nuxt:build` and is never invoked —
`@nx/nuxt` infers it from `nuxt.config.ts` for every Nuxt project, and `huella-legal` genuinely
serves that way. Prerendering costs about what the SSR build does, and it succeeds with no
`.report/` at all, rendering fewer routes.

## 📄 The markdown is read in place

[`content.config.ts`](./content.config.ts) points `@nuxt/content` at the **workspace root**, not at a
copy inside this app. That is what makes the docs half free: the README you edit for GitHub is the
same file this renders, and a page's URL mirrors its path in the repo.

Under `pnpm dev developer-portal` (run from the root) that file is read where it lives, so the two cannot drift. A build bakes
the whole corpus into the bundle instead, which is why the deployed site is only ever as fresh as its
last deploy — [🚢 The deployed site is a snapshot](#-the-deployed-site-is-a-snapshot) is the rest of
that.

| Page | Reads |
| --- | --- |
| Documentation | Every non-ignored `*.md`, arranged as a tree — see [🧭 Documentation is a wiki](#-documentation-is-a-wiki) |
| Architecture | The collected Nx graph, its plain-language relationships and the detailed graph `collect` writes to the gitignored `public/embed/graph/` |
| Projects | The collected Nx graph joined to collect-time project metrics, with deployment state read live |
| Decisions | `docs/decisions/NNNN-<slug>.md` — the files the `decision-report` skill writes, see [🔬 Decisions are their own section](#-decisions-are-their-own-section) |
| Audits | `docs/audits/YYYY-MM-DD-<scope>.md` — the files the `audit-report` skill writes, see [🔎 Audits count findings, not files](#-audits-count-findings-not-files) |
| Reviews | `docs/reviews/YYYY-MM-DD-<sha>.md` — the files the `repo-review` skill writes |
| Workflows | `docs/workflows/` templates, projects and their synced snapshots, read in place on every request rather than collected — see [`docs/workflows/README.md`](../../docs/workflows/README.md). Under `pnpm dev` its Features modal also switches features, and the index page creates projects. The page's graph is laid out with `@dagrejs/dagre` |
| Work in progress | Open issues read from GitHub in the browser |
| What's new | Every `CHANGELOG.md`, beside its unreleased-commit count, plus any project in `nx.json`'s `release.projects` that has commits and no release yet |
| Engineering health | Coverage, dependencies, reviews, scorecards and collected repository findings |
| Telemetry | Every CSV under `.telemetry/`, beside the list of script folders, the rules each project's ESLint config enables and the `eslint-disable` comments in tracked files — see [📊 Telemetry](#-telemetry) |

`@nuxt/content` lower-cases every route, so `packages/ui/README.md` is served at
`/packages/ui/readme` while the collector keys the same file as `packages/ui/README.md`. Anything
joining the two — a broken-link warning, an "updated 3 days ago" — goes through
[`toCollectionPath`](./layers/docs/shared/wiki.ts) first. A hand-written `/docs/…/README` link matches nothing
and fails silently, which is exactly how it went unnoticed the first time.

The links *inside* a doc are written for GitHub and point at files, not routes — `./.husky/pre-push`,
`../packages/ui/README.md`, a directory, a line range. Rendering them verbatim
put 32 links on a hard 404 and another 33 on the wiki's own "No such page" at HTTP 200 —
[`0014`](../../docs/decisions/0014-developer-portal-deployment.md) has the measurement. They cannot be fixed in
the markdown, because on GitHub they are already correct.

[`remarkDocLinks`](./tools/lib/remarkDocLinks.ts) rewrites each one **while the file is parsed**,
which is the only moment both things it needs are in reach: the source file's own path, and a
filesystem to ask. A target that is markdown on disk becomes a route; everything else becomes
`repo:`, which [`ProseA`](./layers/docs/app/components/content/ProseA.vue) turns into a link to the forge once
`NUXT_PUBLIC_REPO_URL` — runtime config, and so unknowable at parse time — is in hand.

| The link says | It renders as | Because |
| --- | --- | --- |
| `../packages/ui/README.md` | `/docs/packages/ui/readme` | The collection lower-cases every route |
| `./.husky/pre-push` | A link to the repo | A shell script is never a page here |
| `./src/drift` | A link to the repo | Nothing answers to `src/drift.md`, so it is a directory |
| `./SKILL.md:91-94` | The page, without the range | A line range narrows a file rather than naming another |
| `./<file>.md` in a template | Plain text | A placeholder names no target, and a link onto "No such page" is the failure this whole pass removes |

The third row is the one that needs the filesystem: a link may omit `.md` when a renderer routes it
and [`checkLink`](./tools/collect/docs.ts) accepts that, so an extension-less target is a page or a
directory and nothing in the href says which.

Parse time retires the route-table check: a route is only ever emitted for a file the parser has
just confirmed, so a link that resolves on disk and routes nowhere can no longer be built. A link
to a *missing* file is still a real defect, and
[`checkLink`](./tools/collect/docs.ts) still counts it, on the Overview and the Documentation page.
It never fails a build. Link syntax inside a code span or a fenced sample is skipped, because the
parser never turns it into a link either.

A review's markdown is rendered as-is here, exactly like every other doc — nothing about it is
recomputed. **Scorecards** is the one exception, and a narrow one: `tools/collect/scorecards.ts`
parses each review's own `## 🧮 Scores` table and shows the numbers as tiles and a table
instead of a raw markdown table, but every figure is copied verbatim out of the file `repo-review`
already wrote — nothing here re-scores or re-derives a total. That only stays honest because the
table has one shape across every review: the seven cards `SCORECARDS.md` lists, in that order, each
`n/5`. The `repo-review` skill is told to keep it that way, and
[`compareScorecardShape`](./tools/lib/invariants.ts) is what notices the day a review doesn't.

## 📚 Documentation is a wiki

The docs half is a wiki, not a file listing: a tree on the left that stays put while you read, a
breadcrumb, and prev/next within the group you are in. [`layers/docs/shared/wiki.ts`](./layers/docs/shared/wiki.ts) derives
that shape from nothing but the paths the collection found, which is the whole point — a
hand-written table of contents would be a fifth copy of the workspace layout to keep in step, and a
doc added anywhere appears in the nav on the next reload instead.

| Section | What lands in it |
| --- | --- |
| Workspace | The two files at the root, plus the generated `docs/FEATURES.md` |
| Docs | `docs/`, grouped by subdirectory: concepts, guides, the decision, audit and review rubrics |
| Projects | One group per project, holding its README, its `CLAUDE.md` and its nested READMEs |
| Agent setup | `.claude/skills/` and `.claude/agents/` |

Four things are deliberately **not** in the tree: `CHANGELOG.md`s, the dated reviews, the dated
audits and the numbered decision reports. Each already has a page of its own here, and a wiki that also lists them is a
second route to the same file that ages differently. The `README.md` beside each of those — the
review rubric, the decision template's rules — stays, because a doc about how a record is written is
not one of the records.

Labels are the one thing not taken verbatim: under a group already called `packages/ui`, a README
titled `📦 @monorepo/ui` says the name three times and the subject none, so it reads `Overview`. The
real title is still the page's own heading.

⌘K searches every README, `CLAUDE.md`, changelog, skill and doc, fed straight from the content
collection so there is no second index to keep in step. It is fetched **on the first open**, not by
the layout: the layout wraps every page, so an index built there rode in every prerendered payload
and made each one about ten times larger —
[`0014`](../../docs/decisions/0014-developer-portal-deployment.md) has the measurement. The cost
lands where it is asked for — roughly a megabyte of chunk and SQLite WASM, once per reader, with a
spinner while it arrives.

## 🔬 Decisions are their own section

The wiki nav is derived from paths alone, so the one question a reader brings to a list of decisions —
which of these decisions have actually landed — is the one thing it cannot answer, and it gets worse
with every report filed. [`/decisions`](./layers/decisions/app/pages/decisions/index.vue) answers it instead: the counts per
`status:`, filters over both frontmatter axes, and a sort by number, by last commit or by status.

| Fact | Where it comes from |
| --- | --- |
| The `status:` and `decision:` values | Each report's own frontmatter, parsed by the collector into `docs.json` — never re-derived here |
| The counts, the filters, the ordering | [`layers/decisions/shared/decisionReports.ts`](./layers/decisions/shared/decisionReports.ts), pure and specced beside itself |
| Newest first | A string compare on the number, which the four-digit padding in [`docs/decisions/README.md`](../../docs/decisions/README.md#-numbering) makes a numeric one |
| Prev/next on a report | The number again, so one report reads on to the next decision made rather than the next row of whatever sort was left on |

`status` shows as a pill on a report and as a tone beside it in the list — good for `implemented`,
warn for `to-implement`, neutral for `wont-implement`. A second, independent pill shows only when
`decision: superseded`, linking to the report that replaced it. Both come from the collected
snapshot, so a report filed since the last `collect` renders at its own URL but is missing from the
list — which is the same staleness every other page here has, shown by the same timestamp.

## 🔎 Audits count findings, not files

An audit is worked down one finding at a time, so the question a reader brings to
[`/audits`](./layers/audits/app/pages/audits/index.vue) is how much of each one is still owed. The collector
parses every table carrying both an `ID` and a `Status` header into `docs.json`; everything on the
page is derived from those rows.

| Fact | Where it comes from |
| --- | --- |
| Each finding's status | Its `Status` cell, parsed by [`parseFindings`](./layers/snapshot/shared/audits.ts) — a value outside the vocabulary counts as open |
| The audit's state | Derived by `auditStateOf`: open, in progress, or closed once nothing is open. Never written in the file |
| Progress, counts, filters, ordering | [`layers/audits/shared/auditReports.ts`](./layers/audits/shared/auditReports.ts), pure and specced beside itself |
| A malformed audit | [`tools/lib/audits.ts`](./tools/lib/audits.ts), surfaced as an `audit-shape-mismatch` invariant on the Overview |

## 📊 Telemetry

[`/telemetry`](./layers/telemetry/app/pages/telemetry.vue) shows how the repo's own tooling is used. `collect` reads
the raw rows every commit carries into `.telemetry/` (what a row holds and why is in
[`usage/`](../../infrastructure/scripts/src/usage/README.md)) and sums them in
[`layers/telemetry/shared/usage.ts`](./layers/telemetry/shared/usage.ts) and [`layers/telemetry/shared/lintUsage.ts`](./layers/telemetry/shared/lintUsage.ts). The rows
stay raw on purpose: a new question is a new function over the same files, not a migration of a
tally.

**Scripts.** Runs, how many came from an agent, failures, and the projects and flags each is called
with, beside every script folder so one nobody has run is visible as such.

| Alert | Fires when |
| --- | --- |
| Never run | A script folder has no recorded run |
| Stale | The last run was 90 or more days before the snapshot |
| Heavy | One script is 40% or more of the runs in the last 90 days |
| One project | Every run named the same project, or, when runs name none, happened on one branch area other than `repo` |
| One flag | 90% or more of runs pass the same flag |
| Agents only | No person has ever run it, which may mean the scripts README doesn't say when to |
| Failing | A quarter or more of runs exit non-zero; Ctrl+C doesn't count |

**Lint rules.** Hits on files an agent edited, the `eslint-disable` comments naming each rule, and
every rule some project's config switches on, read through ESLint's own `calculateConfigForFile`
in [`tools/lib/lintRules.ts`](./tools/lib/lintRules.ts). **Only agent edits are linted there:** your
own are fixed by the editor on save and never recorded, so a rule that only ever catches people
reads as never fired. The page says so above the numbers.

| Signal | Shows when |
| --- | --- |
| Never fired | Enabled, no hit in the last 90 days and never disabled inline, listed against the day recording began |
| Fought | Disabled inline three or more times |
| Noisy | One rule is 30% or more of recent hits, with at least five |
| Always auto-fixed | Five or more hits, every one settled by `--fix` |

The thresholds are constants in the layer's two `shared/` files. No pattern alert fires under five runs or
hits, since one is always 100% of itself.

## 🐙 Work in progress comes from GitHub, not from here

The Work in progress page reads the repo host's REST API from the reader's own browser and renders what comes back.
There is no local copy, no `log/`, no schema: an issue's state lives on GitHub, and a second record
of it in this repo would be a second answer to a question that already has one. This replaced a local
todo list that was exactly that mistake.

| Decision | Why |
| --- | --- |
| `fetch` in the browser, never `gh` on a server | The repo is public, so unauthenticated REST needs no credential — and a page that reads GitHub itself is a page that can be served as static files. A server existed only to hold the CLI's token |
| The endpoint is derived from `NUXT_PUBLIC_REPO_URL` | GitHub's REST host is the repo's own with `api.` in front, so [`issuesApiUrl`](./layers/github/shared/issues.ts) computes it and no vendor endpoint is written into this repo |
| A failure is rendered, not thrown | No network and a spent rate limit are facts about the reader, not about the repo. The page shows GitHub's own message, which explains itself better than anything written here |
| Pull requests are dropped | The REST issues endpoint returns both, so [`toIssues`](./layers/github/shared/issues.ts) filters on the `pull_request` key that only a PR carries |
| Label names without their colours | GitHub's label palette is arbitrary and this app's is [three validated status roles](#-design-system). Rendering one beside the other is how a page stops meaning anything |

**The board a card sits on is gone, and is not coming back without a token.** `projectItems` is a
GraphQL field, and GraphQL answers `403` unauthenticated — REST carries nothing about GitHub
Projects. So the board badge, the board filter and the Overview's "filed and never placed" count were
deleted rather than left to read `null`, which would have reported every open issue as unplaced. The
rate limit is **60 requests an hour per address**, shared by everyone behind it, and the read is once
per viewer per session rather than once a minute per server.

## 🪪 Projects are the catalog

The Projects page is a card per node in the collected Nx graph. Each project's title and description
come from its existing README through the Nuxt Content `docs` collection, so there is no second
hand-written project catalog. Each card also joins the graph to collect-time commit history, spec count
and coverage. `git rev-list` counts the project's history; `git log --since=2 weeks ago` adds the recent
commit count, so the browser never spends one GitHub request per project for data already present in the
checkout.

Deployments are the exception because they can change after the static site ships. The browser reads
GitHub's unauthenticated `deployments` endpoint once, then the newest status for each environment;
the production URL travels in that status. Today those deployments belong to `huella-legal`, so its
card carries an **Open site** link and a **Deploys** link to its GitHub Actions workflow, plus an
**API** link to the `/_scalar` reference on that same URL, so it disappears with the site link. This
portal gets the same pair: its Pages URL is derived from the repository name, and its deploy link opens
the Pages workflow. Neither is an in-app write action.

`@monorepo/ui`'s Storybook is built into the same Pages artifact under `/storybook/`, and
`@monorepo/huella-legal`'s under `/huella-legal-storybook/`. A second Pages deploy would replace this
dashboard, so the deploy workflow builds each static Storybook beneath the Nuxt app and configures its
Vite base from Pages' derived path. Each card links to its own without a stored public URL.

## 💾 One store, and it is disposable

`.report/` holds the collected snapshot — coverage, metrics, docs, the graph, the scorecards — is
gitignored, and is rebuilt by `pnpm exec nx collect @monorepo/developer-portal` in seconds. A snapshot that
gets committed is a report that goes stale silently. Nothing else here is stored at all: the docs,
the reviews and the changelogs are files in the tree read where they live, and the issues are read
live off GitHub. If you delete every derived file in this project, one command puts it back.

The one committed snapshot is `docs/workflows/projects/*.snapshot.json`, and it is the exception on
purpose: a project's progress has to render on the deployed site, which has no token to ask GitHub
for closed issues and blocked-by links, and no history to read commit activity from. `pnpm workflow:sync` rewrites it, the page prints when it last
changed, and a malformed one shows as a file problem rather than blanking the page.

## 🚢 The deployed site is a snapshot

[`developer-portal-deploy.yml`](../../.github/workflows/developer-portal-deploy.yml) prerenders this app and publishes it to
GitHub Pages on every push to `master`, plus by hand from `workflow_dispatch`. Static files, no host
and no secret: the repo is public, and the one thing here that needed a credential went away when
the issues read moved into the browser. Pages has to be set to build from GitHub Actions in the
repo's settings — the workflow reads that configuration, it does not create it.

| Step | What it is there for |
| --- | --- |
| `pnpm test:coverage` | The collector reads every project's `coverage-summary.json` plus the merged report, and neither exists until this has run over the whole workspace |
| `pnpm exec nx collect @monorepo/developer-portal` | Nuxt copies `public/embed/**` into the output, so the snapshot is a build input rather than something the deploy hands over afterwards |
| `pnpm exec nx build-static @monorepo/developer-portal` | `nuxt build --prerender`. Plain `build` is SSR and would leave a server to host |

It is a job of its own rather than three steps on `checks`, which is `affected` by design: this is a
full coverage run and a collection of the cross-file invariant findings, producing an artifact no
pull-request check reads.

**This project overrides its own `production` Nx input**, in [`package.json`](./package.json), and
the deploy is wrong without it. The workspace default excludes `!{projectRoot}/**/*.md` and scopes
everything to the project, so nothing this app renders was a build input: editing any doc left the
task hash unchanged and `nx affected` reported no project at all for a file under `docs/`. The
override adds three entries.

| Addition | What it buys |
| --- | --- |
| `{workspaceRoot}/**/*.md` | A doc anywhere is a build input, **and** it is what makes `nx affected` name this project for a file that belongs to none — no `implicitDependencies` entry needed |
| `{workspaceRoot}/docs/workflows/**/*` | The same for the workflow YAML and snapshots, which aren't markdown and so slipped past the line above |
| A `runtime` input running [`snapshotStamp.ts`](./tools/lib/snapshotStamp.ts) | `.report/` is gitignored, so it is absent from Nx's file map and a file input over it hashes *nothing* — a re-collected snapshot still replayed a cached `.output`. Stdout is hashed instead |

Two values are baked in at build time, because a static site keeps no server to read runtime config
from: `NUXT_APP_BASE_URL`, which a project page needs since it serves from `/<repo>/` rather than the
root, and `NUXT_PUBLIC_REPO_URL`. The workflow derives both from the run — the first from
`actions/configure-pages`, the second from the repo it is running in — so neither is written down
here. A `public/` path that Nuxt does not rewrite goes through
[`embedUrl`](./app/utils/embed.ts) for the same reason.

**Every page is as old as the last deploy**, which is the price of the snapshot and worth reading off
the Overview's own `manifest.commit`: the docs travel with the build rather than being read in place,
and the advisory count was true when `pnpm audit` ran. Issues are the exception, because the browser
fetches them. Workflows are older still: as old as the last committed `pnpm workflow:sync`.

## 🔍 What it checks that nothing else does

`tools/lib/invariants.ts` re-runs the cross-file rules
[`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) enforces on edit: the tag table
written twice, the workspace-layout block, a review with no row in the history table. The hook only
fires while an agent is editing a file; these run over the whole tree on every collect and show up
as findings on the Overview. Nothing in CI runs them, so drift introduced by hand is reported here
and blocks nothing — [`0025`](../../docs/decisions/0025-check-docs-removal.md) records why.
The two copies are kept honest by [`invariants.spec.ts`](./tools/lib/invariants.spec.ts) — which is
the entire reason they exist as pure functions rather than more shell.

The rules parse with `yaml` rather than a regex, because `@nuxt/content` reads these same bytes as
YAML to render the page — a checker that disagreed with it about what parses would fail reports the
dashboard shows correctly. The split is deliberate: the vocabulary is
[`layers/snapshot/shared/decisions.ts`](./layers/snapshot/shared/decisions.ts), which `layers/snapshot/shared/types.ts` derives `DecisionStatus` and
`DecisionOutcome` from and which client code can import; the parsing lives in `tools/` so a node-only
dependency never reaches the browser bundle.

Four checks here have no shell-hook twin, and each guards a shape a page's parser depends on:

| Check | Flags |
| --- | --- |
| `compareScorecardShape` | A review whose `## 🧮 Scores` table doesn't match `SCORECARDS.md`'s seven cards, in order, each `n/5` |
| `compareAuditShape` | An audit with a bad filename, missing frontmatter, a reused ID or an unknown status |
| `compareDecisionShape` | A decision report with a bad filename, a reused number, an unknown `status:`/`decision:`, no `issue:` or a dangling `supersededBy:` |
| `compareWorkflowShape` | A workflow template, project or snapshot that breaks a rule in [`docs/workflows/README.md`](../../docs/workflows/README.md), or a `reuse.from` path that doesn't exist |

## 🎨 Design system

The [`design`](./layers/design) layer is the only place a value is chosen. Components use Nuxt UI's
semantic roles (`text-muted`, `border-default`, `bg-elevated`) and Tailwind's scale, and ESLint
rejects a bracketed value such as `text-[11px]` and any class Tailwind doesn't know.

| Piece | Where | What it is |
| --- | --- | --- |
| `--tone-good`, `-warn`, `-bad` | [`main.css`](./layers/design/app/assets/main.css) | The three status colours, with a `.tone-*` class each. [`toneClass`](./app/utils/format.ts) maps a `Tone` to its class, so no class name is built from a string |
| `text-2xs` | `main.css` | The one type step under `text-xs`, for timestamps and tags |
| `.data-table`, `.numeric` | `main.css` | Every table: header, row rule, hover and cell padding, with `numeric` for a right-aligned figure |
| `.embedded-report` | `main.css` | The white frame the vendored coverage report and Nx graph render in |
| `variant="flush"` on `UCard` | [`app.config.ts`](./layers/design/app/app.config.ts) | A card with no body padding, for a table or a list of rows |
| `--state-*`, `--stage-*` | [`workflows.css`](./layers/workflows/app/assets/workflows.css) | One colour per block state and per stage, read through `stateColor` and `stageColor`. They live with the feature so they leave with it |

A hover or resting tint is `bg-elevated/50` and a selected row is `bg-elevated`. A colour that
depends on data reaches the template as a CSS variable, as in `text-(--state)`, never as a literal.
Layout that only one component needs, such as the skyline's grid, stays in that component's scoped
style, and the classes it hangs off are listed in [`eslint.config.ts`](./eslint.config.ts).

The three status colours were validated as a set against both the light and the dark surface —
lightness band, chroma floor, colourblind separation, normal-vision separation, contrast. Five bands
were tried first and failed: an orange and a red land 7.1 apart on the normal-vision scale, which no
amount of good intent fixes. Three pass, and every one of them sits beside the number it describes.
Nothing here is ever a colour alone. Re-run the validator in the `dataviz` skill before changing one.

## 📐 Boundaries

`type:app`, `scope:internal`. It imports no workspace package except `@monorepo/configs`, and
nothing imports it — a leaf that happens to read the whole repo from the outside, which is the only
position from which it could describe it. [`docs/README.md`](../../docs/README.md) deferred exactly
this app once, on the grounds that rendering the docs tree needed a boundary decision first; the
answer turned out to need no new tag, because an app that only *reads* the workspace composes
nothing and so violates nothing.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A time-series chart of review totals | The scorecards page already lists every review's total, newest first, parsed straight from each review file rather than from the hand-edited history table — so the objection that used to block this (a hand-edited row becoming a rendering bug) no longer applies. A chart still needs six or seven rows before it says anything a column of numbers doesn't |
| Writing to GitHub from here — closing an issue, moving a card | Every write needs a credential, which the browser-side read deliberately removed, plus an undo story, an optimistic-update story and a permission story. Reading is the whole value; `pnpm issue:add` and `pnpm issue:pick` already cover filing and starting |
| A decision's `issue:` shown beside it, or filtered on | The collector parses that field already and keeps only `status`, `decision` and `supersededBy`; carrying it would be one more field on `DocPage` and a link out to GitHub. Every report states its issue in its own Context section, and two reports may share one — so it sorts and groups worse than the number the list already uses |
| Closed issues, or issues from another repo | `state=open` on the repo `NUXT_PUBLIC_REPO_URL` names. Both are one parameter; neither has a question this page is asked yet, and each doubles the requests against a 60-an-hour limit |
| Ordering "What's next" by board column, or showing the board at all | Needs `projectItems`, which is GraphQL-only and so needs a token — the thing reading from the browser exists to avoid. Sorted by last touched instead |
| Collecting on demand from the UI | `pnpm exec nx collect @monorepo/developer-portal` shells out to `nx graph` and `eslint` and takes tens of seconds. A button means a run state to poll and a way to cancel — the terminal already has both |
| An `nx` run panel | A command can run in local development, but its result would be frozen into the deployed static site. GitHub Actions remains the deployed action runner until a server-backed execution model exists |
| A feature-flag toggle | No flag vendor is configured yet; when one is, its card may link to that vendor's own authenticated UI, but this app still does not hold a credential or make the write |
