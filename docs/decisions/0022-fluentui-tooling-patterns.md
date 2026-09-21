---
issue: 111
status: to-implement
decision: accepted
---

# 🧭 Fluent UI's DX tooling becomes an experiment ladder

## Context

#111 asks which patterns from Fluent UI's `scripts/`, documentation and Verdaccio setup are worth
adopting here. The first pass investigated only the two directories named in the issue and optimized
for the smallest permanent maintenance surface. That was the wrong decision driver: some
overengineering is welcome when it creates a useful playground, provided the experiment still tests
a real property of this repository.

This report therefore covers all 23 directories under Fluent UI's
[`scripts/`](https://github.com/microsoft/fluentui/tree/a51547435d0a5c4a0fb15c2996c3d3efea5b49dd/scripts),
its
[`tools/workspace-plugin`](https://github.com/microsoft/fluentui/tree/a51547435d0a5c4a0fb15c2996c3d3efea5b49dd/tools/workspace-plugin),
the workflows that exercise them, its docs and Verdaccio at commit `a515474`. The issue has no
comments or blockers. Line numbers are as of this report.

## Result

**Three experiments are adopted: package-contract checks, a UI bundle-size fixture, and lockfile
change warnings.** They start as explicit local commands or advisory hooks, not CI gates. Each
produces evidence before the next layer is added, which keeps the shiny-object budget attached to a
real question rather than to infrastructure for its own sake.

### The full `scripts/` inventory

Fluent UI's `scripts/` is not one architecture. It is a mix of active shared configuration, release
machinery, test harnesses and compatibility code for three generations of Fluent UI:

| Directory | What it does | Read for this repository |
| --- | --- | --- |
| `api-extractor` | Shared API Extractor configurations for generated declarations and API reports | Interesting once packages publish compiled declarations; wrong for today's raw-source exports |
| `babel` | Babel presets and registration, mostly for legacy React Northstar | Framework and generation specific; no transfer |
| `beachball` | Release groups, change files, custom release notes and bump policy | Nx Release already owns this lifecycle here; the custom-renderer idea is the interesting part, not Beachball |
| `cypress` | Shared component-test configuration with dual ESM/CommonJS output and a browser `mount` API | The pattern is good; Cypress and React are not. Revisit if Vue component tests need real-browser coverage |
| `executors` | Interactive target picker, workspace reset, release-sync checks, local CodePen and one-off release tools | The target picker already has a smaller counterpart in `pnpm dev`; the dry-run-first workspace reset is a useful standalone toy |
| `generators` | Package scaffolding, manifests, version files, notice copying and the external design-token pipeline | Token generation from a separate design source is the standout idea; there is no token source here yet |
| `github` | Typed GitHub pull-request lookup shared by release tooling | Existing scripts shell out to authenticated `gh`, which is a better fit for this repository |
| `jest` | Shared v8 presets, reporters and style mocks | Vitest presets in `@monorepo/configs` already fill this role |
| `lint-staged` | Groups staged files by project, then runs each project's ESLint setup in parallel | Clever at Fluent UI scale; the existing affected lint plus pre-push isolation is enough here |
| `monorepo` | Git root, package metadata, internal dependency traversal, affected projects and workspace aliases | Widely consumed in Fluent UI, but direct Nx calls remain clearer for this repository's independent CLIs |
| `package-manager` | Enforces Yarn, prints onboarding help and warns after checkout/merge when lock or Nx files changed | Port the Git-hook warning only; lifecycle entry points conflict with the local lifecycle-script ban |
| `perf-test-flamegrill` | Renders named component scenarios and markers for CPU-profile comparisons | Fun, but bundle size gives a cheaper first performance signal; keep this behind evidence of runtime regressions |
| `prettier` | Filters supported files and invokes one root Prettier configuration safely without a shell | ESLint already owns formatting here; no separate formatter exists to wrap |
| `projects-test` | Packs workspace packages, installs tarballs into temporary consumers, serves their output and fails on browser errors | Best idea in the directory: test what a consumer receives, not what workspace links hide |
| `puppeteer` | Shared browser launch and navigation helpers for integration and SSR tests | An implementation detail of the browser harness, not a feature to copy alone |
| `storybook` | Story globs, loader rules, TypeScript aliases and build-less registration of workspace Storybook addons | Build-less addons are genuinely neat, but this repository has no custom addon; story-driven smoke tests are the transferable half |
| `tasks` | A large `just-scripts` facade over compilation, lint, tests, Sass, Webpack, API extraction and performance tasks | An older orchestration layer now overlapping Nx; not a model for new code here |
| `test-ssr` | Builds stories to CommonJS and ESM, renders them server-side, opens the result in a real browser and fails on console errors | Strong second-stage experiment for a Nuxt app, once `@monorepo/ui` has enough stories to justify the harness |
| `triage-bot` | Labels and assigns new issues from a JSON keyword map in `actions/github-script` | The current single-owner issue flow has nothing useful to route |
| `ts-node` | Registers TypeScript and path aliases for older scripts | Node's native type stripping already removed this need locally |
| `update-release-notes` | Turns changelog JSON and tags into GitHub Releases, dry-run by default | Worth revisiting only if the Release workflow starts creating GitHub Releases rather than tags and changelogs alone |
| `utils` | Config discovery, JSON read/write, shell execution and merge helpers | A generic helper package would undo the boundary-specific adapter shape chosen in [`0004`](./0004-scripts-architecture.md) |
| `webpack` | v8 aliases, resources and Storybook Webpack composition | Vite owns the equivalent concerns here |

### The cooler workspace-plugin layer

The workspace plugin is where the most reusable ideas live. Its
[`generators.json`](https://github.com/microsoft/fluentui/blob/a51547435d0a5c4a0fb15c2996c3d3efea5b49dd/tools/workspace-plugin/generators.json)
registers more than 20 generators, and the custom Nx plugin infers targets from project files and
metadata:

| Mechanism | What is cool about it | Local fit |
| --- | --- | --- |
| `export-maps-sync` | Declared entry points generate ordered `exports`, `main`, `module` and `typings`; `nx sync:check` catches drift before build | The drift class is real here, but [`0005`](./0005-nx-generators-and-ai-agent-setup.md) already built and reverted a local Nx plugin. Steal the contract, not the delivery mechanism |
| `verify-peer-dependencies` | Checks incompatible ranges, invalid ranges, orphaned metadata and optional peer forwarding, with verbose proof of what it skipped | Directly relevant to `content` and `i18n`, whose Nuxt dependencies are optional peers |
| `verify-packaging` | Reads `npm pack --dry-run` and asserts both required files and forbidden development/config files | Directly useful even with raw source: an export that is absent from the tarball is broken regardless of compilation strategy |
| `attw` target | Runs `@arethetypeswrong/cli` against a packed package | Useful only after the package has a publishable JS/declaration shape; raw `.ts` and `.vue` exports make it a later experiment |
| `projects-test` integration | Replaces workspace dependencies with tarballs in a temporary consumer, then builds and opens it | The strongest end-to-end package contract, but it comes after the cheap pack inspection identifies what is publishable |
| Bundle-size generator + Monosize | Generates one fixture per import scenario, measures affected packages, compares the PR with a base report and posts a sticky summary | A good playground for `@monorepo/ui`; start with the Vite already installed before deciding whether Monosize earns a dependency |
| `test-ssr` inference | Every stories project automatically gets an SSR/browser-console target unless excluded centrally | The automatic target is less interesting than the test: server render, hydrate, fail on browser errors |
| Build/API executors | SWC emits ESM/CommonJS while API Extractor rolls declarations and API reports per export subpath | Opposite to this repository's raw-source package decision; useful reference if that decision changes, not before |
| Scaffolding and migrations | React libraries, components, recipes, CLI commands, release phases, moves and package splits are executable, dry-runnable transformations with integration tests | Excellent examples for learning Nx generators. The local package generator was already prototyped and reverted in 0005, so another attempt should pursue a new contract rather than repeat it |
| Inferred target metadata | Targets carry descriptions, technologies, examples, cache inputs and outputs, powering both Nx help and the interactive picker | The metadata idea is attractive if local inferred targets ever become opaque; nine projects do not need the plugin yet |
| Tooling smoke workflow | CI creates a fake library, adds a component, Cypress and bundle-size config, walks it through preview/stable release, then removes it on Linux and Windows | This is the gold-standard part of generator tooling: test the user journey, not only generator functions |

### The adopted experiments

| # | Where | Experiment |
| --- | --- | --- |
| 1 | `.husky/post-checkout:1`, `.husky/post-merge:1`, `README.md:133` | Port Fluent UI's advisory lockfile warning using `pnpm-lock.yaml`. Ignore file checkouts, never auto-install and never fail the Git operation |
| 2 | `infrastructure/scripts/src/package-contracts/:1`, `infrastructure/scripts/package.json:6`, `package.json:11`, `infrastructure/scripts/README.md:14` | Add `pnpm package:check`: inspect every `packages/*/package.json`, assert each export target exists and is present in `pnpm pack --dry-run`, validate that every `peerDependenciesMeta` key has a peer, and print skipped checks explicitly. It remains dependency-free and read-only |
| 3 | `packages/ui/bundle-size/Button.fixture.ts:1`, `infrastructure/scripts/src/bundle-size/:1`, `infrastructure/scripts/package.json:6`, `package.json:11`, `infrastructure/scripts/README.md:14` | Add a manual `pnpm bundle:size` experiment that bundles a minimal `Button` import with the Vite already installed, reports raw and gzip bytes, and writes only to a temporary directory. Do not add a package `build` target or committed bundle output |

The package-contract command deliberately stops before installing the tarballs. Once its cheap
checks pass, extend it with one temporary Vite consumer that installs the packed packages instead of
workspace links. Only after that consumer needs registry semantics does Verdaccio enter the design.

## Options considered

| Option | Why not |
| --- | --- |
| Port `scripts/` wholesale | Much of it is React-generation or release-generation compatibility code. Copying 23 packages hides the five contracts worth learning from |
| Start by building a local Nx plugin | Decision 0005 already completed that experiment: the generators worked and were reverted. Repeating it teaches nothing unless a new sync or inferred-target problem appears |
| Start with Verdaccio | Fluent UI currently exposes the target and permissive proxy config, but code search finds no workflow or test consuming it. A tarball consumer proves the need for registry behaviour before a long-running service is added |
| Add Monosize immediately | It buys base-report comparison, thresholds and PR summaries. The hand-rolled alternative uses existing Vite and reports bytes locally; begin there, then add Monosize only if historical comparison is the useful part of the experiment |
| Put all three experiments in CI immediately | A playground that blocks every change before its baseline is understood turns exploration into policy by accident |
| Build the SSR-story harness first | The design is excellent, but `@monorepo/ui` has one component and one story. Bundle size and package contracts produce meaningful evidence at that size; the browser matrix does not yet |

## Consequences

The repository gains two new read-only measurements and one advisory. None changes package output,
release behaviour or CI. The bundle experiment is explicitly not a package build step: it creates a
temporary consumer bundle, reports it and removes it, while packages continue exporting raw source.

**Order.** Add the two hooks first because they are independent. Build `package:check` second; its
manifest discovery and pack-output parser become proven primitives for a later temporary consumer.
Build `bundle:size` third using existing Vite, record the first result in its README, and run it
manually across a few changes before deciding whether a baseline file, CI workflow or Monosize is
worth carrying. Add a tarball consumer after the pack checks pass. Add Verdaccio only if that
consumer needs multi-package publication, registry resolution or dist-tags.

**Tripwires an implementer will hit.** Use the `scripts-new-script` skill for both commands and
`writing-tests` for their specs. Do not edit `.husky/_`; it is generated. Do not place a helper at
the top of `.husky/`, because
[`infrastructure/scripts/src/map/adapters/files.ts:52`](../../infrastructure/scripts/src/map/adapters/files.ts#L52)
treats every non-underscore file there as a hook. `pnpm pack --dry-run` output is tool output, so
parse its JSON form rather than terminal prose. A dependency addition remains a check-in under
[`AGENTS.md`](../../AGENTS.md#L91-L103); the first two commands need none. Keep all bundle artifacts
under a `mkdtemp` directory, because `dist/` and a package build target are forbidden here. Re-render
`docs/FEATURES.md` only through `pnpm docs:map` after the commands and hooks exist.

The next playground tier is Fluent UI's SSR idea adapted to Vue: discover `*.stories.ts`, server
render each story, hydrate it in a browser and fail on `console.error`, `pageerror` or markup
mismatch. Revisit it when `packages/ui/lib/components` contains enough stories that discovery tests
something more than one button.

## Confirmation

| Claim | Check |
| --- | --- |
| Both hooks are valid and advisory | `sh -n .husky/post-checkout .husky/post-merge`; a lockfile-changing revision pair prints `pnpm install`, while `sh .husky/post-checkout HEAD HEAD 1` exits 0 silently |
| Export targets exist and ship | `pnpm package:check` exits 0 and prints one checked/skipped line per project under `packages/` |
| Peer metadata cannot orphan | Removing one matching `peerDependencies` entry in a temporary copy makes `pnpm package:check` name that package and key, then exit 1 |
| The bundle experiment is reproducible | Two clean `pnpm bundle:size` runs report the same fixture names and byte counts, allowing only gzip timestamp metadata to differ |
| No package build surface was added | `git diff --name-only master...HEAD` contains no `dist/`, and `pnpm exec nx show project @monorepo/ui` has no `build` target |
| The experiments stay optional | `.github/workflows/ci.yml` contains neither `package:check` nor `bundle:size` until their output has been evaluated separately |
| Every new capability has an owner | `pnpm docs:map` followed by `pnpm docs:map --check` passes, with both commands and both hooks pointing at a README |
