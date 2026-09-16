# 🩺 @monorepo/tech-docs

The repo's own dashboard. It renders every markdown file in the workspace as a wiki — READMEs,
`CLAUDE.md`s, the [`docs/`](../../docs/README.md) tree, the reviews, the changelogs — beside the
things that are not written down anywhere: coverage, the project graph, the open GitHub issues,
which two files have stopped agreeing.

It is served locally — `pnpm dev tech-docs` — reading the working tree and shelling out to `git`.
It builds, and it is not deployed anywhere yet:
[`0014`](../../docs/spikes/0014-tech-docs-deployment.md) is what the rest of that takes.

## 🗂 Structure

| Path | What lives there |
| --- | --- |
| `app/` | The Nuxt UI dashboard — pages and components |
| `server/api/` | The one read a page makes of this app itself: the collected snapshot. The issues come straight from GitHub to the browser |
| `shared/` | Pure logic — the wiki's shape, the issue rules, the spike vocabulary, the spike list's own filtering and counting, and where a doc's link points. Imported by app, server and tools alike |
| `tools/collect/` | Builds the derived snapshot: graph, coverage, metrics, docs, scorecards |
| `tools/check-docs/` | The CI gate: the link check, the invariants and the spike rules, run over the whole tree and exit non-zero on a finding |
| `tools/lib/` | Node-only helpers — paths, the `git` allowlist, the invariant checks, and the remark plugin that rewrites a doc's links as it is parsed |

## 📄 The markdown is read in place

[`content.config.ts`](./content.config.ts) points `@nuxt/content` at the **workspace root**, not at a
copy inside this app. That is what makes the docs half free: the README you edit for GitHub is the
same file this renders, so the two cannot drift, and a page's URL mirrors its path in the repo.

| Page | Reads |
| --- | --- |
| Wiki | Every tracked `*.md`, arranged as a tree — see [🧭 The wiki](#-the-wiki) |
| Spikes | `docs/spikes/NNNN-<slug>.md` — the files the `spike-report` skill writes, see [🔬 Spikes are their own section](#-spikes-are-their-own-section) |
| Reviews | `docs/reviews/YYYY-MM-DD-<sha>.md` — the files the `repo-review` skill writes |
| Changelog | Every `CHANGELOG.md`, beside its unreleased-commit count |

`@nuxt/content` lower-cases every route, so `packages/ui/README.md` is served at
`/packages/ui/readme` while the collector keys the same file as `packages/ui/README.md`. Anything
joining the two — a broken-link warning, an "updated 3 days ago" — goes through
[`toCollectionPath`](./shared/wiki.ts) first. A hand-written `/docs/…/README` link matches nothing
and fails silently, which is exactly how it went unnoticed the first time.

The links *inside* a doc are written for GitHub and point at files, not routes — `./.husky/pre-push`,
`../packages/ui/README.md`, a directory, a line range. Rendering them verbatim
put 32 links on a hard 404 and another 33 on the wiki's own "No such page" at HTTP 200 —
[`0014`](../../docs/spikes/0014-tech-docs-deployment.md) has the measurement. They cannot be fixed in
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

Parse time is also what retires the route-table check `check-docs` briefly carried: a route is only
ever emitted for a file the parser has just confirmed, so a link that resolves on disk and routes
nowhere can no longer be built. A link to a *missing* file is still a real defect, and
[`checkLink`](./tools/collect/docs.ts) still fails the build on it.

A review's markdown is rendered as-is here, exactly like every other doc — nothing about it is
recomputed. **Scorecards** is the one exception, and a narrow one: `tools/collect/scorecards.ts`
parses each review's own `## 🧮 Scores` table and shows the numbers as tiles and a sortable table
instead of a raw markdown table, but every figure is copied verbatim out of the file `repo-review`
already wrote — nothing here re-scores or re-derives a total. That only stays honest because the
table has one shape across every review: the seven cards `SCORECARDS.md` lists, in that order, each
`n/5`. The `repo-review` skill is told to keep it that way, and
[`compareScorecardShape`](./tools/lib/invariants.ts) is what notices the day a review doesn't.

## 🧭 The wiki

The docs half is a wiki, not a file listing: a tree on the left that stays put while you read, a
breadcrumb, and prev/next within the group you are in. [`shared/wiki.ts`](./shared/wiki.ts) derives
that shape from nothing but the paths the collection found, which is the whole point — a
hand-written table of contents would be a fifth copy of the workspace layout to keep in step, and a
doc added anywhere appears in the nav on the next reload instead.

| Section | What lands in it |
| --- | --- |
| Workspace | The two files at the root, plus the generated `docs/FEATURES.md` |
| Docs | `docs/`, grouped by subdirectory: concepts, guides, the spike and review rubrics |
| Projects | One group per project, holding its README, its `CLAUDE.md`, its nested READMEs and its own skills |
| Agent setup | The root `.claude/` skills and subagents |

Three things are deliberately **not** in the tree: `CHANGELOG.md`s, the dated reviews and the
numbered spike reports. Each already has a page of its own here, and a wiki that also lists them is a
second route to the same file that ages differently. The `README.md` beside each of those — the
review rubric, the spike template's rules — stays, because a doc about how a record is written is
not one of the records. A project's `.claude/skills/` stays with that project rather than with the
root agent setup, because that is the only place those skills apply.

Labels are the one thing not taken verbatim: under a group already called `packages/ui`, a README
titled `📦 @monorepo/ui` says the name three times and the subject none, so it reads `Overview`. The
real title is still the page's own heading.

## 🔬 Spikes are their own section

The wiki nav is derived from paths alone, so the one question a reader brings to a list of spikes —
which of these decisions have actually landed — is the one thing it cannot answer, and it gets worse
with every report filed. [`/spikes`](./app/pages/spikes/index.vue) answers it instead: the counts per
`status:`, filters over both frontmatter axes, and a sort by number, by last commit or by status.

| Fact | Where it comes from |
| --- | --- |
| The `status:` and `decision:` values | Each report's own frontmatter, parsed by the collector into `docs.json` — never re-derived here |
| The counts, the filters, the ordering | [`shared/spikeReports.ts`](./shared/spikeReports.ts), pure and specced beside itself |
| Newest first | A string compare on the number, which the four-digit padding in [`docs/spikes/README.md`](../../docs/spikes/README.md#-numbering) makes a numeric one |
| Prev/next on a report | The number again, so one report reads on to the next decision made rather than the next row of whatever sort was left on |

`status` shows as a pill on a report and as a tone beside it in the list — good for `implemented`,
warn for `to-implement`, neutral for `wont-implement`. A second, independent pill shows only when
`decision: superseded`, linking to the report that replaced it. Both come from the collected
snapshot, so a report filed since the last `collect` renders at its own URL but is missing from the
list — which is the same staleness every other page here has, shown by the same timestamp.

## 🐙 Issues come from GitHub, not from here

The Issues page reads `api.github.com` from the reader's own browser and renders what comes back.
There is no local copy, no `log/`, no schema: an issue's state lives on GitHub, and a second record
of it in this repo would be a second answer to a question that already has one. This replaced a local
todo list that was exactly that mistake.

| Decision | Why |
| --- | --- |
| `fetch` in the browser, never `gh` on a server | The repo is public, so unauthenticated REST needs no credential — and a page that reads GitHub itself is a page that can be served as static files. A server existed only to hold the CLI's token |
| The endpoint is derived from `NUXT_PUBLIC_REPO_URL` | GitHub's REST host is the repo's own with `api.` in front, so [`issuesApiUrl`](./shared/issues.ts) computes it and no vendor endpoint is written into this repo |
| A failure is rendered, not thrown | No network and a spent rate limit are facts about the reader, not about the repo. The page shows GitHub's own message, which explains itself better than anything written here |
| Pull requests are dropped | The REST issues endpoint returns both and `gh issue list` did not. [`toIssues`](./shared/issues.ts) filters on the `pull_request` key that only a PR carries |
| Label names without their colours | GitHub's label palette is arbitrary and this app's is [three validated status roles](#-colour). Rendering one beside the other is how a page stops meaning anything |

**The board a card sits on is gone, and is not coming back without a token.** `projectItems` is a
GraphQL field, and GraphQL answers `403` unauthenticated — REST carries nothing about GitHub
Projects. So the board badge, the board filter and the Overview's "filed and never placed" count were
deleted rather than left to read `null`, which would have reported every open issue as unplaced. The
rate limit is **60 requests an hour per address**, shared by everyone behind it, and the read is once
per viewer per session rather than once a minute per server.

## 💾 One store, and it is disposable

`.report/` holds the collected snapshot — coverage, metrics, docs, the graph, the scorecards — is
gitignored, and is rebuilt by `pnpm exec nx collect @monorepo/tech-docs` in seconds. A snapshot that
gets committed is a report that goes stale silently. Nothing else here is stored at all: the docs,
the reviews and the changelogs are files in the tree read where they live, and the issues are read
live off GitHub. If you delete every derived file in this project, one command puts it back.

## 🚀 Development

| Command | What it does |
| --- | --- |
| `pnpm dev tech-docs` | Start Technical Docs |
| `pnpm exec nx collect @monorepo/tech-docs` | Rebuild the snapshot — graph, coverage, metrics, docs, scorecards |
| `pnpm exec nx check-docs @monorepo/tech-docs` | The CI gate — broken links, the mirrored invariants and malformed spike frontmatter, over every tracked doc; exits 1 on a finding |
| `pnpm exec nx nuxt-prepare @monorepo/tech-docs` | Regenerates `.nuxt` (`nuxi prepare`) — [`nx.json`](../../nx.json) already runs it before `lint`/`typecheck`/`test`, so this is only for calling it by hand |

The collector reads each project's `coverage/coverage-summary.json` and copies in the merged report
`pnpm test:coverage` renders at the workspace root, so both are only as fresh as the last run of it.

`build` delegates to `nuxt:build` because that is what the `@nx/nuxt` plugin names its inferred
target, and `nx affected -t build` only ever looks for `build` — the same indirection
[`apps/huella-legal`](../huella-legal/README.md) uses. A build carries the whole workspace's
markdown as a snapshot rather than reading it in place, so it is not what `pnpm dev tech-docs`
serves; see [`0014`](../../docs/spikes/0014-tech-docs-deployment.md).

## 🔍 What it checks that nothing else does

`tools/lib/invariants.ts` re-runs the cross-file rules
[`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) enforces on edit: the tag table
written twice, the workspace-layout block, a review with no row in the history table. The hook only
fires while an agent is editing a file; these run over the whole tree on every collect **and in
CI**, via `pnpm exec nx check-docs @monorepo/tech-docs` (`ci.yml`), so drift introduced by hand or
pushed without an agent in the loop fails the build instead of only showing up on the dashboard.
The two copies are kept honest by [`invariants.spec.ts`](./tools/lib/invariants.spec.ts) — which is
the entire reason they exist as pure functions rather than more shell.

`check-docs` runs only what CI needs as a gate — the link check, the invariants and
[`tools/lib/spikes.ts`](./tools/lib/spikes.ts)'s frontmatter rules, using `collectGraph` for real
project roots — not the full `collect` pipeline's coverage, deps and scorecards, which stay
dashboard-only reads with no pass/fail meaning.

The rules parse with `yaml` rather than a regex, because `@nuxt/content` reads these same bytes as
YAML to render the page — a checker that disagreed with it about what parses would fail reports the
dashboard shows correctly. The split is deliberate: the vocabulary is
[`shared/spikes.ts`](./shared/spikes.ts), which `shared/types.ts` derives `SpikeStatus` and
`SpikeDecision` from and which client code can import; the parsing lives in `tools/` so a node-only
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
| A spike's `issue:` shown beside it, or filtered on | The collector parses that field already and keeps only `status`, `decision` and `supersededBy`; carrying it would be one more field on `DocPage` and a link out to GitHub. Every report states its issue in its own Context section, and two reports may share one — so it sorts and groups worse than the number the list already uses |
| Closed issues, or issues from another repo | `state=open` on the repo `NUXT_PUBLIC_REPO_URL` names. Both are one parameter; neither has a question this page is asked yet, and each doubles the requests against a 60-an-hour limit |
| Ordering "What's next" by board column, or showing the board at all | Needs `projectItems`, which is GraphQL-only and so needs a token — the thing reading from the browser exists to avoid. Sorted by last touched instead |
| Collecting on demand from the UI | `pnpm exec nx collect @monorepo/tech-docs` shells out to `nx graph` and `eslint` and takes tens of seconds. A button means a run state to poll and a way to cancel — the terminal already has both |
| Serving this anywhere | Nothing here is authenticated and every path it prints is a local file. It is a `nuxt dev` tool on purpose; deploying it is a different project |
