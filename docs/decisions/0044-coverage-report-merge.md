# 🧭 One coverage report, merged from the per-project runs

Spike: #44

## Context

Every project's `test:coverage` writes its own `coverage/` directory — seven of them today — so
reading coverage for the workspace means opening seven `index.html` files by hand. Nx caches and
restores those directories (`test:coverage` declares `{projectRoot}/coverage` as its output in
[`nx.json`](../../nx.json)) but has no aggregation step of its own: there is no `nx coverage` and
no first-party merge, and the cost of the manual read grows with every project added.

What the workspace does already have is the input a merge needs. The shared preset in
[`vitest/node.ts`](../../packages/configs/src/vitest/node.ts) emits `json` and `lcov` from every
project, so seven `coverage-final.json` files are sitting on disk with nothing consuming them.

## Decision

Per-project runs stay as they are, and a merge step is added to
[`@monorepo/scripts`](../../infrastructure/scripts/README.md), built on Istanbul's libraries
directly. Five points make up the call:

1. **Nx is the source of truth for what to merge.** `nx show projects --with-target test:coverage`
   names the projects; `nx show project <name>` gives each one's `root` and its target's declared
   `outputs`. So the script hardcodes neither a glob nor the string `coverage/` — an eighth project
   is picked up for free, and moving the output directory in `nx.json` carries the script with it.
2. **It refuses to render a partial report.** If Nx names seven projects and six have a
   `coverage-final.json`, the script errors naming the seventh rather than rendering a report that
   is quietly missing a project. This is the same argument the `include` comment in
   [`vitest/node.ts`](../../packages/configs/src/vitest/node.ts) already makes at file level: an
   absent file has to count as absent, not vanish. It is also what makes running the merge after an
   `affected` run fail loudly instead of lying.
3. **It runs over `run-many`, never `affected`.** A merged report built from affected projects is
   the same lie from the other direction — the projects that didn't run are simply absent. The
   affected `test:coverage` stays as it is for the fast loop.
4. **It merges only; the run is chained in the root script.** `nx run-many -t test:coverage &&
   node …` keeps `run-many` visible and tweakable in `package.json` instead of buried in a `spawn`,
   and it leaves the script a pure function of the files on disk — which is what makes its
   discovery and validation testable at all.
5. **No thresholds and no single workspace percentage.** One number mixing
   [`apps/huella-legal`](../../apps/huella-legal/README.md) with
   [`packages/ui`](../../packages/ui/README.md) isn't actionable; per-project thresholds belong in
   each project's vitest config, where they can differ. The browsable merged HTML is the whole
   deliverable.

Two facts checked during the spike carry the design. Keys in `coverage-final.json` are **absolute
paths**, so nothing collides across projects and the merged HTML tree comes out rooted at the
workspace with a folder per project — the desired grouping, for free. That also makes the inverse a
real hazard, so the script asserts it: were a project ever to emit relative paths, two `src/index.ts`
entries would silently merge into one wrong file.

## Options considered

| Option | Why not |
| --- | --- |
| A root Vitest `projects` config | Produces one native report with no merge logic at all, but tests then bypass Nx entirely — no per-project cache, no `affected`, no `dependsOn`. `pnpm test` running affected-only is a stated invariant of this repo |
| Hosted — Codecov, Coveralls, SonarCloud | Merges the `lcov` uploads server-side and adds per-PR diff coverage, but it's a vendor plus a token, and it does nothing for the local loop this spike is about. CI runs no coverage today, so it's a different job — and an orthogonal one, still open |
| `nyc merge` + `nyc report` | The standard answer, and literally the same Istanbul code — but reached through a full CLI whose transitive tree is far larger than the three libraries it would be pulled in to call |
| `vitest --merge-reports` (blob reporter) | Built for sharding a single config across machines; here Nx spawns a process per project against two different presets (node and vue), which is not the shape it expects |
| Concatenating the `lcov.info` files | Zero npm dependencies to merge, but rendering HTML from lcov needs `genhtml` from system perl — trading an install `pnpm i` handles for one it can't |
| `monocart-coverage-reports` | Nicer HTML rendered off raw v8 output, but it's novelty against reports that are already in Istanbul's format |

## Consequences

Unlocks a single `pnpm coverage` producing one browsable report, and it stays correct as projects
are added because Nx, not a glob, decides what goes into it.

The cost is dependencies: `infrastructure/scripts` goes from one runtime dependency to four
(`istanbul-lib-coverage` for the merge, `istanbul-lib-report` and `istanbul-reports` for the HTML).
That deserves the scrutiny CLAUDE.md asks for, and the answer is narrow — the merge itself is about
five lines, and the three libraries buy the HTML renderer. Writing that renderer is the actual
"build your own tooling" trap this spike set out to avoid.

Forecloses nothing. A hosted service remains available and complementary, because every project
already emits `lcov` whether or not anything uploads it. Revisit if CI starts gating coverage or
wanting per-PR diff coverage — that is the hosted-service conversation, and it replaces none of the
above — or if the per-project vitest presets ever converge enough that a root `projects` config
could keep `affected` intact.

Implementation is a follow-up issue rather than part of this record; none has been filed yet.
