---
issue: 189
status: implemented
decision: accepted
---

# 🧭 Huella Legal's e2e runs in-app in one pinned image, and coverage gates `test`

## Context

The [implementation plan](../plans/huella-legal-implementation.md) gives each page ticket a
Playwright spec against the built app: an axe scan with zero violations and screenshots at 390, 768
and 1280. It gives the app a coverage threshold, too. None of that exists yet. #189 asks five
things before A1 (#192) builds the harness: where Playwright lives, which browsers and OS image the
baselines come from, what the CI job looks like, where the fake WordPress's data lives, and what
the threshold number is. The lean was an in-app `e2e` target.

Two of the five were the wrong shape. As things stand, a threshold number is decorative. The
"fake WP" also has to be a fake translations vendor.

## Result

**The lean holds, and three things the issue took as given do not.**

| Question | Answer |
| --- | --- |
| Where Playwright lives | An `e2e` script in `apps/huella-legal/package.json`, driven by `playwright.config.ts` at the app root with specs in `apps/huella-legal/e2e/*.spec.ts`. There's no new project, tag or Nx plugin |
| Browsers and baselines | Chromium only, as three Playwright projects at widths 390, 768 and 1280, which replaces the plan's screenshot helper. Baselines are written only in `mcr.microsoft.com/playwright:v1.63.0-noble`, and `@playwright/test` is pinned to exactly `1.63.0`. The image ships its browsers, so **nothing runs `playwright install`**. Playwright's docs say a version mismatch between image and package leaves it "unable to locate browser executables", so the two move together |
| CI job | A second job, `e2e`, in `ci.yml`. It runs in that image, `needs: checks`, and runs `nx affected -t e2e` with `NX_CLOUD_ACCESS_TOKEN`, so the build `checks` just cached is restored rather than redone |
| Fake upstream data | `e2e/upstream.ts` is one `node:http` server with no dependency. It generates synthetic posts and terms from `const` builders at the top of the file, serves them on the WordPress provider's paths, and answers translations too. No fixture files; the one directory exception is the PNG baselines |
| Coverage threshold | Lines and statements 90, functions 85, branches 80. `app/lab/**` and `app/pages/**` are excluded from the denominator. It only bites because the app's `test` script gains `--coverage` |

What the issue took as given:

- **A threshold is never evaluated today.** CI and pre-push run `test`, and a threshold only runs
  under `--coverage`. Measured on this app: with `--coverage.thresholds.lines=99`, plain
  `vitest run` exits 0, and adding `--coverage` fails at 38.96%.
- **In a Vitest projects config, coverage is root-only.** The docs say so, and developer-portal
  shows it: its nuxt project carries the preset's `coverage` block, yet no `coverage-summary.json`
  is written. A threshold copied onto a project is silently ignored.
- **Every page needs a translations upstream, not only content.** `translations.vendor` is
  `tolgee`, and an unset vendor is a `500` on first request. The fake answers
  `/v2/projects/<project>/translations/<locale>` as well as `/wp-json/wp/v2/*`.

The numbers are from developer-portal, the other Nuxt app on the same two-project config: 94.49%
lines, 93.72% statements, 89.41% functions and 82.28% branches. The packages sit at 92–100%. Today's
38.96% for huella-legal is 30 of 77 lines. `app/lab/**` makes up 36 of the 47 uncovered ones, and it
is dev-only, stripped from every production build by `nuxt.config.ts`'s `pages:extend` hook. Pages
are left out because Playwright covers them, and v8 sees none of that.

Each row is one change. Line numbers are as of this report.

| # | Where | The change |
| --- | --- | --- |
| 1 | `nx.json:8` `namedInputs.production` | Add `!{projectRoot}/e2e/**/*` and `!{projectRoot}/playwright.config.ts`, so a baseline or fake-data edit never invalidates `build` |
| 2 | `nx.json:97`, before `collect` | Add a target default `e2e` with `dependsOn: ["build"]`, inputs `default` + `^production`, outputs `{projectRoot}/.playwright` and `cache: true` |
| 3 | `apps/huella-legal/vitest.config.ts:3` | Replace it with developer-portal's two-project config. Put `coverage` at the **root** `test`: the preset's block, plus `app/lab/**` and `app/pages/**` in `exclude`, plus the four thresholds |
| 4 | `apps/huella-legal/package.json:13` `test` | Change it to `vitest . --watch=false --coverage`. Add `e2e: playwright test`, plus `@playwright/test` `1.63.0` (exact) and `@axe-core/playwright` in `devDependencies` alongside A1's `@nuxt/test-utils`, `@vue/test-utils` and `happy-dom`. The `nx` block gains `targets.e2e.inputs`: `default`, `^production` and the locale JSON row 6 serves. The app doesn't depend on `@monorepo/translations`, so without that input a copy change would replay a cached green run |
| 5 | `apps/huella-legal/playwright.config.ts` (new) | `testDir: "e2e"` and `outputDir: ".playwright"`. Three Chromium projects by width. `snapshotPathTemplate` is `{testDir}/__screenshots__/{testFileName}/{projectName}/{arg}{ext}`, with no `{platform}` because only one platform writes baselines. `ignoreSnapshots: !process.env.CI`. Two `webServer` entries: `node e2e/upstream.ts`, and `node .output/server/index.mjs` with `PORT` and the `NUXT_CONTENT_VENDOR_*`/`NUXT_TRANSLATIONS_VENDOR_*` vars pointed at the upstream on `localhost`. `NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN` gets a dummy value, because `TolgeeProvider` rejects an empty token |
| 6 | `apps/huella-legal/e2e/upstream.ts` (new) | The fake. `posts`, `pages`, `categories` and `tags` return `x-wp-total`/`x-wp-totalpages` and the `_embed` shape `WordpressProvider.ts` asks for. Its hosts are its own `localhost` origin. The translations route serves the committed locale JSON |
| 7 | `apps/huella-legal/tsconfig.e2e.json` (new), `tsconfig.json:8` | Extend `@monorepo/configs/tsconfig/node.json` over `e2e/**/*.ts` and `playwright.config.ts`, and add it to `references`, as developer-portal's `tsconfig.tools.json` does. Without it, nothing typechecks these files |
| 8 | `.github/workflows/ci.yml:46`, before `dependency-review` | Add the `e2e` job: `container.image` set to the image above with `options: --user 1001`, then the same checkout, pnpm, node and `--ignore-scripts` install as `checks`, then `nx-set-shas`, `nx affected -t e2e`, and an SHA-pinned `actions/upload-artifact` of `apps/huella-legal/.playwright` and `apps/huella-legal/e2e/__screenshots__` on failure. The image installs `git`, so `actions/checkout` does a real clone and `affected` has history |
| 9 | `.github/dependabot.yml:39`, before `dependencies` | Add a `playwright` group matching `@playwright/test`, so the bump arrives as its own PR |
| 10 | `.gitignore:20` | Add `.playwright` |
| 11 | `apps/huella-legal/README.md:20`, `:149` | Add a Commands row for `pnpm e2e`, and rewrite Testing for the new split: two Vitest projects, coverage on `test`, e2e against the fake |
| 12 | `.agents/skills/writing-tests/SKILL.md:19`, `:93` | Name `e2e/` and `__screenshots__/` as the exceptions to "beside its subject" and "no fixtures directory". Drop the now-false line saying `app/` has no vue preset |

## Options considered

| Option | Why not |
| --- | --- |
| A separate `apps/huella-legal-e2e` project | It needs a new `type:` tag in `boundaries.ts` and the root README table, plus a workspace-layout entry, all to hold one config and a folder of specs that only ever test this app |
| `@nx/playwright` inferred targets | It adds a root plugin pinned to the `nx` group. Its gain is atomized `e2e-ci--*` targets for distribution, which [`0026`](./0026-nx-cloud-remote-cache.md) doesn't use. Every other target here is a `package.json` script |
| `runs-on: ubuntu-24.04` plus `playwright install --with-deps chromium` | The browser version would always match, but GitHub's runner image updates weekly under the baselines. It also installs browsers on every run, which the image does once |
| Chromium, Firefox and WebKit | Triples baselines and runtime. Linux WebKit is not Safari, so it would not stand in for the iOS readers it seems to cover |
| Baselines written on developers' machines | Linux baselines can't come from a Mac. The image's arm64 variant can render differently from CI's amd64. Under amd64 emulation, the host's darwin `node_modules` won't run |
| Fake data as committed JSON recordings | `writing-tests` bans fixture directories. S1's recordings carry the live hostname in every `link`, `guid` and `source_url`, so the plan already forbids committing them |
| A per-glob threshold on view models now | `shared/**` and `app/utils/**` hold nothing yet; A3 creates the mappers and adds that glob at 95 with them |

## Consequences

Every page ticket from B onward gets an e2e spec, with axe and three baselines, at a known cost:
one job after `checks`, and a restored build. Pre-push does not run e2e, so a green push is not yet
a green e2e.

Baselines prove the app didn't change. They don't prove it matches the lab. `--font-serif` is
Georgia, a Microsoft font Ubuntu doesn't ship, so Linux screenshots use a substitute serif.
Montserrat is self-hosted, because the built `.output/public/_fonts` bundles it. The lab is stripped
from production builds, so e2e cannot screenshot it either. The plan's "parity with its lab page"
acceptance stays a human check on the reviewed machine. Revisit this if the serif is ever
self-hosted.

The image ref names a registry host. It is an identifier of the same kind as `NODE_IMAGE` in
[`infrastructure/translations/docker/Dockerfile`](../../infrastructure/translations/docker/Dockerfile),
and it carries no credential. It is still not one of the two exceptions `AGENTS.md` lists. If that
rule is read to cover it, the fallback is the `ubuntu-24.04` row in Options considered, at the
drift cost that row names.

**Order.** Rows 3–4 go first. Two-project config narrows Vitest's `include` to `app`, `server`,
`shared` and `tools`. Until it lands, `vitest .` collects `e2e/*.spec.ts` and crashes importing
`@playwright/test`. Row 1 goes before rows 5–6, so adding those files never busts the build cache.
Rows 8–9 go last, once `pnpm exec nx test:e2e @monorepo/huella-legal` passes locally with snapshots
ignored. A1 does not wait for A2. A2 changes the translations route in `upstream.ts` if it switches
vendor, and that is its only e2e cost.

**Tripwires an implementer will hit.**

- The threshold fails the moment row 4 lands. With lab and pages excluded, the app sits at 30 of
  41 lines (73%), and the gap is exactly `app/plugins/observability.client.ts` and
  `devWarnings.client.ts`. A1's smoke specs have to cover both.
- `.vue` files don't appear in coverage at all under the node preset. They join the denominator
  only once the nuxt project exists. Expect the number to move when row 3 lands, not only as specs
  are added.
- The first run of a new spec has no baseline, and CI fails on it. Under the default
  `updateSnapshots: "missing"`, Playwright writes the new PNG to its snapshot path, not to
  `outputDir`, which is why row 8 uploads both directories. To accept a baseline, commit the
  artifact's PNG under `e2e/__screenshots__/`. For a changed one, commit its `-actual.png` from
  `.playwright` in place of the old baseline.
- A `@playwright/test` bump fails e2e until `ci.yml`'s image tag moves in the same PR. Row 9 keeps
  that bump out of the batched `dependencies` PR.
- Without `NX_CLOUD_ACCESS_TOKEN` on the `nx affected` step, e2e rebuilds the app, and the build
  typechecks, so it is slow.
- Adding the `e2e` script adds a row to `docs/FEATURES.md`. Run `pnpm docs:map`, or CI's
  `--check` fails. The row shows `—` until row 11 documents the command.
- `.claude/hooks/check-invariants.sh` blocks `https?://` literals outside `localhost`, which is one
  more reason the fake's hosts are its own origin.
- Every action in `ci.yml` is pinned by SHA with a version comment. `actions/upload-artifact` is
  the first new one, and it follows suit.

## Confirmation

| Claim | Check |
| --- | --- |
| The threshold gates `test` | Set `lines: 99` locally, and `pnpm exec nx test @monorepo/huella-legal --skip-nx-cache` fails naming the threshold |
| Coverage config is at the root | `grep -n "thresholds" apps/huella-legal/vitest.config.ts` shows one hit, outside `projects` |
| Lab and pages are out of the denominator | After a `test` run, `grep -c "app/lab/\|app/pages/" apps/huella-legal/coverage/coverage-final.json` prints `0` |
| E2E files don't feed the build | Touch `apps/huella-legal/e2e/upstream.ts`, then `pnpm exec nx build @monorepo/huella-legal` reads from cache |
| No browser install anywhere | `git grep -n "playwright install" -- .github apps` returns nothing |
| Image and package agree | The tag in `grep -n "playwright:v" .github/workflows/ci.yml` equals `@playwright/test` in `apps/huella-legal/package.json` |
| No fixture files | `git ls-files apps/huella-legal/e2e \| grep -v "\.ts$\|__screenshots__/.*\.png$"` returns nothing |
| E2E files typecheck | A type error in `e2e/upstream.ts` fails `pnpm exec nx typecheck @monorepo/huella-legal` |
| CI reuses the build | The `e2e` job's log shows `@monorepo/huella-legal:build` as `[remote cache]` |
| Docs agree | `pnpm docs:map --check` passes, and the FEATURES row for `pnpm e2e` has a doc link |
