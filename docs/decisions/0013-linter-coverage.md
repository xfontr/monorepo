---
issue: 100
status: to-implement
decision: accepted
---

# 🧭 New linters: the robustness gap is tsconfig and enforcement, not plugins

## Context

Issue #100 is titled "Investigate and implement new linters", with a body of one line: "Research on
a11y linting, security linting, etc." The framing assumes the way to harden this code is to add
plugins, and names the two categories to add.

Every candidate below was installed in a throwaway sandbox and run against this workspace — 206
tracked `.ts` files, 23 `.vue`, 75 `.md` — rather than assessed by reputation. The counts are what
each one reports on this code today. Measuring them inverts the issue's premise: the two categories
it names are the weakest candidates in the set, and the checks that would catch a real defect are
either a compiler flag or a check this repo already runs and deliberately does not gate on.

## Result

**The two linters the issue asks for find nothing. The one real defect in the sweep needs no new
plugin at all.**

**1. a11y and security linting report 70 findings between them, of which 5 are real and none are
reachable.** `eslint-plugin-vuejs-accessibility` (`flat/recommended`, all 23 SFCs) reports two, both
false positives on the same construct:

| Plugin | Findings | Composition |
| --- | --- | --- |
| `eslint-plugin-vuejs-accessibility` | 2 | both `aria-props` on `aria-current-value` — false positives |
| `eslint-plugin-security` | 68 | `detect-non-literal-fs-filename` 32, `detect-object-injection` 31, `detect-unsafe-regex` 3, `detect-non-literal-regexp` 2 |

`aria-current-value` in [`articles/index.vue`](../../apps/huella-legal/app/pages/articles/index.vue)
is not an ARIA attribute — it is `RouterLink`'s `ariaCurrentValue` prop, which `vue-router` renders
as `aria-current` only when the link is exact-active. The rule pattern-matches `aria-*` and cannot
see a component's props. The code is correct, already carries a comment saying why, and the
neighbouring `<span v-else>` shows the author had already reasoned about the case a template linter
cannot check anyway. The plugin's cost here is two `eslint-disable` lines against zero findings.

For `security`, 63 of 68 come from its two rules with a documented false-positive problem, and its
useful three (`detect-unsafe-regex`) are a strict subset of what `eslint-plugin-regexp` reports.

**2. The one real defect found in the whole sweep is already covered by a rule this repo owns.**
[`useIssues.ts:17`](../../apps/developer-portal/app/composables/useIssues.ts) spreads an awaitable
`AsyncData` into an object literal, which silently drops the object's `await`ability.
`no-misused-promises` catches it and is in `recommendedTypeChecked` — the preset
[`node.ts`](../../packages/configs/src/eslint/node.ts) already applies. It does not fire because
both apps use `createNuxtConfig`, which is deliberately not type-checked. **The only user-facing
code in the workspace gets the weakest lint, and that is where the only bug was.**

That exclusion is a documented decision, not drift. Worth noting against it: the probe ran
type-aware rules over `apps/tech-docs`'s 29 `.ts` files without incident. The trouble Nuxt's
generated files cause is a `.vue` and generated-file problem, so a `.ts`-only type-aware pass in a
Nuxt app is narrower than the decision that excluded it and is retestable on that basis.

**3. `noUncheckedIndexedAccess` costs five spec-file fixes and nothing else.**
[`base.json`](../../packages/configs/src/tsconfig/base.json) is `strict`, which does not imply any
of these. Measured per project with `tsc -p <project> --<flag>`:

| Flag | Errors | Where |
| --- | --- | --- |
| `noUncheckedIndexedAccess` | 5 | all in `*.spec.ts` — `observability` 3, `scripts` 2 |
| `noPropertyAccessFromIndexSignature` | 7 | `scripts` 5, `translations` 2 — stylistic, not robustness |
| `exactOptionalPropertyTypes` | 4 | all `scripts`, all at the `@clack/prompts` call boundary |

Production source is already clean under all three: the house style never reads an index without
guarding it. That makes the first flag free today and pure forward insurance, and it is the only one
of the three worth the churn — `noPropertyAccessFromIndexSignature` governs `obj.foo` vs
`obj["foo"]`, and `exactOptionalPropertyTypes`' four hits are all benign `undefined`-into-optional
passes at a third-party boundary.

**4. `no-unnecessary-condition` without that flag instructs you to delete correct code.** The rule
is not in `recommendedTypeChecked`; adopting `strictTypeChecked` would add it, and it is that
preset's second-largest contributor here at 34 findings. In
[`scorecards.ts:49`](../../apps/developer-portal/tools/lib/scorecards.ts) it flags `match[1] ?? ""` as an
unnecessary `??`. Regex capture groups genuinely are `undefined` at runtime; the guard is right and
the type is lying. Turning the flag on and re-measuring:

| Project | `no-unnecessary-condition`, flag off → on |
| --- | --- |
| `infrastructure/scripts` | 3 → 0 |
| `packages/i18n` | 5 → 4 |
| `packages/content` | 5 → 5 |

Four of thirteen were the type system misreporting index access, and `scripts` was entirely that.
The remaining nine are genuinely redundant guards. **The two settings are complementary: this rule
is safe to adopt only after the flag, and acting on its output before then removes runtime
protection.**

**5. `strictTypeChecked` as a preset is 127 findings and mostly cosmetic**, which is why the
recommendation is rules and not the preset:

| Rule | Count | Kind |
| --- | --- | --- |
| `restrict-template-expressions` | 34 | cosmetic |
| `no-unnecessary-condition` | 34 | needs finding 3 first |
| `no-confusing-void-expression` | 23 | cosmetic, all in `scripts` |
| `no-unnecessary-type-arguments` | 19 | cosmetic |
| `no-non-null-assertion` | 5 | worth having |
| everything else | 12 | includes the one `no-misused-spread` and one `no-deprecated` |

**6. Three checks already run and none of them can fail.** [`pre-push`](../../.husky/pre-push) gates
the branch name, `TODO`/`FIXME`, lint, test and typecheck; it runs `docs:drift` and `pnpm audit`
with `|| true` and comments both as "a nudge, not a gate". CI adds `build` and `docs:map --check`,
and runs `dependency-review-action` with `warn-only: true`. A fourth measurement is displayed and
never asserted: [`collect/docs.ts`](../../apps/developer-portal/tools/collect/docs.ts) already resolves
every repo-relative markdown link against the filesystem — correctly, including the `:91-94`
citation form and `<placeholder>` templates that a naive checker false-positives on. It reports
**4 broken links across 520**, and they have accumulated because nothing reads the number but a
dashboard tile:

| Broken link | Status |
| --- | --- |
| [`i18n/src/nuxt/README.md:94`](../../packages/i18n/src/nuxt/README.md) → `../config.ts` | live; the file is `./config.ts`, same directory |
| [`nuxt-module-route/SKILL.md:62`](../../.agents/skills/nuxt-module-route/SKILL.md) → `server/request.ts` | live; the file is `server/utils/request.ts` |
| `reviews/2026-09-04-c1025f3.md` → `../decisions/README.md` | frozen history |
| `spikes/0037-feature-discoverability.md` → `src/drift/detect.ts` | frozen history |

The second one is the expensive kind: a skill that points an agent at a file that does not exist.
**The gap is not a link checker — one exists and works. It is that `brokenLinkCount` is a tile and
`docs:map --check` is a CI step, and nothing decided which of the two this should be.**

**7. Two GitHub settings enforce a `CLAUDE.md` rule that nothing enforces today.** Secret scanning
and push protection are both enabled on the repo, so provider tokens cannot be pushed. But
`secret_scanning_non_provider_patterns` is disabled, and the rule in `CLAUDE.md` is about *vendor
endpoints, URLs and instance IDs* — precisely the non-provider half. `dependabot_security_updates`
is also disabled, while [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) carries a hand-maintained
14-entry `overrides` block of CVE pins. Neither is a linter and neither costs a dependency.

**8. Actions hardening is already done.** Every `uses:` is SHA-pinned, `permissions` is `{}` on
`pr-metadata`, `contents: read` on [`ci.yml`](../../.github/workflows/ci.yml) and `contents: write`
on release, and both workflows install with `--ignore-scripts`. `zizmor` audits for exactly these
and would find close to nothing; the interpolations in `release.yml` are `workflow_dispatch` booleans
and not injectable. This is the one category where the answer is that no tool is needed.

## Options considered

| Option | Why not |
| --- | --- |
| `eslint-plugin-security` | 68 findings, 63 from `detect-object-injection` and `detect-non-literal-fs-filename`; its 3 real ones are a subset of `eslint-plugin-regexp`'s, which reports them without the noise |
| `eslint-plugin-vuejs-accessibility` | 2 findings, both false positives on a `RouterLink` prop it cannot see. Costs two disables for zero defects; revisit when `packages/ui` grows past one component |
| `eslint-plugin-no-secrets` | 4 findings, 4 false positives — it flagged `"onlyDependOnLibsWithTags:"` and `"DisallowedGitSubcommandError"` as high-entropy secrets. Entropy scoring on identifiers is the wrong instrument, and push protection already covers the real case |
| `eslint-plugin-unicorn` | 480 findings, and the top three fight decisions this repo already made: `single-line-block-comment-style` (92) contradicts [`0009`](./0009-comment-discipline.md), `filename-case` (43) contradicts the camelCase filenames, `no-null` (49) contradicts `error: null` in the artifact types |
| `eslint-plugin-sonarjs` | 18 findings, 12 of them the same ReDoS sites `eslint-plugin-regexp` reports. A second plugin for one new signal (`no-floating-point-equality`, 2) |
| `strictTypeChecked` wholesale | 127 findings, ~100 cosmetic. Buys `no-misused-spread` and `no-deprecated` at the cost of a 34-finding template-literal sweep and a rule that is unsafe before finding 3 lands |
| `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature` | Measured at 4 and 7; the first's hits are all benign `undefined` passes into a third-party option bag, the second is a property-access style preference wearing a compiler flag |
| A new markdown link checker (`lychee`, `markdown-lint`) | [`collect/docs.ts`](../../apps/developer-portal/tools/collect/docs.ts) already does this, and handles two citation forms a generic checker flags wrongly. The missing piece is a gate, not a tool |
| `zizmor` / `actionlint` | Finding 8 — the posture they check for is already in place. `actionlint` also ships only a WASM playground build on npm, so it would need a Go or brew install in CI to run at all |

## Consequences

Unlocks four changes in descending order of value per unit of churn: `noUncheckedIndexedAccess` in
[`base.json`](../../packages/configs/src/tsconfig/base.json) with five spec fixes; the two GitHub
toggles; a decision on whether `brokenLinkCount` becomes a CI assertion or stays a tile, and the
four links fixed either way; and `eslint-plugin-regexp` for its 14 findings — 6 super-linear
backtracking, 5 unused capturing groups. All six ReDoS sites are in build-time collectors, CLI
scripts, or a test assertion on a fixed short string
([`contentKey.spec.ts:14`](../../packages/content/src/core/contentKey.spec.ts)), so nothing
request-serving is exposed today and that plugin is a guard rather than a fix.

Forecloses nothing permanently, but records that a11y and security plugins were measured rather than
skipped — the reason to revisit `vuejs-accessibility` is `packages/ui` growing beyond one component,
not a stricter reading of the same evidence. `no-unnecessary-condition` stays off the table until
`noUncheckedIndexedAccess` is in, and the order matters: reversing it deletes working guards.

The finding with the longest tail is the second one. The only defect the sweep found sits in an app
excluded from type-aware linting, so it was invisible to a rule the workspace already configures.
Whether a `.ts`-only type-aware pass for the two Nuxt apps is worth its friction is a separate
question from the one this decision answered, and it should be measured on `apps/tech-docs` first —
38 findings there, one of them real — before `apps/huella-legal`, which typechecks only on build.

## Confirmation

`eslint-plugin-regexp` is in and applied — `pnpm exec nx lint @monorepo/configs` failing on a
reintroduced ReDoS pattern is the check. The link-checker decision is settled by #103:
`brokenLinkCount` gates CI through `pnpm exec nx check-docs @monorepo/tech-docs`, which landed under
#106 rather than the `docs:map --check` mechanism this decision anticipated; `#anchor` links stay
unverified, a deliberate exclusion since none of the four breaks found here were anchor breaks. The
remaining two items are not yet built: once `noUncheckedIndexedAccess` lands in `base.json`,
`pnpm exec nx run-many -t typecheck` failing on an unguarded index read is the check for it; and the
two GitHub toggles are confirmed by reading the repo's Settings → Code security page.
