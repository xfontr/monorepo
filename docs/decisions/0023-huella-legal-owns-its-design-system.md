---
issue: 26
status: to-implement
decision: accepted
---

# 🧭 Huella Legal owns its design system

## Context

`@monorepo/ui` was planned as a thin wrapper around a component library, probably Nuxt UI, while
Huella Legal was becoming a law blog with a visual system unlikely to appear in another app. #26
asks whether the package should stay headless or own a shared visual layer before the layout, page
and form work in #28–#35 starts.

The choice is not between two useful package shapes. A headless Nuxt UI wrapper would still couple
consumers to Nuxt UI's component API while hiding it behind one-line re-exports, and a styled
package would make one app's brand look shared. The repository currently proves neither kind of
reuse: `packages/ui/lib/components/Button.vue` is a placeholder, Huella Legal imports the package
without using it, and developer-portal consumes Nuxt UI directly.

## Result

**Huella Legal owns every current visual decision inside `apps/huella-legal`; `@monorepo/ui` is
retired rather than filled speculatively.** Huella Legal consumes Nuxt UI directly for accessible
component behaviour and configures its own tokens, component defaults and product components.
Nuxt UI is a styled, themeable system built on Reka UI rather than a headless library, and its
[theme surface](https://ui.nuxt.com/) already belongs at the app boundary: CSS variables and
Tailwind theme values in CSS, component defaults in `app.config.ts`, and local overrides at the
component.

This does not ban shared visual code. It makes extraction evidence-led: a new shared UI package is
created only after two apps need the same component with the same public API and the same visual
contract. Sharing a colour value, a button-shaped element or a common upstream dependency is not
enough. Until then, reuse across Huella Legal pages is app reuse, under `apps/huella-legal/app/`.

Line numbers are as of this report.

| Where | Current state | Change |
| --- | --- | --- |
| `packages/ui/**` | One placeholder button plus Storybook and package scaffolding | Remove the project; do not replace it with a wrapper around Nuxt UI or Reka UI |
| `apps/huella-legal/package.json:20-32` | Declares `@monorepo/ui` but imports none of it | Remove `@monorepo/ui` and add `@nuxt/ui` as the app's direct dependency |
| `apps/huella-legal/nuxt.config.ts:4` | Registers no UI module or global stylesheet | Register `@nuxt/ui` and `~/assets/css/main.css`; keep Huella configuration in this app |
| `apps/huella-legal/app/assets/css/main.css` (new) | No global visual foundation exists | Import Tailwind CSS and Nuxt UI, then define the Figma-derived colour, type, spacing, radius and motion tokens |
| `apps/huella-legal/app/app.config.ts` (new) | No semantic component theme exists | Map Huella tokens to Nuxt UI semantic colours and defaults; override component slots only where the design calls for it |
| `apps/huella-legal/app/components/` (new) | Pages own all markup and visual repetition | Add Huella semantic components such as the site header, footer, page container and article card only as a page first needs them |
| `apps/huella-legal/app/layouts/default.vue:19-20` | The layout is only a slot | Compose the app-local header, navigation, main container and footer required by #28 |
| `apps/huella-legal/app/pages/articles/index.vue:172-288` and `app/pages/articles/[slug].vue:82-183` | Two pages carry a provisional, duplicated visual system in scoped CSS | Replace the provisional values with app tokens and app-local components while implementing #31 and #32; do not move them into a package |
| `apps/huella-legal/app/components/form/` (new) | #34 has no owner for reusable fields | Keep field composition and presentation app-local; keep validation schemas and submission outside presentational field components |
| `README.md:20-25,54-60`, `.github/CODEOWNERS`, `.github/labeler.yml` | Workspace metadata still describes a shared UI project | Remove the project from the layout and ownership surfaces; the `type:ui` boundary may remain reserved with no current project |
| `.github/workflows/developer-portal-deploy.yml:51-53`, `apps/developer-portal/nuxt.config.ts:37`, `apps/developer-portal/app/pages/projects.vue:21-22` | The portal builds, ignores and links the placeholder Storybook | Remove the Storybook deployment path and update the affected portal documentation and specs |
| `pnpm-lock.yaml`, `docs/FEATURES.md` | Both derive entries from the current project | Run `pnpm install` and `pnpm docs:map`; never hand-edit either derived file |

Nuxt UI earns the direct app dependency by supplying the accessible interaction and form behaviour
that would otherwise be rebuilt locally, while leaving the product theme configurable in the app.
The hand-rolled alternative is native HTML plus Huella-owned Vue components and CSS; it avoids the
dependency but makes the app responsible for focus management, keyboard interaction, overlays and
form state. The direct dependency is the smaller ownership surface. Its build-time `unstyled` mode
is not the starting point because it also removes structural layout and transition classes; use
normal theming first and opt individual components out only when the design requires it.

## Options considered

| Option | Why not |
| --- | --- |
| Keep `@monorepo/ui` headless and re-export Nuxt UI | It creates a second API surface without decoupling consumers from Nuxt UI, and there is no shared consumer contract to design it against |
| Put Huella tokens and styled components in `@monorepo/ui` | It gives product-specific code a workspace-wide name and lets future apps depend accidentally on Huella's brand |
| Keep the empty package as a future extraction target | The placeholder already costs releases, tests, Storybook deployment and documentation; Git makes recreating a package cheaper than maintaining a promise with no consumer |
| Build every Huella primitive from native HTML and CSS | It preserves visual ownership but also makes the app own accessibility and interaction behaviour that Nuxt UI already supplies |
| Split Huella's design system into a new `@monorepo/huella-ui` package | There is one consumer, so a package adds release and boundary machinery without reuse; app-local components already provide an internal design system |

## Consequences

The frontend plan is a sequence of vertical slices, not a component catalog built before its pages:

| Order | Issue | Outcome |
| --- | --- | --- |
| 1 | #26 | Remove the speculative shared package and its Storybook/developer-portal plumbing so new work has one unambiguous owner |
| 2 | #27 | Finish the Figma handoff with tokens, responsive states, navigation states, form states and content edge cases; implementation must not guess these |
| 3 | #28 | Add the Nuxt UI dependency and app theme, then implement the header, navigation, container and footer as the first slice through the system |
| 4 | #29 | Build the standard page first; its headings, body copy, links and narrow/wide spacing test the foundation with the fewest feature dependencies |
| 5 | #30, #31, #32 and #33 | Build the landing, article, blog and contact shell against the same app-local tokens and components; extract repetition only when the second use appears |
| 6 | #34 | Build app-local form composition from the real contact fields and states, keeping validation and submission independent of visual field wrappers |
| 7 | #35 | Connect the contact form, including pending, success, field-error and submission-error states |

This unlocks #28 and #34 without pretending Huella's reuse is repository reuse. It also means a
future app may choose another UI library without inheriting Huella's dependency or CSS. Revisit the
package boundary only when two apps contain a materially identical component; compare the two real
implementations before choosing whether to extract behaviour, tokens, or the whole component.

**Tripwires an implementer will hit.**

- The open issues still say `apps/external`; the project was renamed to `apps/huella-legal`, and no
  new `external` directory should be created.
- `app/layers/` is reserved here for feature code with domain logic. Shell components, visual
  tokens and form presentation belong in `app/components/`, `app/assets/` and `app/app.config.ts`,
  not in a design-system layer.
- The current Vitest configuration is the node preset and does not mount Vue components. Any new
  component spec must first wire the Vue preset and then follow the `writing-tests` skill.
- Adding a schema-validation library during #34 is a separate dependency decision. Nuxt UI accepts
  several schema libraries, but a transitive lockfile entry is not permission to import one; state
  what it buys over a small local validator before adding a direct dependency.
- Deleting `packages/ui` changes a documented public surface. The removal must use
  `doc-drift-check`, and every README edit uses `house-docs`; `docs/FEATURES.md` is regenerated.
- Do not layer the final system over the article pages' provisional hex values and spacing. Replace
  those scoped rules as their routes are redesigned, or two visual systems will remain live.

## Confirmation

| Claim | Check |
| --- | --- |
| The speculative shared project is gone | `pnpm exec nx show projects | rg '^@monorepo/ui$'` returns no match |
| Huella owns its UI dependency and theme | `rg -n '@nuxt/ui|main.css' apps/huella-legal/package.json apps/huella-legal/nuxt.config.ts apps/huella-legal/app` finds the module, stylesheet and app config only under the app |
| No app reaches through the retired package | `rg -n '@monorepo/ui' apps packages --glob '!**/coverage/**'` returns no match |
| Storybook plumbing for the placeholder is gone | `rg -n '[/}]storybook' .github/workflows/developer-portal-deploy.yml apps/developer-portal/nuxt.config.ts apps/developer-portal/app/pages/projects.vue` returns no match; Huella's own sits at `huella-legal-storybook` and stays |
| Generated and written docs agree with the workspace | `pnpm docs:map --check` and the `doc-drift-check` pass report no drift |
| The affected projects remain healthy | `pnpm exec nx run-many -t lint test typecheck --projects=@monorepo/huella-legal,@monorepo/developer-portal` passes, followed by `pnpm exec nx build @monorepo/huella-legal` |

