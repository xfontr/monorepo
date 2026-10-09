# 📦 @monorepo/huella-legal

A Nuxt 4 redesign of the Huella Legal law blog, composed from the workspace's shared UI, content,
translations and observability packages.

## 🚀 Development

```sh
pnpm exec nx serve @monorepo/huella-legal   # from anywhere in the workspace
pnpm dev                                    # or from this directory
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build (output in `.output/`) |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | ESLint — the nuxt flavour, deliberately not type-checked |
| `pnpm typecheck` | `nuxt typecheck`. Redundant before a build: `typescript.typeCheck: "build"` makes `pnpm build` do the same pass, which is why the build is slow |
| `pnpm test` | Vitest in two projects, without coverage. `pnpm test:coverage` adds it and enforces the thresholds — see [Testing](#-testing) |
| `pnpm test:e2e` | Playwright against the built `.output/`, with the vendors faked by MSW. Run `pnpm build` first; `nx test:e2e` does it for you |
| `pnpm storybook` | Storybook on port 6007 — see [Storybook](#-storybook) |
| `pnpm build:storybook` | Static Storybook build (output in `storybook-static/`) |
| `pnpm exec nx nuxt-prepare @monorepo/huella-legal` | Regenerates `.nuxt` (`nuxi prepare`) — [`nx.json`](../../nx.json) already runs it before `lint`/`typecheck`/`test`, so this is only for calling it by hand |

One module beyond the shared ones is installed here: `@nuxt/fonts`.

## 🚢 Deployment

The app ships through Netlify's own git integration, with build settings in the Netlify UI and no
build or deploy step in this repo. [`netlify-deployment.yml`](../../.github/workflows/netlify-deployment.yml)
builds and deploys nothing itself: once Netlify's own pipeline publishes a commit, it polls
Netlify's Deploys API for that commit and records a GitHub Deployment against the
`huella-legal` environment, so the live URL shows up on the repo's Deployments page
alongside `developer-portal` instead of only in Netlify's own dashboard.

The root [`netlify.toml`](../../netlify.toml) holds only an `ignore` command, which runs
[`netlify-ignore.sh`](./netlify-ignore.sh). It cancels the build unless the diff touches this app,
`content`, `i18n`, `observability` or the pnpm and Node pins. Docs, specs, stories, e2e and lint
config don't count.

| Build | Diffed from |
| --- | --- |
| Production | Netlify's last build |
| Deploy preview | The PR's merge base with `master` |
| `netlify-deployment.yml` | The push's `before`, and it skips recording when the script says so |

The ignore command runs before dependencies are installed, so it can't ask Nx and the list is kept
by hand. A new runtime `@monorepo/*` import needs a line there. Any `pnpm-lock.yaml` change still
builds, even one that only touches another project.

The site ID and auth token never enter this repo: `NETLIFY_SITE_ID` is a GitHub Actions repo
variable and `NETLIFY_AUTH_TOKEN` a secret, both read at workflow runtime with no default. Netlify
deploys asynchronously after the push that triggers the workflow, so it polls for up to 10 minutes
rather than reading the API once.

## 🔑 Environment

Translations and articles are both fetched over the network, so an unset vendor is not a degraded
page but a `500` naming what is missing, on the first request that needs it.

| Variable | What it is |
| --- | --- |
| `NUXT_TRANSLATIONS_VENDOR_PROJECT` | The Tolgee project ID. Unset in development, where the project is fixed to `huella-legal` |
| `NUXT_TRANSLATIONS_VENDOR_BASE_URL` | The TMS API base URL (absolute, with scheme): the translations server in development, Tolgee in a build |
| `NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN` | The Tolgee API key. Unset in development |
| `NUXT_CONTENT_VENDOR_BASE_URL` | The WordPress site root, **without** `/wp-json` — the provider owns that path. Only `/publicaciones/` and `/:slug/` need it |
| `NUXT_PUBLIC_SITE_URL` | The public origin, with scheme. Article permalinks, the share link and both citations are built on it rather than on the request's host. Unset, `/api/articles/:slug` answers `500` naming it |
| `NUXT_PUBLIC_OBSERVABILITY_URL` | Faro collector URL. Leave unset and browser telemetry stays off |
| `NUXT_PUBLIC_OBSERVABILITY_APP_VERSION` | Stamped on browser *and* server spans. Defaults to `0.0.0`, which nothing can be attributed to — set it at deploy time |
| `NUXT_PUBLIC_OBSERVABILITY_APP_ENVIRONMENT` | Stamped the same way. Defaults to `development` |
| `NUXT_OBSERVABILITY_URL` | Grafana OTLP gateway URL. Leave unset and server telemetry stays off |
| `NUXT_OBSERVABILITY_INSTANCE_ID` | Grafana Cloud instance ID, the user half of the OTLP credentials |
| `NUXT_OBSERVABILITY_TOKEN` | Grafana Cloud access token, the password half |
| `NUXT_PUBLIC_SOCIAL_INSTAGRAM`, `_LINKEDIN`, `_X` | Profile URLs for the footer's icons. Each one left unset drops its icon, and with none set the list is gone |

No URL or credential has a default in `nuxt.config.ts`, and no real URL or key belongs in the repo.
Every variable is read at **startup**, not at build time, so one build artifact runs in any
environment — the [i18n module](../../packages/i18n/src/nuxt/README.md#-usage) has the mechanism and
why nothing here reads `process.env`.

The vendor **names** are the exception, and they are not env vars: `translations.vendor.name` and
`content.vendor.name` select each vendor's config type, so they stay literals in `nuxt.config.ts`.

## 🌍 i18n

The site is Spanish-only. Two blocks in [`nuxt.config.ts`](./nuxt.config.ts) drive it: `i18n`
declares the one locale, and `translations.vendor` picks where the messages come from. The
`@monorepo/i18n/nuxt` module does the rest — installs `@nuxtjs/i18n`, registers a loader, and
mounts a cached `/api/translations/:locale` route so the TMS base URL and token never reach the
browser.

| Setting | Value | Why |
| --- | --- | --- |
| `locales` | `es-ES`, `language: "es"` | `language` is what `<html lang>` gets, so it reads `es`, not the locale code |
| `strategy` | `no_prefix` | Pages live at `/…`. `/es-ES/…` is a 404, not a redirect |
| `detectBrowserLanguage` | `false` | With one locale there is nothing to detect, and detection makes the server set an `i18n_redirected` cookie on pages the CDN caches |

### 🏷 Which vendor

| Mode | Vendor | Messages live in |
| --- | --- | --- |
| `nuxt dev` (the `$development` block) | `internal` | [`infrastructure/translations/projects/huella-legal/es-ES.json`](../../infrastructure/translations/projects/huella-legal/es-ES.json) |
| Any build, previews and production included | `tolgee` | The Tolgee project |

**This split is provisional, for early development.** Copy changes daily while the app is built,
and editing a JSON file in the repo is faster than keeping Tolgee current. Once that phase ends the
app moves to Tolgee everywhere and the `$development` block goes. Until then, Tolgee is **not** kept
in sync: a build shows raw keys for anything added since its last update, and that is expected.

To run it locally, start the translations server with `pnpm docker:up` in
[`infrastructure/translations`](../../infrastructure/translations) and set
`NUXT_TRANSLATIONS_VENDOR_BASE_URL=http://localhost:4000/`. The project is fixed to `huella-legal`,
and `internal` takes no token. The vendor `name` differs per mode rather than per env var because it
selects the vendor's config type.

### 🔤 Copy keys

UI copy is never hard-coded outside [`/lab`](./app/pages/lab). It goes in `es-ES.json` under a key:

| Rule | Example |
| --- | --- |
| The first segment is who owns the copy: `app` for the shell (head, layout, header, footer), a page by name, singular for a detail page, or a component in camelCase | `app.title`, `articles.title`, `article.back`, `articleCard.readingTime` |
| Then the element, then its role, all camelCase and nested as objects, never a dotted literal key | `articles.pagination.next` |
| Name the role, never the wording, so a copy edit never renames a key | `article.back`, not `article.backToArticles` |
| Parameters are named, and plurals use vue-i18n's `\|` form with the count as the second argument | `"{page} de {total}"`, `t("articleCard.minutes", n)` |
| `common` holds only copy whose meaning is the same wherever it appears | `common.loading` |
| Keys are sorted alphabetically at every level | — |

A key used in two places with two meanings is two keys, even while the Spanish happens to match.
Tolgee gets the same keys when it is next brought up to date.

See the [module README](../../packages/i18n/src/nuxt/README.md) for the options and the gotchas.

## 📄 Content

One block in [`nuxt.config.ts`](./nuxt.config.ts) drives it: `content.vendor` picks the CMS, and the
`@monorepo/content/nuxt` module gives server code a cached `useContent(event)`. Nothing reads content
from the browser: the `articles` layer's routes call `useContent`, map each `Entry` into a view model
and serve that, so the CMS base URL and its unsanitised HTML stay on the server. Content is cached
once, inside `useContent`; the routes map on every request, since mapping a post takes a few
milliseconds and a second cache would add its own window of staleness.

The vendor is `wordpress`, pointed at an external WordPress install — the CMS is not in this repo, so
`infrastructure/` has nothing to do with it. Two pages consume it, both in the `articles` layer:

| Page | Reads | Notes |
| --- | --- | --- |
| [`layers/articles/app/pages/articles/index.vue`](./layers/articles/app/pages/articles/index.vue) | `GET /api/articles?page=` | Six `ArticleSummary`s per page. Only `page` is forwarded, and the page does **not** re-validate it — `useContent` already bounds it, and a second copy of those bounds is a second place for them to drift. A `400` is turned into a `404`, because a query-parameter complaint is not something a reader should see. Provisional until C2 (#241) extends the route with filters |
| [`layers/articles/app/pages/articles/[slug].vue`](./layers/articles/app/pages/articles/%5Bslug%5D.vue) | `GET /api/articles/:slug`, through `useArticle` | Served at `/:slug/`, the root permalink WordPress had, so indexed URLs still resolve. The route returns the sanitised `Article` view model with its citations. `GET /api/articles/:slug/related` serves up to three posts from its first category, server-rendered without blocking client navigation; when it fails, that band is hidden and the article is unaffected. No `locale` is passed: the content locale is the vendor's axis and WordPress refuses one outright |

See the [module README](../../packages/content/src/nuxt/README.md) for the options, the cache windows
and the gotchas.

## 🧩 Structure

[`app/`](./app) is the front-end shell and stays thin: a layout, an error page and its dev-only debug
panel, two client plugins (Faro telemetry, and a dev-only console filter for a known Nuxt/Vue
warning), and three pages — an entry page, and the `publish` and `search` placeholders. The app's own server code is one Nitro plugin, for telemetry.

| Piece | What it holds |
| --- | --- |
| [`layouts/default.vue`](./app/layouts/default.vue) | The skip link, `SiteHeader`, the one `<main id="contenido">` and `SiteFooter`, fed by `useSiteNav`. A page never renders its own `<main>` |
| [`composables/useSiteNav.ts`](./app/composables/useSiteNav.ts) | The shell's links: the header sections with their `aria-current`, the footer columns, the configured social profiles and the ISSN. The layout calls it and hands the results to the shell |
| [`components/shell/`](./app/components/shell) | `SiteHeader` (`UHeader` with a slideover menu below `lg`) and `SiteFooter` (`UFooter` + `UFooterColumns`), both props-in. Every link is a [route name](#-links). WordPress pages such as `sobre`, `contacto` and `aviso-legal` are `article` slugs, and the privacy and cookies links are anchors on `aviso-legal`, per [0028](../../docs/decisions/0028-huella-legal-urls-and-cutover.md) |
| [`components/form/`](./app/components/form) | Form pieces no single feature owns, for the newsletter and publish controllers to drive: `FormErrorSummary` (links each error to its field's `id`) and `SuccessPanel`, which takes focus when it mounts because a status region mounted with its text is never announced. A failed submit is a plain `UAlert` with `role="alert"`. A feature's form lives in its layer. Forms are `UForm`, and fields are `UFormField` with Nuxt UI inputs, themed in `app.config.ts` |
| [`types/`](./app/types) | The vocabulary kits share across layers: `LinkAction`, the `{ label, to }` every link and action prop takes, and `Tone`, the `paper` or `slate` surface a component renders on |
| [`error.vue`](./app/error.vue) | The 404 design for a 404 and the server design for anything else, inside the same layout. It wraps itself in `UApp`, since Nuxt renders it in place of `app.vue` |
| [`utils/createPageError.ts`](./app/utils/createPageError.ts) | A failed page fetch as the fatal error `error.vue` renders: the status the route answered with, or `502` when no response came back, with data and stack kept. Every page controller raises through it, and client code reads and writes `status`/`statusText`, since Nuxt deprecates `statusCode`/`statusMessage` |
| [`app.config.ts`](./app/app.config.ts) | The journal's name and ISSN under `journal`, read by the citation mapper on the server too, the `UContainer` gutters every section shares, and `UEmpty` left-aligned for the listing kit's empty states |

`/lab` pages draw their own lab header and footer, so a `$development` hook in `nuxt.config.ts` sets
`layout: false` on them.

Domain logic lives in Nuxt layers under [`layers/`](./layers), one directory per domain. Nuxt
auto-registers `<rootDir>/layers/*` by their presence, so there is no `extends` array to add, and
adding one is the mistake.

| Layer | `shared/` | `app/components/` | `server/` |
| --- | --- | --- | --- |
| [`articles`](./layers/articles) | The view models the server returns: `Article`, `ArticleBody`, `ArticleSummary`, `Author`, `Category`, `Citation`, `Note`, `TocItem`. `Article` carries its absolute `permalink` and `citations` | Grouped by the view model they render, so a folder names its components' prefix. `summary/` is an `ArticleSummary` wherever articles are listed: `SummaryCard` in five variants (lead, optionally split, standard, compact, media, row), and `SummaryGrid` and `SummaryList` to lay them out. `article/` is the article page, one component per section (`ArticleHeader`, `ArticleToc`, `ArticleProse`, `ArticleBackMatter`, `ArticleRelated`) plus the parts only it uses: `ArticleShareBar`, `ArticleNotes`, `ArticleBibliography`, `ArticleCiteBox` and `ArticleAuthorCard`. `ArticleToc` is a rail or an accordion, lit by Nuxt UI's `useScrollspy`. `Byline` (authors, date and reading time) and `MediaFallback` stay at the root because both folders use them. A file inside a folder drops the folder's prefix (`article/Header.vue`): Nuxt collapses a repeated prefix and Storybook doesn't, so `article/ArticleHeader.vue` would register under two different names. `useArticle` in `app/composables/` is the article page's controller: the fetches, the error, the breadcrumb and the SEO meta. `noteAnchor`/`noteReferenceAnchor` in `shared/utils/` are the note ids the body mapper and `ArticleNotes` share. `.hl-prose` in [`app/assets/prose.css`](./layers/articles/app/assets/prose.css) styles the sanitised body | `toArticleSummary` maps an `Entry` into them, format rule included. Decoding and reading time parse with the domain-free helpers in `server/utils/hast.ts`, and stay server-side. `toArticleBody` is the WP HTML pipeline, with `extractNotes` and `annotateHeadings` beside the view models they produce, `toCitations` writes APA 7 and the journal's own style, `GET /api/articles/:slug` serves the `Article`, and `GET /api/articles/:slug/related` its related `ArticleSummary` list |
| [`newsletter`](./layers/newsletter) | `subscriptionSchema`, the Valibot rules a subscription must pass, worded by the caller so the server can reuse them | `NewsletterForm`, the field and button, stacked or inline, in a paper or slate tone. It emits `submit` only once the schema passes, and takes `pending` and a server `error`. It is private to the layer: the layer's `nuxt.config.ts` keeps it out of auto-registration, so only `NewsletterBand` and `NewsletterCard` import it. `NewsletterBand` (a landmark with the privacy note; the home page gives it `id="newsletter"`, which the header's newsletter links target) and `NewsletterCard` (the sidebar, naming an optional `subject`) wrap it and pass `pending`, `error` and `submit` through. The field keeps its own value, so a caller that needs it empty again remounts the form with a new `key` | — until E1 adds the subscribe route |

### 🔗 Links

The router is the only owner of a URL. A page names itself and sets its path in `definePageMeta`,
and components link by that name — `{ name: "article", params: { slug } }` — never by a built
string, so moving a URL is one edit in one page. `experimental.typedPages` generates the route map
from those pages, so a wrong name or a missing param fails typecheck.

| Name | Path | Page |
| --- | --- | --- |
| `index` | `/` | [`app/pages/index.vue`](./app/pages/index.vue) |
| `publications` | `/publicaciones/` | [`layers/articles/app/pages/articles/index.vue`](./layers/articles/app/pages/articles/index.vue) |
| `article` | `/:slug/` | [`layers/articles/app/pages/articles/[slug].vue`](./layers/articles/app/pages/articles/%5Bslug%5D.vue) |
| `publish` | `/publicar/` | [`app/pages/publicar.vue`](./app/pages/publicar.vue) — a 404 until the publish page is built |
| `search` | `/buscar/` | [`app/pages/buscar.vue`](./app/pages/buscar.vue) — a 404 until the search page is built |
| `authors` | `/colaboradores/` | [`layers/articles/app/pages/colaboradores/index.vue`](./layers/articles/app/pages/colaboradores/index.vue) — a 404 until the authors page is built |
| `author` | `/colaboradores/:slug/` | [`layers/articles/app/pages/colaboradores/[slug].vue`](./layers/articles/app/pages/colaboradores/%5Bslug%5D.vue) — a 404 until the author page is built |
| `categories` | `/materias/` | [`layers/articles/app/pages/materias/index.vue`](./layers/articles/app/pages/materias/index.vue) — a 404 until the categories page is built |
| `category` | `/materias/:slug/` | [`layers/articles/app/pages/materias/[slug].vue`](./layers/articles/app/pages/materias/%5Bslug%5D.vue) — a 404 until the category page is built |

### 🧼 The body pipeline

`toArticleBody` turns a post's HTML into markup that is safe to `v-html`, plus its TOC, notes and
bibliography. It runs on the rehype stack, server-side only, so the parser never ships to the
browser. [Decision 0027](../../docs/decisions/0027-huella-legal-content-model.md) has the corpus
counts behind each rule.

| Step | What it does |
| --- | --- |
| Class map | `contenedor` → `hl-note`, `cita-larga` → `hl-quote`, `cita-corta` → `hl-quote-short`, `texto-importante` → `hl-callout`, `texto-destacado` → `hl-highlight`; `wp-block-table` is kept for the scroll shadows. Every other class is dropped, since a Tailwind utility would apply |
| Sanitise | `rehype-sanitize` on GitHub's schema, with ids left unprefixed (the TOC links to them), `figure`, `figcaption` and `cite` allowed, and `srcset` and `sizes` kept. `script` and `style` go with their text |
| Notes | One shape only: the text links to `#_ftnN`, and each note is a top-level paragraph opening with a link to `#_ftnrefN`. Those paragraphs become `ArticleBody.notes`, and each reference becomes `<sup><a href="#nota-N" id="ref-N">`, the ids `ArticleNotes` links back to. Any other shape, bare `<sup>` numbers included, renders as written. Runs before the bibliography split, since the notes close the post, after it |
| Bibliography | Split from the last top-level *Bibliografía*, *Fuentes* or *Referencias (bibliográficas)* heading, one fragment per paragraph or list item, because the design sets it apart below the body |
| TOC | Every `h2` and `h3` gets an ASCII id unless it has one, never repeated |
| Images | Every one gets `loading="lazy"` and `decoding="async"` |
| Lead | Everything up to and including the first top-level paragraph goes in `lead`, and the page sets the featured image after it, as the lab design does |

The article routes read posts through the content module's `useContent(event)`, so the provider,
its cache and its error statuses stay the module's: a failed read reaches the page with the status
`useContent` settled on, `404` for a missing post and `502` when the vendor failed.

Citations are worded in the style they follow (*s. f.*, *Disponible en*), in the journal's language,
so that wording lives in `toCitations` rather than in the copy keys. The date shares
[`i18n/dateFormats.ts`](./i18n/dateFormats.ts) with `i18n.config.ts`, so a citation
and the page print the same day.

## 📚 Storybook

Components are worked on in isolation here, with a story beside the component it renders
(`app/**` or `layers/*/app/**`, as `*.stories.ts`). The setup follows
[`@monorepo/ui`](../../packages/ui/README.md) — `@storybook/vue3-vite`, not a Nuxt integration,
because the Nuxt one (`@storybook-vue/nuxt`) stops at Nuxt 3, Vite 7 and Storybook 9.

So Storybook is a plain Vite app, and [`.storybook/main.ts`](./.storybook/main.ts) gets back what
Nuxt modules would otherwise give it:

| Piece | Stands in for | Read from |
| --- | --- | --- |
| `@nuxt/ui/vite` + `@nuxt/ui/vue-plugin` | The `@nuxt/ui` module: components, theme and Vue auto-imports | `ui` in `nuxt.config.ts` and `ui` in `app/app.config.ts` |
| `fontless` | `@nuxt/fonts`, which is built on it | `fonts` in `nuxt.config.ts` |
| `main.css` in [`preview.ts`](./.storybook/preview.ts) | `css` in `nuxt.config.ts` | — |
| A `<UApp>` decorator | `app.vue`'s root, which overlays portal into | — |
| `vue-i18n` in [`preview.ts`](./.storybook/preview.ts) | `@nuxtjs/i18n`: `$t` in templates, `useI18n()` in scripts | The `es-ES.json` [dev reads](#-i18n) and `i18n.config.ts`'s date formats, injected by `main.ts` |
| `autoImport.dirs` | Nuxt's `utils` auto-imports, in scripts and templates | `app/utils/`, `layers/*/app/utils/` |
| `components.dirs` | Nuxt's component auto-imports, namespaced by directory so `base/Kicker.vue` is `BaseKicker` | `app/components/`, `layers/*/app/components/` |

Both configs are imported, not copied, so a theme change reaches the stories with no second edit.
Each script runs `nuxi prepare` first because Vite follows `tsconfig.json` into `.nuxt/`.

A story renders a component **without Nuxt**: no `#imports`. Links resolve through a
memory router in [`preview.ts`](./.storybook/preview.ts) (`router: true` in `main.ts`), whose route
table repeats the [names and paths](#-links) by hand. `vue-i18n` is auto-imported, with the messages and the
`datetimeFormats` from [`i18n.config.ts`](./i18n/i18n.config.ts), so `$t`, `useI18n()` and `d()`
print what the app prints.

The published copy lives in the [developer portal](../developer-portal/README.md)'s Pages artifact
under `/huella-legal-storybook/`, linked from this app's card. `STORYBOOK_BASE_URL` sets its Vite
base there and is unset locally.


Two halves, one per runtime, each from [`@monorepo/observability`](../../packages/observability) and
each skipped entirely when its URL is unset — which is why local dev ships nothing.

| Where | Plugin | Off switch |
| --- | --- | --- |
| Browser | [`app/plugins/observability.client.ts`](./app/plugins/observability.client.ts) | `NUXT_PUBLIC_OBSERVABILITY_URL` |
| Nitro | [`server/plugins/observability.ts`](./server/plugins/observability.ts) | `NUXT_OBSERVABILITY_URL` |

The server plugin opens the request span itself, by wrapping `nitroApp.h3App.handler`, because
`@monorepo/observability` ships no inbound HTTP instrumentation — [its
Gotchas](../../packages/observability/README.md#️-gotchas) say why. Wrapping the handler also means
internal `$fetch` calls nest under the request that made them, and an incoming `traceparent`
continues the browser's trace rather than starting a second one.

Both halves read `app.version` and `app.environment` from the same public runtime config, so one
`NUXT_PUBLIC_OBSERVABILITY_APP_VERSION` stamps browser and server alike. It defaults to `0.0.0` —
set it at deploy time or nothing can be attributed to a release. Static assets and Nuxt's own dev
endpoints (`/_nuxt`, `/_fonts`, `/__nuxt`, `/favicon.ico`) are left untraced on purpose; the list
lives in the plugin.

The span is named for the **matched route**, not the path — it opens under the concrete URL, because
nothing has matched a route yet, and is renamed once the response is known. Anything that skips that
rename gives every slug and every query string a span name of its own, which makes the operation
impossible to aggregate and the keyspace unbounded. That is the property
[the spec](./server/plugins/observability.spec.ts) spends most of its assertions on.

## ✅ Testing

Three layers, each proving something the others can't see.

| Layer | Runs | Where | Command |
| --- | --- | --- | --- |
| `node` | Vitest on the [node preset](../../packages/configs/README.md) | `server/`, `shared/`, `tools/`, and the same in each `layers/*` | `pnpm test` |
| `nuxt` | Vitest in a booted Nuxt app on happy-dom, via `@nuxt/test-utils` | `app/`, and each `layers/*/app/` | `pnpm test` |
| e2e | Playwright, Chromium only, at 390, 768 and 1280 px | [`e2e/`](./e2e) | `pnpm exec nx e2e @monorepo/huella-legal` |

[`vitest.config.ts`](./vitest.config.ts) and [`playwright.config.ts`](./playwright.config.ts) are
wrappers over the shared presets in [`@monorepo/configs`](../../packages/configs/README.md), which
own the project split, where coverage lives, the widths and the baseline rules. What stays here is
what only this app knows: the thresholds (lines and statements 90, functions 85, branches 80), and
`app/lab/**` and `app/pages/**` kept out of the denominator, because the lab never ships and pages
are Playwright's. `test` runs without coverage, so the thresholds only bite on `pnpm test:coverage`.
[Decision 0028](../../docs/decisions/0028-huella-legal-e2e-and-visual-tooling.md) has the numbers.

- **Nitro auto-imports don't exist under the node project.** A spec for anything in `server/` stubs
  `defineNitroPlugin`, `useRuntimeConfig` and the `getRequest*` helpers as globals, and
  `defineNitroPlugin` before the import, since it runs at evaluation. See the `writing-tests` skill.
- **`import.meta.dev` compiles to `false` in the nuxt project**, as in every build a reader can
  reach. That is why the error page's debug panel is its own component,
  [`ErrorDebug.vue`](./app/components/ErrorDebug.vue): it can be mounted directly, where
  `error.vue` can only prove the panel stays hidden.

### 🎭 e2e

Playwright runs the built `.output/` server with [`e2e/server.ts`](./e2e/server.ts) preloaded through
`node --import`. That file starts MSW inside the server process with the fake WordPress from
`@monorepo/content/testing` and the fake Tolgee from `@monorepo/i18n/testing`, so there is no second
server and no upstream port. The vendor base URLs in `playwright.config.ts` point at `localhost`
paths nothing listens on, and a request no handler matches is logged by MSW and rejected, so none
reaches the network.

The data lives apart from the server, in [`e2e/fakes.ts`](./e2e/fakes.ts): domain entries built by
the seeded factories in `@monorepo/content/testing`, two of them pinned to the values the smoke spec
asserts on, plus the committed locale JSON in
[`infrastructure/translations`](../../infrastructure/translations/projects/huella-legal). The
packages turn those into each vendor's wire format, so the app never writes a WordPress or Tolgee
shape itself. There are no fixture files.

Each spec runs an axe scan against WCAG 2.1 AA and takes screenshots once per width. **Baselines are
written only in CI**, inside `mcr.microsoft.com/playwright:v1.63.0-noble`, which is why
`ignoreSnapshots` is on everywhere else. A Mac can't produce Linux baselines.

| Situation | What to do |
| --- | --- |
| New screenshot, no baseline | CI fails and uploads the `playwright` artifact. Commit its PNG under `e2e/__screenshots__/` |
| Changed screenshot | Commit the `-actual.png` from the artifact's `.playwright/` in place of the old baseline |
| Bumping `@playwright/test` | Move the image tag in [`ci.yml`](../../.github/workflows/ci.yml) in the same PR. Dependabot sends it alone for that reason |
| Running locally | Needs a Chromium that matches `@playwright/test`'s version in Playwright's browser cache. Nothing in the repo downloads one |
| A page needs new data | Add the `Entry` or `Term` to `e2e/fakes.ts`. A route the fakes don't serve is a change to the package's `testing` entry, with its spec |

Pre-push doesn't run e2e, so a green push is not yet a green `e2e` job.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Firefox or WebKit | Another project per browser in the configs preset, and every baseline tripled. Linux WebKit is not Safari, so it won't stand in for iOS readers |
| A per-glob threshold on view models | A3 adds `shared/**` and `layers/*/app/utils/**` at 95 alongside the mappers it creates |
| Shared client state | `@pinia/nuxt`, with `pinia.storesDirs` widened to `./layers/*/app/stores/**`: without it a layer's store isn't picked up, and the failure looks like a missing composable. Stories then need Pinia in the `setup` in `.storybook/preview.ts` |
| Author, category, publish and search pages | Replace the 404 bodies of the six [link-holding pages](#-links); their names and paths stay |
| Quote and callout styles | `hl-quote`, `hl-quote-short`, `hl-callout` and `hl-highlight` reach the page unstyled. B6 moved `.hl-prose` into the articles layer without rules for them, because no D design covers them |
| Tag links on the article | The *Temas* line is plain text until a tag page exists (`/etiquetas/<slug>/`, C2) |
| The newsletter band under the article | Left out until E1 gives `NewsletterBand` a submit to call; a form that drops the address is worse than none |
| *Publicaciones* lit in the header on an article | `useSiteNav` marks sections by route, and `/:slug/` also serves WordPress pages (C6), so it needs to know which one it rendered |
| The `onServerPrefetch` tree-shake override in `nuxt.config.ts` | Drop it once Nuxt stops stripping that hook from client builds; the article e2e's axe scan fails on `aria-controls` if it goes too early |
| Parity with the `/lab` pages | Still a human check: the lab is stripped from production builds, and Linux substitutes a serif for Georgia |
