---
issue: 343
status: implemented
decision: accepted
---

# 🧭 Huella Legal keeps `UNavigationMenu` and hydrates it from `lg` only

## Context

The header has to serve three jobs: reading, finding the next good read, and persuading legal
professionals to publish. It rendered four flat links through `UNavigationMenu`, and
[`/sobre/`](../../apps/huella-legal/layers/archive/app/pages/sobre.vue) was reachable only from the
footer, so a would-be author couldn't easily find out what the journal is. huellalegal.com has the
same gap: its "Sobre" item links to `/colaboradores/`.

The app README listed *A lighter header* under Deliberately deferred. `UNavigationMenu` statically
imports `UPopover` and `UTooltip`, so every page loaded floating-ui for a row of plain links. Three
ways out were on the table:

| Option | What it means |
| --- | --- |
| A | Drop `UNavigationMenu` and render the links yourself |
| B | Keep it and use more of it |
| C | B, with the header's menu loaded lazily |

## Result

**C: the menu stays `UNavigationMenu`, gains dropdowns, and hydrates only where `lg` matches.** The
floating-ui import has nothing to do with dropdowns. In `@nuxt/ui` 4.12's `NavigationMenu.vue`:

- `UPopover` and `UTooltip` render only in `collapsed` vertical mode or for an item with `tooltip`.
- Horizontal dropdowns are Reka's `NavigationMenuTrigger`, `NavigationMenuContent` and
  `NavigationMenuViewport`, which CSS positions.
- Content stays unmounted until it opens.

Measured on a production build with the e2e fakes. Sizes are brotli; the last two rows are every JS
chunk a page requests on load:

| | Before | After |
| --- | --- | --- |
| Layout chunk | 19.7 kB (92.6 kB minified) | 6.8 kB (19.7 kB minified) |
| floating-ui + `UNavigationMenu`, static imports of the layout | 12.8 kB + most of the layout chunk | Async: 9.8 kB + 14.0 kB |
| JS on load, `/` | 232.1 kB | 211.6 kB |
| JS on load, an article | 286.6 kB | 279.3 kB |

An article saves less because the article page loads floating-ui for its own popovers.

What the header is now:

| Where | What it does |
| --- | --- |
| `apps/huella-legal/app/composables/useSiteNav.ts`, `HEADER` | *Publicaciones* and *Áreas* carry a panel `slot`. *Revista* links to `/sobre/` and groups *Sobre Huella Legal*, *Colaboradores*, *Newsletter* and *Contacto*, each with a description. Publicar stays a link. A child whose link has a hash never counts as current, since `/#newsletter` would otherwise mark the home page |
| `layers/archive/app/components/nav/PublicationsPanel.vue` | Browse links (all, by format, search), then the lead and two latest from `/api/home` |
| `layers/archive/app/components/nav/SubjectsPanel.vue` | The eight largest areas, then *Todas las áreas* |
| `apps/huella-legal/app/components/shell/SiteHeader.vue` | `LazyUNavigationMenu hydrate-on-media-query` inline, a `LazyUNavigationMenu` in the slideover, and the panels as `LazyNav*` in the slots. *Revista* opens as an accordion in the slideover |

The panels read `useCachedFetch<Home>("/api/home")` when they mount, so the first open fetches it
unless `/` or the search palette already has.

## Options considered

| Option | Why not |
| --- | --- |
| A — plain `ULink` row | C takes the same bytes off the initial load. What A gives up is the dropdowns, and without them `/sobre/`, the areas and featured reads don't fit at `lg` beside search and *Suscribirse*. Hand-rolling dropdowns would mean owning Reka's roving focus, Esc and focus return, hover intent and `aria-controls` wiring. The axe scan has already broken once on `aria-controls` IDs ([`keepServerPrefetch.ts`](../../apps/huella-legal/modules/keepServerPrefetch.ts)) |
| B — dropdowns, eager | The dropdowns add nothing to the bytes, but the menu and floating-ui stay on every page's load |
| A kit component on Reka's `NavigationMenu*` primitives | A's byte profile with C's dropdowns, but it means owning a component and theme that Nuxt UI already ships. It is the way out if the desktop chunk after `load` turns out to matter |
| C with `hydrate-on-interaction` | The first `pointerenter` starts hydration and Vue replays it before the chunk lands, so a pointer that rests on a trigger never opens it until it leaves and comes back. Reka opens on pointer moves |
| Adding `reka-ui` as a direct dependency, for `NavigationMenuLink` in the panels | It would close a dropdown when a panel link is chosen. A `v-model` on the menu that the header resets on every route change does the same with no new dependency |

## Consequences

**Behaviours an edit can break:**

- **Changing the inline menu's props hydrates it.** Vue hydrates a lazy component, and fetches its
  chunk, as soon as its props change before hydration. On desktop that is what moves the active
  underline after a client-side navigation. Below `lg` the menu is hidden, so `SiteHeader.vue` hands
  it the server-rendered items until `(min-width: 64rem)` matches. Without that hold, a phone loads
  the desktop menu on its first navigation. The same applies to anything else passed to the inline
  menu that changes per route.
- **The triggers stay links before hydration.** A horizontal trigger is `NavigationMenuTrigger
  as-child` around the item's link, so *Publicaciones*, *Áreas* and *Revista* work as plain `<a>`
  until window `load`, when [`deferHydration.ts`](../../apps/huella-legal/server/plugins/deferHydration.ts)
  starts hydration. *Revista* has a `to` for this reason. In the slideover it is a `trigger`
  instead, because a link there would leave only the chevron to open the accordion.
- **The viewport needs `shrink-0`.** It is a flex item of a wrapper as wide as the nav, so without
  `shrink-0` in `layers/design/app/theme/navigationMenu.ts` a panel wider than the nav is clipped.

**What C costs:** on desktop, every first visit fetches about 24 kB brotli after `load`, once
hydration starts. A pointer that comes to rest on a trigger in the half second before the chunk
lands still needs a move to open it.

**When to revisit:** if that desktop chunk proves costly, switch to the Reka-primitives option. Plain A
is the answer only if the dropdowns go.

## Confirmation

| Claim | Check |
| --- | --- |
| No menu or floating-ui code is a static import of the layout | `pnpm exec nx build @monorepo/huella-legal`, then confirm that the chunk in `.output/public/_nuxt` containing `ShellSiteHeader` imports no chunk containing `NavigationMenuRoot` or `middlewareData` |
| A phone never loads the desktop menu | `SiteHeader.spec.ts`: *holds the inline menu below lg* |
| The active marker follows a client-side navigation | `e2e/shell.spec.ts`: *the header follows a client-side navigation before anyone has touched it* |
| `/sobre/` is one step from every header | `e2e/shell.spec.ts`: *the about page is one step from the header*, on all three viewports |
| The newsletter anchor never marks a page current | `useSiteNav.spec.ts`: *never takes the newsletter's anchor for the page being read* |
| A resting pointer opens a dropdown on its first entry | `e2e/shell.spec.ts`: `openDropdown` hovers once, after hydration, and never re-enters |
| An open dropdown stays accessible | `e2e/shell.spec.ts`: *an open header dropdown has no WCAG AA violations* |
