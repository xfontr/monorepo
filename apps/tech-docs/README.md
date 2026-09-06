# 🩺 @monorepo/tech-docs

The repo's own dashboard. It renders every markdown file in the workspace as a wiki — READMEs,
`CLAUDE.md`s, the [`docs/`](../../docs/README.md) tree, the reviews, the changelogs — beside the
things that are not written down anywhere: coverage, the project graph, the open GitHub issues,
which two files have stopped agreeing.

It runs locally only — `pnpm tech-docs` — and is never built or deployed. It reads the working tree
and shells out to `git` and `gh`.

## 🗂 Structure

| Path | What lives there |
| --- | --- |
| `app/` | The Nuxt UI dashboard — pages and components |
| `server/api/` | The two reads the pages make: the collected snapshot, and `gh issue list` |
| `shared/` | Pure logic — the wiki's shape, the issue rules. Imported by app, server and tools alike |
| `tools/collect/` | Builds the derived snapshot: graph, coverage, metrics, docs, scorecards |
| `tools/lib/` | Node-only helpers — paths, the `git` allowlist, the invariant checks |

## 📄 The markdown is read in place

[`content.config.ts`](./content.config.ts) points `@nuxt/content` at the **workspace root**, not at a
copy inside this app. That is what makes the docs half free: the README you edit for GitHub is the
same file this renders, so the two cannot drift, and a page's URL mirrors its path in the repo.

| Page | Reads |
| --- | --- |
| Wiki | Every tracked `*.md`, arranged as a tree — see [🧭 The wiki](#-the-wiki) |
| Reviews | `docs/reviews/YYYY-MM-DD-<sha>.md` — the files the `repo-review` skill writes |
| Changelog | Every `CHANGELOG.md`, beside its unreleased-commit count |

`@nuxt/content` lower-cases every route, so `packages/ui/README.md` is served at
`/packages/ui/readme` while the collector keys the same file as `packages/ui/README.md`. Anything
joining the two — a broken-link warning, an "updated 3 days ago" — goes through
[`toCollectionPath`](./shared/wiki.ts) first. A hand-written `/docs/…/README` link matches nothing
and fails silently, which is exactly how it went unnoticed the first time.

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
| Docs | `docs/`, grouped by subdirectory: concepts, guides, spikes, the review rubric |
| Projects | One group per project, holding its README, its `CLAUDE.md`, its nested READMEs and its own skills |
| Agent setup | The root `.claude/` skills and subagents |

Two things are deliberately **not** in the tree: `CHANGELOG.md`s and the dated reviews. Both already
have a page of their own here, and a wiki that also lists them is a second route to the same file
that ages differently. A project's `.claude/skills/` stays with that project rather than with the
root agent setup, because that is the only place those skills apply.

Labels are the one thing not taken verbatim: under a group already called `packages/ui`, a README
titled `📦 @monorepo/ui` says the name three times and the subject none, so it reads `Overview`. The
real title is still the page's own heading.

A spike carries one more thing the tree alone can't show: a coloured dot next to it in the nav, and
a pill on its own page, for the `Status:` line [`docs/spikes/README.md`](../../docs/spikes/README.md)
defines — good for `Implemented`, warn for `To implement`, neutral for `Won't implement`. That value
comes from the collected snapshot, not from the path, so `shared/wiki.ts` stays derived from nothing
but what `@nuxt/content` found; [`useSpikeStatuses`](./app/composables/useSpikeStatuses.ts) is the
one place the two get joined, by path.

## 🐙 Issues come from GitHub, not from here

The Issues page runs `gh issue list --json` on the server and renders what comes back. There is no
local copy, no `log/`, no schema: an issue's state lives on GitHub, and a second record of it in
this repo would be a second answer to a question that already has one. This replaced a local todo
list that was exactly that mistake.

| Decision | Why |
| --- | --- |
| `gh` on the server, never `fetch` in the browser | The CLI already holds a token. A page that asked for its own would be a credential this repo has to store somewhere |
| One-minute memo in [`server/utils/issues.ts`](./server/utils/issues.ts) | `gh` takes about a second and every page showing an issue would otherwise pay it per navigation. The page's refresh button skips the window outright |
| A failure is rendered, not thrown | No token, no network and no `gh` are facts about the machine. The page shows the CLI's own first line, which explains itself better than anything written here |
| Label names without their colours | GitHub's label palette is arbitrary and this app's is [three validated status roles](#-colour). Rendering one beside the other is how a page stops meaning anything |

## 💾 One store, and it is disposable

`.report/` holds the collected snapshot — coverage, metrics, docs, the graph, the scorecards — is
gitignored, and is rebuilt by `pnpm tech-docs:collect` in seconds. A snapshot that gets committed is
a report that goes stale silently. Nothing else here is stored at all: the docs, the reviews and the
changelogs are files in the tree read where they live, and the issues are read live off GitHub. If
you delete every derived file in this project, one command puts it back.

## 🚀 Development

| Command | What it does |
| --- | --- |
| `pnpm tech-docs` | Start Technical Docs |
| `pnpm tech-docs:collect` | Rebuild the snapshot — graph, coverage, metrics, docs, scorecards |

The collector reads each project's `coverage/coverage-summary.json` and copies in the merged report
`pnpm test:coverage` renders at the workspace root, so both are only as fresh as the last run of it.
There is deliberately **no `build` script**: the `@nx/nuxt` plugin names its inferred target
`nuxt:build`, so `nx affected -t build` skips this project and CI never tries to build a tool that
has nowhere to deploy.

## 🔍 What it checks that nothing else does

`tools/lib/invariants.ts` re-runs the cross-file rules
[`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) enforces on edit: the tag table
written twice, the workspace-layout block, a review with no row in the history table. The hook only
fires while an agent is editing a file; these run over the whole tree on every collect, so drift
introduced by hand shows up on the dashboard instead of waiting for the next edit to trip over it.
The two copies are kept honest by [`invariants.spec.ts`](./tools/lib/invariants.spec.ts) — which is
the entire reason they exist as pure functions rather than more shell.

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
| Writing to GitHub from here — closing an issue, moving a card | Every write is a `gh` subcommand away, but a dashboard that writes needs an undo story, an optimistic-update story and a permission story. Reading is the whole value; `pnpm issue:add` and `pnpm issue:pick` already cover filing and starting |
| Closed issues, or issues from another repo | `gh issue list --state open` on the repo you are standing in. Both are one flag; neither has a question this page is asked yet |
| Ordering "What's next" by board column | `gh` reports a column's *name*, not its position, and the names are per project — nothing here can know which of them means next. Sorted by last touched instead |
| Collecting on demand from the UI | `pnpm tech-docs:collect` shells out to `nx graph` and `eslint` and takes tens of seconds. A button means a run state to poll and a way to cancel — the terminal already has both |
| Serving this anywhere | Nothing here is authenticated and every path it prints is a local file. It is a `nuxt dev` tool on purpose; deploying it is a different project |
