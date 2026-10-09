# 🗺 Huella Legal implementation plan

This plan takes the approved `/lab` design and turns it into the production site. It lists the
decisions that come first, then the work tickets. Each ticket is one section, kit or page, never a
single button. The GitHub tickets are filed from this file.

The design passed gates A, B and C on 29 Sep 2026. It lives in
[`app/pages/lab/`](../../apps/huella-legal/app/pages/lab/), built from Nuxt UI 4 and Tailwind v4,
with tokens in [`main.css`](../../apps/huella-legal/app/assets/css/main.css), defaults in
[`app.config.ts`](../../apps/huella-legal/app/app.config.ts), and prototypes and fixtures in
[`app/lab/`](../../apps/huella-legal/app/lab/). None of it is wired: the copy is hard-coded Spanish,
the forms use `@submit.prevent`, and the data is fixtures.

## 🎫 Ticket status

Every S, A, B, C, E and F item below is exactly one ticket. Once a ticket is filed, its item gets
`🎫 #<number>` right after the ID, in both the table and the item's heading or bullet. An item with
no marker hasn't been filed. Closed tickets keep their marker. Update this file in the same change
that files or merges an item.

## 📌 Facts that shape the plan

| Fact | Consequence |
| --- | --- |
| WordPress is read-only to us: no new plugins, ACF fields, REST fields or webhooks. Installed ones, Yoast among them, are exposed | Whatever WP doesn't return is derived from post HTML or terms, or dropped |
| [`useContent()`](../../packages/content/src/nuxt/runtime/server/utils/useContent.ts) is server-only and its vendor config is private, so every read goes through a layer's Nitro route ([0031](../decisions/0031-content-server-accessor.md)) | "No BFF" means rewriting the data layer to call WP from the browser, or a full static generate with no server for forms and search |
| `Entry` has no authors, and nothing for issue, series, reading time, TOC, footnotes, bibliography or views | The content model has to be decided before cards, articles or listings (S1) |
| The app runs SSR on Netlify's git integration with no preset, no `routeRules` and no Nitro storage | `defineCachedEventHandler` caches live in memory per function instance, so the content TTLs barely hold (S2) |
| i18n is `defaultLocale: en-GB` with the default `prefix_except_default` strategy | Spanish pages would sit under `/es-ES/`. The site launches Spanish-only (A2) |
| Tests are Vitest only. No Playwright, axe, visual regression or coverage threshold exists, and huella-legal has only the node preset | The harness comes first. [developer-portal's config](../../apps/developer-portal/vitest.config.ts) is the model to copy |
| The live site is a WordPress theme served on the domain | Once Nuxt serves the domain, WP (API and admin) needs another hostname, which a WP admin has to change. Every indexed permalink must resolve or 301 (S4) |

## 🧱 Layers

Per [ADR 0023](../decisions/0023-huella-legal-owns-its-design-system.md), the design system lives in
the app, not a package. Anything typed against a domain's view models lives in that domain's layer
under `layers/`, as `layers/articles` does.

| Layer | Lives in | Does | Never does | Tested with |
| --- | --- | --- | --- | --- |
| Theme | `main.css`, `app.config.ts` | Tokens, Nuxt UI defaults | — | Visual snapshots |
| Primitives | `app/components/base/` | Wordmark, Kicker, TagPill… Plain props only. Nuxt UI is used directly; `UButton` gets no wrapper | Fetch, know about WP, take a view model | `mount` |
| Kits | `layers/<domain>/app/components/` when typed against that domain's view models or owned by one feature, else `app/components/{listing,form,shell}/` | Props in, events out | Fetch, read the route | `mount` |
| View models | `shared/` or `app/utils/`, pure TS | `Entry` → `ArticleSummary`, `Article`, `Author`, `Category`: reading time, TOC, footnotes, citation | Touch Vue or Nuxt | Vitest node, the heaviest suite |
| Controllers | `app/composables/use*.ts` | `useFetch` their layer's routes, own query↔URL state, run form state machines | Render | Nuxt Vitest project + `mockNuxtImport` |
| Pages | `app/pages/` | Call one controller, compose kits, set SEO meta | Hold logic | Playwright + axe + screenshots |
| Server | `server/api/`, `server/utils/` | Newsletter and submission endpoints, the WP HTML pipeline if it runs server-side | Render | Vitest node, like [`[slug].get.spec.ts`](../../apps/huella-legal/layers/articles/server/api/articles/%5Bslug%5D.get.spec.ts) |

Components are promoted from `app/lab/` rather than rebuilt. A kit ticket covers a lot of
components, but each one is cheap because the lab version already exists.

## 🧪 Testing

| Level | Covers | Tool |
| --- | --- | --- |
| Unit | Mappers, the HTML pipeline, server routes and utils. Every WP quirk found in S1 is pinned as an inline sample beside its spec | Vitest node |
| Component | Each kit component's variants, emits and ARIA state (`aria-current`, `aria-busy`, error wiring) | Vitest Nuxt project, `mount` |
| Controller | URL↔state round-trips, error mapping (400 → 404), form state transitions | Vitest Nuxt project, `mockNuxtImport` |
| E2E | One spec per page archetype against the built app, each with an axe scan (zero violations) and screenshots at 390, 768 and 1280 | Playwright + `@axe-core/playwright` |
| Coverage | App threshold, number set in S5 | Vitest v8 |

E2E points `NUXT_CONTENT_VENDOR_BASE_URL` at a local fake WP. That WP serves **synthetic** JSON with
the shape of the S1 recordings, a placeholder host and invented people. Real responses can't be
committed, because the live hostname appears in every `link`, `guid` and `source_url`. Nothing
comes from `app/lab/fixtures.ts` either: its bios are placeholders sitting on real names.

**Every UI ticket is accepted on:**
- parity with its lab page at 390, 768 and 1280
- specs green
- axe clean
- no hex values outside `main.css`

## 🧭 Spikes

Each spike ends in a report in [`docs/decisions/`](../decisions/), written with the
`decision-report` skill. The lean is the expected answer, which the spike confirms or overturns.

| # | Spike | Blocks | Lean |
| --- | --- | --- | --- |
| **S1** 🎫 #185 | WP content probe and content model. On the critical path | A3, A4, B2, B6, all of C | Probe first, then decide |
| **S2** 🎫 #186 | Rendering, hosting and cost | E1, E2, F1 | Keep Nitro; hybrid `routeRules` |
| **S3** 🎫 #187 | Forms and integrations | E1, E2 | Server routes + third-party providers |
| **S4** 🎫 #188 | URLs, SEO and cutover | C (route names), E3, F2 | Spanish slugs, 301 map |
| **S5** 🎫 #189 | E2E and visual tooling | A1 | In-app `e2e` target |

### S1 🎫 #185: WP content probe and content model

1. **Probe the live REST API.** Record samples locally, sanitise them before anything is committed,
   and keep endpoints out of the repo. Check:
   - the `/wp-json` namespaces, to see which plugins exist
   - whether `wp/v2/users` is public
   - what `posts?_embed` returns for author, media and terms
2. **Source every design field**, or mark it dropped:

   | Field | Candidate source |
   | --- | --- |
   | Authors, multiple | The embedded author; a co-authors plugin if one is already exposed; otherwise a single author |
   | Author bio, avatar, count | `users` + `x-wp-total` |
   | Issue "Nº 04/24" | Derived from the date? |
   | Series "Fundamentos · 2 de 5" | A tag or category convention? |
   | Reading time | Word count of the body |
   | TOC | h2/h3 in the body |
   | Footnotes | Core `wp-block-footnotes` markup? |
   | Bibliography | A heading convention in the body? |
   | Citation | Generated |
   | `hl-law`, `hl-note`, `hl-num` | Do real posts use these classes at all? |
   | "Más leídas" sort | Probably dropped: there are no view counts without a plugin |

3. **Decide where each gap is filled.** Either as vendor-agnostic additions to `@monorepo/content`
   (such as `authors` on `Entry` or an `authors` resource), following that package's conventions,
   or as app-local pure mappers for anything Huella-specific. The lean is app-local mappers.
4. **Decide HTML sanitising:** server-side or at render, and which library. The library is a
   dependency check-in.

### S2 🎫 #186: Rendering, hosting and cost

The choice is between three options:
- Nitro on Netlify, SSR or hybrid with `routeRules` SWR/ISR
- Nitro on Cloudflare Workers
- a full static build, with third-party services for forms and search

Answer each question from the vendors' current pages, not from memory:

- **Cost at expected traffic:** function invocations, bandwidth and build minutes.
- **Where the content cache persists:** an unstorage driver, or CDN caching through `routeRules`.
- **Revalidation.** Read-only WP means no webhooks, so it has to be time-based SWR with TTLs set per
  route.
- **Upload size.** The function request-body limit, checked against the publish form's `.docx`
  upload. This can rule out handling the file in a function.
- **Preview deploys** for PRs.
- **Translations in production:** Tolgee, a hosted `internal` service, or messages baked in at
  build time. See A2.
- **Search in static mode.** WP's CORS headers already allow any origin, so search can run from
  the browser, bypassing the BFF's cache.

The lean is to stay on Netlify with Nitro and hybrid `routeRules`. The content package, the forms
and search all need a server, and read-only WP rules out WP-side form plugins.

### S3 🎫 #187: Forms and integrations

| Question | Options to weigh |
| --- | --- |
| Newsletter provider | Whatever the live site uses today, so its list is kept |
| Where publish submissions go | A transactional email with an attachment, or storage plus a link |
| Spam protection | Honeypot, Turnstile or similar |
| GDPR | Consent copy and retention |
| Contacto | A footer link with no design: mailto, a WP page or a form |
| Validation library | `UForm` takes Standard Schema, so zod or valibot would plug in; the alternative is a hand-rolled `validate` function. This is a dependency check-in |

The old board assumed a contact form. The form the design actually has is Publicar.

### S4 🎫 #188: URLs, SEO and cutover

- Inventory the live permalinks from the WP sitemap.
- Settle the new route scheme, e.g. `/publicaciones/[slug]`, `/materias/[slug]`,
  `/colaboradores/[slug]`, `/publicar`, `/buscar`.
- Build the 301 map.
- Plan the WP hostname move. It needs an owner or admin action, so name who does it.
- Canonical tags, sitemap, robots, JSON-LD (`ScholarlyArticle`) and RSS.
- Analytics and the cookie banner, to match the cookies policy.
- Where the interest calculator lives once WP stops rendering the site.

### S5 🎫 #189: E2E and visual tooling

| Question | Why it matters |
| --- | --- |
| Where Playwright lives | The lean is an in-app `e2e` target. A new `apps/huella-legal-e2e` project would mean updating `boundaries.ts`, the root README tag table and the workspace layout together |
| Browsers and baselines | Visual baselines are only stable from one OS image |
| CI job | `ci.yml` has no job with a built app and browsers. The job has to run `playwright install --with-deps` itself, because CI installs with `--ignore-scripts` and lifecycle scripts are banned |
| Fake-WP data | `writing-tests` forbids fixture directories, so either the fake server generates its data or the spike names the exception |
| Coverage threshold | The number for the app |

## 🎫 Work tickets

### A: Foundation

A1 comes first. A2 can run alongside it.

- **A1 🎫 #192 Test harness** (after S5):
  - Copy developer-portal's two-project Vitest config (node + `defineVitestProject` with
    happy-dom) and add `@nuxt/test-utils`.
  - Add Playwright + `@axe-core/playwright`, the fake-WP server, a screenshot helper for the three
    widths, and the CI job.
  - Add one smoke spec per layer to prove the wiring.
- **A2 🎫 #193 Spanish-only locale and copy plumbing:**
  - `es-ES` only, `strategy: no_prefix`, `lang="es"`. `en-GB` goes, and keys follow a naming
    convention.
  - Pick the vendor explicitly. `nuxt.config.ts` points at Tolgee, but
    `infrastructure/translations/projects/huella-legal/*.json` feeds the `internal` vendor. Keys
    written there never reach the app unless the app switches vendor.
  - From this ticket on, UI tickets use keys, not hard-coded copy.
- **A3 🎫 #194 Content model and view-model mappers** (after S1):
  - The `@monorepo/content` additions S1 decides on.
  - Pure mappers: `Entry` → `ArticleSummary`/`Article`, `Term` → `Category`, user → `Author`. They
    compute reading time, the citation string, and issue and series.
- **A4 🎫 #195 WP HTML pipeline** (after S1):
  - Sanitise, add heading ids, extract the TOC, footnotes and bibliography.
  - Map the `hl-*` classes, wrap tables for the scroll shadows, set image loading attributes.
  - Output: HTML that is safe to `v-html`, plus the structured end-matter.

### B: Component kit

Promoted from `app/lab/`. B1, B3 and B4 don't depend on any spike.

- **B1 🎫 #196 Editorial primitives:** Wordmark, Kicker, MediaFallback, SectionHeading, TagPill
  (count and active states), plus Byline, which takes `Author` and so lives in the articles layer.
  Author initials and their stack are `UAvatar` and `UAvatarGroup`, themed in `app.config.ts`. The
  D designs dropped the issue number and the stats, so neither gets a primitive.
- **B2 🎫 #197 ArticleCard family:** all five variants (lead+split, standard, compact, media,
  row), typed against `ArticleSummary`, plus grid and list wrappers.
- **B3 🎫 #198 Shell and error surface:**
  - SiteHeader: journal strip, nav with `aria-current`, `USlideover` mobile menu.
  - SiteFooter, and the default layout with its container and skip link.
  - `error.vue`, using the 404 and 500 designs.
- **B4 🎫 #199 Form kit**, presentation only:
  - Field patterns, FormErrorSummary with anchor links, SuccessPanel, AlertPanel.
  - NewsletterForm in its band, slate and sidebar variants.
  - Lives in `app/components/form/`, apart from validation and submission.
- **B5 🎫 #200 Listing kit:** URL-driven pagination (mobile prev / "n / N" / next, `UPagination`
  from `sm` up), SortSelect, scrolling FilterPills, EmptyState, NoResults, a skeleton list.
- **B6 🎫 #201 Article reading kit:**
  - `.hl-prose` gets a production copy in the articles layer. The lab keeps its own.
  - TOC rail and accordion, lit by Nuxt UI's `useScrollspy`.
  - Notes with back-links, Bibliography, CiteBox with copy, ShareBar, AuthorCard, all in the
    articles layer. D replaced SeriesNav with "También en la materia", so it gets no component.
  - Two inputs have no producer yet: `ArticleBody` carries no notes, and no mapper builds the
    citation strings. C1 supplies both. AuthorCard's count waits for the authors route in C4.

### C: Pages

Each page ticket delivers a controller, the page, and its e2e spec with axe and screenshots.

- **C1 🎫 #240 Article page** (needs A3, A4, B2, B6): `useArticle`, related posts, series navigation, SEO
  meta.
  - `useArticle` reads `GET /api/articles/:slug`, which already serves the sanitised, cached
    `Article`; the page in `layers/articles` is a scaffold to replace.
  - The server builds `Citation[]`, and the pipeline parses `_ftn` anchors into
    `ArticleBody.notes`. That is the one supported note shape: 0027's bare `<sup>` posts turned out
    to hold ordinals and a stray number, not notes.
  - Dates go through i18n `d(…, "long")`, which carries the `Europe/Madrid` time zone.
- **C2 🎫 #241 Listing template:**
  - One controller, `useArticleListing`, owns page, sort and tag filter in the URL, and maps a 400
    to a 404.
  - Four instances: all publications, category, tag, and author profile. The author profile gets
    its own route instead of the lab's `?autor`.
  - Needs a `GET /api/articles` list route returning `ArticleSummary[]`, which doesn't exist yet.
    Reading time needs full bodies, about 550 KB upstream per 10 posts (ADR 0027).
  - The publications scaffold still `v-html`s raw WordPress titles and excerpts until it reads that
    route.
  - The controller feeds `ListingPagination`'s `to` builder. Scrolling to the top on a page change
    belongs in `app/router.options.ts`, not a `watch`.
  - The fetch-error to `createError` mapping, written today in both article pages and the article
    route, becomes one helper shared with C1.
- **C3 🎫 #246 Home:**
  - Hero statement, and the featured article with the Fundamentos aside.
  - Recent posts, the Materias band, editorial stats.
  - Participa cards, NewsletterBand.
- **C4 🎫 #247 Materias index and Colaboradores:**
  - Area grid, TFG/TFM band, tag cloud.
  - About, principles, and the directory with filter, no-match state and load-more. How much of
    the directory is possible depends on S1.
- **C5 🎫 #248 Search and utility states:** `/buscar` on a route over `useContent`'s `search`, with results, no results,
  empty subject and loading.
- **C6 🎫 #249 Standard page template:**
  - Legal pages (aviso legal, privacidad, cookies), and Contacto per S3, from WP `pages`, using the
    prose styles.
  - There is no lab design for this page, so it's checked for parity against the article prose.

### E: Business features

These come after S2 and S3.

- **E1 🎫 #242 Newsletter:**
  - A server route with a provider adapter.
  - A `useNewsletter` state machine behind every NewsletterForm, so NewsletterBand and
    NewsletterCard stop forwarding `pending`, `error` and `submit`.
  - Spam protection, and specs against a mocked provider.
- **E2 🎫 #243 Publish submission:**
  - A server route: multipart, with file type and size checks, sending to S3's destination.
  - `UForm` validation, and the lab's four states wired live.
  - E2E for the invalid, success and server-error paths.
- **E3 🎫 #250 SEO and metadata:** per-page `useSeoMeta`, canonical tags, sitemap and robots (a module for
  these is a dependency check-in), JSON-LD, RSS.

### F: Launch

- **F1 🎫 #244 Deploy configuration** (after S2):
  - Nitro preset, `routeRules` with per-route TTLs, cache storage.
  - Env var names in `.env.example`, preview deploys.
  - Update the app README's Deployment section.
- **F2 🎫 #251 Cutover** (after S4 and F1):
  - The redirect map as `routeRules` redirects, with a test that walks every old permalink.
  - The WP hostname move and DNS.
  - Post-launch smoke checks, through the existing observability.
- **F3 🎫 #252 Remove the scaffolding:**
  - Delete `app/lab/`, `app/pages/lab/`, the `$production` `pages:extend` hook, and the provisional
    `pages/articles/*` with their scoped CSS.
  - Rewrite DESIGN.md's deferred section.

## 🔀 Order

```
S5 ─► A1 ─────────────────────────────────────────┐ (every ticket below adds specs)
A2 ──────────────────────────────────────────────┤
B1, B3, B4 (no data dependency) ─────────────────┤
S1 ─► A3 + A4 ─► B2, B5, B6 ─► C1, C2 ─► C3, C4, C5, C6
S2 ─► S3 ─► E1, E2 (need B4)
S4 ─► E3, F1 ─► F2 ─► F3
```

S1, S2, S4 and S5 don't depend on each other, so they go first and in parallel. S1 gates the most
work.

## ✅ Done means

| When | Check |
| --- | --- |
| Each spike | A decision report lands. It confirms or overturns the lean with evidence from the S1 recordings or the S2 vendor pages |
| Each ticket | `pnpm exec nx test @monorepo/huella-legal`, lint, typecheck and `nx build` pass (the app typechecks on build). The e2e target passes against the fake WP |
| Before F3 | Every production route, side by side with its `/lab` counterpart at the three widths: the last check against gate C |
| After F2 | Every old permalink from the S4 inventory returns 200 or 301 on the production host |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Deleting `packages/ui` | Tracked under ADR 0023 (#26), not here |
| Interest calculator | An app page at `/calculo-intereses/` ([0028](../decisions/0028-huella-legal-urls-and-cutover.md)). 🎫 #245 builds it, and it has to land before F2 |
| Comments | Need a moderation decision first |
| Search overlay | Has no design; the header search button goes to `/buscar` |
| Dark theme | `colorMode` stays off; the tokens would need a second `:root` set |
| Real imagery | The `§` tile stands in until licensed images exist |
