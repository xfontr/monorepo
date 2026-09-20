# 📦 @monorepo/developer-portal

The developer portal is the public front door to the repository and a deeper engineering/DX surface
for understanding and working with it. It helps visitors explore what exists, understand how it works,
or run and contribute, while keeping the collected engineering-health views available for deeper use.
It is presented publicly as Monorepo, and the application is read-only.

It renders every markdown file in the workspace as a wiki — READMEs, `AGENTS.md`s, the
[`docs/`](../../docs/README.md) tree, reviews and changelogs — beside the things that are not written
down anywhere: coverage, the project graph, open GitHub issues and which two files have stopped agreeing.

It runs two ways. `pnpm dev developer-portal` reads the working tree and shells out to `git`, so it shows
the branch you are on; the deployed site is a prerendered snapshot of `master`, published by
[`developer-portal-deploy.yml`](../../.github/workflows/developer-portal-deploy.yml) — see
[🚢 The deployed site is a snapshot](#-the-deployed-site-is-a-snapshot).

## 🧭 The public entry points

The interface starts with three public intents, using ordinary language before repository-specific
terms.

| Intent | Starts with |
| --- | --- |
| Explore what exists | Overview, Projects and What's new |
| Understand how it works | Documentation, Architecture and Decisions |
| Run or contribute | The first-hour guide and the repository documentation |

Engineering health remains available after that introduction: the homepage places it below the featured
projects, and the sidebar keeps it as the final group. Coverage, dependencies, reviews, scorecards and
work in progress remain directly addressable without creating a second application or navigation tree.

## 🗂 Structure

| Path | What lives there |
| --- | --- |
| `app/` | The Nuxt UI dashboard — pages and components |
| `server/api/` | Small reads of the collected artifacts and the navigation badge counts. The issues come straight from GitHub to the browser |
| `shared/` | Pure logic — the wiki's shape, the issue rules, the decision vocabulary, the decision list's own filtering and counting, and where a doc's link points. Imported by app, server and tools alike |
| `tools/collect/` | Builds the derived snapshot: graph, coverage, metrics, docs, scorecards |
| `tools/lib/` | Node-only helpers — paths, the `git` allowlist, the invariant checks, and the remark plugin that rewrites a doc's links as it is parsed |

## 📄 The markdown is read in place

[`content.config.ts`](./content.config.ts) points `@nuxt/content` at the **workspace root**, not at a
copy inside this app. That is what makes the docs half free: the README you edit for GitHub is the
same file this renders, and a page's URL mirrors its path in the repo.

Under `pnpm dev developer-portal` that file is read where it lives, so the two cannot drift. A build bakes
the whole corpus into the bundle instead, which is why the deployed site is only ever as fresh as its
last deploy — [🚢 The deployed site is a snapshot](#-the-deployed-site-is-a-snapshot) is the rest of
that.

| Page | Reads |
| --- | --- |
| Documentation | Every non-ignored `*.md`, arranged as a tree — see [🧭 Documentation is a wiki](#-documentation-is-a-wiki) |
| Architecture | The collected Nx graph, its plain-language relationships and the vendored detailed graph under `public/embed/graph/` |
| Projects | The collected Nx graph joined to collect-time project metrics, with deployment state read live |
| Decisions | `docs/decisions/NNNN-<slug>.md` — the files the `decision-report` skill writes, see [🔬 Decisions are their own section](#-decisions-are-their-own-section) |
| Reviews | `docs/reviews/YYYY-MM-DD-<sha>.md` — the files the `repo-review` skill writes |
| Work in progress | Open issues read from GitHub in the browser |
| What's new | Every `CHANGELOG.md`, beside its unreleased-commit count |
| Engineering health | Coverage, dependencies, reviews, scorecards and collected repository findings |

`@nuxt/content` lower-cases every route, so `packages/ui/README.md` is served at
`/packages/ui/readme` while the collector keys the same file as `packages/ui/README.md`. Anything
joining the two — a broken-link warning, an "updated 3 days ago" — goes through
[`toCollectionPath`](./shared/wiki.ts) first. A hand-written `/docs/…/README` link matches nothing
and fails silently, which is exactly how it went unnoticed the first time.

The links *inside* a doc are written for GitHub and point at files, not routes — `./.husky/pre-push`,
`../packages/ui/README.md`, a directory, a line range. Rendering them verbatim
put 32 links on a hard 404 and another 33 on the wiki's own "No such page" at HTTP 200 —
[`0014`](../../docs/decisions/0014-developer-portal-deployment.md) has the measurement. They cannot be fixed in
the markdown, because on GitHub they are already correct.

[`remarkDocLinks`](./tools/lib/remarkDocLinks.ts) rewrites each one **while the file is parsed**,
which is the only moment both things it needs are in reach: the source file's own path, and a
filesystem to ask. A target that is markdown on disk becomes a route; everything else becomes
`repo:`, which [`ProseA`](./app/components/content/ProseA.vue) turns into a link to the forge once
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
[`checkLink`](./tools/collect/docs.ts) still fails the build on it.

A review's markdown is rendered as-is here, exactly like every other doc — nothing about it is
recomputed. **Scorecards** is the one exception, and a narrow one: `tools/collect/scorecards.ts`
parses each review's own `## 🧮 Scores` table and shows the numbers as tiles and a table
instead of a raw markdown table, but every figure is copied verbatim out of the file `repo-review`
already wrote — nothing here re-scores or re-derives a total. That only stays honest because the
table has one shape across every review: the seven cards `SCORECARDS.md` lists, in that order, each
`n/5`. The `repo-review` skill is told to keep it that way, and
[`compareScorecardShape`](./tools/lib/invariants.ts) is what notices the day a review doesn't.

## 🧭 Documentation is a wiki

The docs half is a wiki, not a file listing: a tree on the left that stays put while you read, a
breadcrumb, and prev/next within the group you are in. [`shared/wiki.ts`](./shared/wiki.ts) derives
that shape from nothing but the paths the collection found, which is the whole point — a
hand-written table of contents would be a fifth copy of the workspace layout to keep in step, and a
doc added anywhere appears in the nav on the next reload instead.

| Section | What lands in it |
| --- | --- |
| Workspace | The two files at the root, plus the generated `docs/FEATURES.md` |
| Docs | `docs/`, grouped by subdirectory: concepts, guides, the decision and review rubrics |
| Projects | One group per project, holding its README, its `AGENTS.md` and its nested READMEs |
| Agent setup | The canonical `.agents/skills/` and Claude's native `.claude/agents/` definitions |

Three things are deliberately **not** in the tree: `CHANGELOG.md`s, the dated reviews and the
numbered decision reports. Each already has a page of its own here, and a wiki that also lists them is a
second route to the same file that ages differently. The `README.md` beside each of those — the
review rubric, the decision template's rules — stays, because a doc about how a record is written is
not one of the records. Project-specific skills still live at the root with namespaced names. Codex
only discovers skills from directories above its starting point, so one canonical root avoids a
package skill silently disappearing when an agent starts at the workspace root.

Labels are the one thing not taken verbatim: under a group already called `packages/ui`, a README
titled `📦 @monorepo/ui` says the name three times and the subject none, so it reads `Overview`. The
real title is still the page's own heading.

⌘K searches every README, `AGENTS.md`, changelog, skill and doc, fed straight from the content
collection so there is no second index to keep in step. It is fetched **on the first open**, not by
the layout: the layout wraps every page, so an index built there rode in all 103 prerendered
payloads and made them 725 KB each against 75 KB now. The cost lands where it is asked for — roughly
a megabyte of chunk and SQLite WASM, once per reader, with a spinner while it arrives.

## 🔬 Decisions are their own section

The wiki nav is derived from paths alone, so the one question a reader brings to a list of decisions —
which of these decisions have actually landed — is the one thing it cannot answer, and it gets worse
with every report filed. [`/decisions`](./app/pages/decisions/index.vue) answers it instead: the counts per
`status:`, filters over both frontmatter axes, and a sort by number, by last commit or by status.

| Fact | Where it comes from |
| --- | --- |
| The `status:` and `decision:` values | Each report's own frontmatter, parsed by the collector into `docs.json` — never re-derived here |
| The counts, the filters, the ordering | [`shared/decisionReports.ts`](./shared/decisionReports.ts), pure and specced beside itself |
| Newest first | A string compare on the number, which the four-digit padding in [`docs/decisions/README.md`](../../docs/decisions/README.md#-numbering) makes a numeric one |
| Prev/next on a report | The number again, so one report reads on to the next decision made rather than the next row of whatever sort was left on |

`status` shows as a pill on a report and as a tone beside it in the list — good for `implemented`,
warn for `to-implement`, neutral for `wont-implement`. A second, independent pill shows only when
`decision: superseded`, linking to the report that replaced it. Both come from the collected
snapshot, so a report filed since the last `collect` renders at its own URL but is missing from the
list — which is the same staleness every other page here has, shown by the same timestamp.

## 🐙 Work in progress comes from GitHub, not from here

The Work in progress page reads `api.github.com` from the reader's own browser and renders what comes back.
There is no local copy, no `log/`, no schema: an issue's state lives on GitHub, and a second record
of it in this repo would be a second answer to a question that already has one. This replaced a local
todo list that was exactly that mistake.

| Decision | Why |
| --- | --- |
| `fetch` in the browser, never `gh` on a server | The repo is public, so unauthenticated REST needs no credential — and a page that reads GitHub itself is a page that can be served as static files. A server existed only to hold the CLI's token |
| The endpoint is derived from `NUXT_PUBLIC_REPO_URL` | GitHub's REST host is the repo's own with `api.` in front, so [`issuesApiUrl`](./shared/issues.ts) computes it and no vendor endpoint is written into this repo |
| A failure is rendered, not thrown | No network and a spent rate limit are facts about the reader, not about the repo. The page shows GitHub's own message, which explains itself better than anything written here |
| Pull requests are dropped | The REST issues endpoint returns both, so [`toIssues`](./shared/issues.ts) filters on the `pull_request` key that only a PR carries |
| Label names without their colours | GitHub's label palette is arbitrary and this app's is [three validated status roles](#-colour). Rendering one beside the other is how a page stops meaning anything |

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
and coverage. `git rev-list` counts the project's history; `git log --since=90 days ago` becomes commits
per week, so the browser never spends one GitHub request per project for data already present in the checkout.

Deployments are the exception because they can change after the static site ships. The browser reads
GitHub's unauthenticated `deployments` endpoint once, then the newest status for each environment;
the production URL travels in that status. Today those deployments belong to `huella-legal`, so its
card carries an **Open site** link and a **Deploys** link to its GitHub Actions workflow. Technical
Docs gets the same pair: its Pages URL is derived from the repository name, and its deploy link opens
the Pages workflow. Neither is an in-app write action.

`@monorepo/ui`'s Storybook is built into the same Pages artifact under `/storybook/`. A second Pages
deploy would replace this dashboard, so the deploy workflow builds the static Storybook beneath the
Nuxt app and configures its Vite base from Pages' derived path. The UI card links there without a
stored public URL.

## 💾 One store, and it is disposable

`.report/` holds the collected snapshot — coverage, metrics, docs, the graph, the scorecards — is
gitignored, and is rebuilt by `pnpm exec nx collect @monorepo/developer-portal` in seconds. A snapshot that
gets committed is a report that goes stale silently. Nothing else here is stored at all: the docs,
the reviews and the changelogs are files in the tree read where they live, and the issues are read
live off GitHub. If you delete every derived file in this project, one command puts it back.

## 🚀 Development

| Command | What it does |
| --- | --- |
| `pnpm dev developer-portal` | Start the portal |
| `pnpm exec nx collect @monorepo/developer-portal` | Rebuild the snapshot — graph, coverage, metrics, docs, scorecards |
| `pnpm exec nx nuxt-prepare @monorepo/developer-portal` | Regenerates `.nuxt` (`nuxi prepare`) — [`nx.json`](../../nx.json) already runs it before `lint`/`typecheck`/`test`, so this is only for calling it by hand |
| `pnpm exec nx build-static @monorepo/developer-portal` | `nuxt build --prerender` — the build the deploy publishes, and the only one that renders every route |

The collector reads each project's `coverage/coverage-summary.json` and copies in the merged report
`pnpm test:coverage` renders at the workspace root, so both are only as fresh as the last run of it.

`build` delegates to `build-static`, because `nx affected -t build` only ever looks for a target
called `build` — the same indirection [`apps/huella-legal`](../huella-legal/README.md) uses, pointed
at a different target. **CI therefore builds the artifact that deploys**, which is the point: this
app was broken under `--prerender` while the SSR build went green, so an SSR build here would verify
a mode nothing runs. It survives as the plugin's inferred `nuxt:build` and is never invoked —
`@nx/nuxt` infers it from `nuxt.config.ts` for every Nuxt project, and `huella-legal` genuinely
serves that way. Prerendering costs nothing to check: 14s against the SSR build's 15s, and it
succeeds with no `.report/` at all, rendering 181 routes instead of 211.

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
override adds two entries, and they fix different halves.

| Addition | What it buys |
| --- | --- |
| `{workspaceRoot}/**/*.md` | A doc anywhere is a build input, **and** it is what makes `nx affected` name this project for a file that belongs to none — no `implicitDependencies` entry needed |
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
fetches them.

## 🔍 What it checks that nothing else does

`tools/lib/invariants.ts` re-runs the cross-file rules
[`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) enforces on edit: the tag table
written twice, the workspace-layout block, a review with no row in the history table. The hook only
fires while an agent is editing a file; these run over the whole tree on every collect **and in
CI**, via the repository's blocking checks (`ci.yml`), so drift introduced by hand or
pushed without an agent in the loop fails the build instead of only showing up on the dashboard.
The two copies are kept honest by [`invariants.spec.ts`](./tools/lib/invariants.spec.ts) — which is
the entire reason they exist as pure functions rather than more shell.

The rules parse with `yaml` rather than a regex, because `@nuxt/content` reads these same bytes as
YAML to render the page — a checker that disagreed with it about what parses would fail reports the
dashboard shows correctly. The split is deliberate: the vocabulary is
[`shared/decisions.ts`](./shared/decisions.ts), which `shared/types.ts` derives `DecisionStatus` and
`DecisionOutcome` from and which client code can import; the parsing lives in `tools/` so a node-only
dependency never reaches the browser bundle.

One check here has no shell-hook twin: `compareScorecardShape` flags a review whose `## 🧮 Scores`
table doesn't match `SCORECARDS.md`'s seven cards, in order, each `n/5` — the shape the scorecards
page's parser depends on. It runs only on collect, not on edit; a malformed table shows up as a
finding on the Overview page rather than blocking the write, which is a deliberate, smaller footprint
than the other invariants get.

## 📊 Colour

Three status colours, validated as a set against both the light and the dark surface — lightness
band, chroma floor, colourblind separation, normal-vision separation, contrast. Five bands were
tried first and failed: an orange and a red land 7.1 apart on the normal-vision scale, which no
amount of good intent fixes. Three pass, and every one of them sits beside the number it describes.
Nothing here is ever a colour alone.

The values live in [`app/assets/css/main.css`](./app/assets/css/main.css). Re-run the validator in
the `dataviz` skill before changing one.

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
