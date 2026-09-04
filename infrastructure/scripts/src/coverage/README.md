# 📊 `pnpm test:coverage`

Merges every project's `coverage-final.json` into one browsable HTML report rooted at the workspace
`coverage/` directory, so reading coverage stops meaning opening seven `index.html` files by hand.
See [`0044-coverage-report-merge.md`](../../../../docs/spikes/0044-coverage-report-merge.md) for why
this is a script on top of Istanbul's own libraries rather than the `nyc` CLI or a hosted service.

| Command | What it does |
| --- | --- |
| `pnpm test:coverage` (root) | `nx run-many -t test:coverage`, then merge and render `coverage/index.html` |

## 🗂 Structure

```
discover.ts   nx's project + output shape → the coverage-final.json path per project — pure
merge.ts      loaded reports → one CoverageMap, refusing a partial merge — pure
nx.ts         asks nx which projects declare test:coverage, and where each writes its output
index.ts      entry point: reads the files discover.ts names, merges, renders the HTML
```

## ✅ What it refuses to do

Render a partial report. `nx.ts` asks Nx, not a glob, for the project list — `nx show projects
--with-target test:coverage` — so an eighth project is picked up automatically. If any of those
projects has no `coverage-final.json` on disk, `merge.ts`'s `assertComplete` throws naming it
instead of rendering a report that's quietly missing a project. That's also why the root script
runs `run-many`, never `affected`: a merge built from affected-only projects is the same silent gap
from the other direction.

Keys in `coverage-final.json` are absolute paths, which is what lets the merged report group its
tree by project with no configuration. `merge.ts` asserts that too — a project that ever emitted
relative paths would fold two identically-named files from different projects into one wrong entry.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A single workspace-wide coverage percentage or thresholds | Not built — mixing `apps/huella-legal` with `packages/ui` into one number isn't actionable. Per-project thresholds belong in each project's `vitest.config.ts` |
| CI gating on coverage, or per-PR diff coverage | That's the hosted-service conversation (Codecov, Coveralls, SonarCloud) the spike names, and it replaces none of the above — every project already emits `lcov` whether or not anything uploads it |
