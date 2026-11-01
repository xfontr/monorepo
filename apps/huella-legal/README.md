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
| `pnpm cache:clear` | Deletes the `articles` and `content` caches under `.nuxt/cache/`, so the next request rereads WordPress. Safe with the dev server running, and only touches local dev — see [Content](#-content) |
| `pnpm exec nx nuxt-prepare @monorepo/huella-legal` | Regenerates `.nuxt` (`nuxi prepare`) — [`nx.json`](../../nx.json) already runs it before `lint`/`typecheck`/`test`, so this is only for calling it by hand |

Two modules beyond the shared ones are installed here, `@nuxt/fonts` and `@nuxt/image`, and the
`forms` layer installs `@nuxtjs/turnstile`.

### 📖 API reference

Nitro's experimental OpenAPI support documents every `/api` route, in dev and on every deploy, and
the developer portal's Projects page links to it from the live deployment.

| Route | What it serves |
| --- | --- |
| `/_openapi.json` | The OpenAPI 3.1 spec, with the requesting origin as its server, so a deploy preview documents itself |
| `/_scalar` | Scalar's reference UI over that spec. Swagger UI is turned off |

A route documents itself with `defineRouteMeta({ openAPI: { … } })` beside its handler. Nitro reads
that call from the source rather than running it, so its argument must be literals only: an imported
constant or a template string is dropped without a warning, which is why `search` and `articles`
repeat `MAX_SEARCH_LENGTH` and `FORMATS` by hand. The `node` test project stubs `defineRouteMeta`
for every spec. The spec also lists the handlers Nuxt and its modules register, such as `/_ipx` and
`/api/translations/{locale}`, with no meta, under Nitro's own `Internal` and `API Routes` tags.

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

### 🗄 Rendering

A Netlify build prerenders every page that reads nothing from the query string, and Netlify's CDN
caches the rest for a day through `isr` route rules.
[0033](../../docs/decisions/0033-huella-legal-hybrid-prerender.md) has the reasoning and the
tripwires.

| Route | Served as |
| --- | --- |
| `/:slug/` for every post and every slug in `pageSlugs`, `/areas/`, `/colaboradores/`, `/calculo-intereses/`, `/contacto/`, `/publicar/`, `/sobre/` | A prerendered file. A slug added since the last build falls through to the function, which renders it once under `/**`'s `isr` |
| `/`, `/feed/`, and the `GET /api/*` routes | `isr` 86400 |
| `/publicaciones/`, `/areas/:slug/`, `/etiquetas/:slug/`, `/colaboradores/:slug/`, `/buscar/`, their `_payload.json`, `/api/articles`, `/api/search` | `isr` 86400, with a `Netlify-Vary` naming the query keys each one reads |
| `/api/articles/:slug/comments` | `isr` 600. New comments are held for moderation, so the window only delays an approval |
| `/api/newsletter`, `/api/contact`, `/api/comments`, `/robots.txt`, `/sitemap.xml` | The function, uncached. `@nuxtjs/sitemap` caches the sitemap itself for ten minutes |

Nuxt turns every `isr` rule into a client-side payload rule, so client navigation and link prefetch
read `<route>/_payload.json` rather than the API. `experimental.payloadExtraction` is `"client"`, so
a first view still gets its payload inlined instead of fetching it as a second request.

[`modules/rendering.ts`](./modules/rendering.ts) holds the route rules, and only switches
prerendering on when `CONTEXT` is set, which Netlify does on every build. CI and e2e build without
it, since a prerendered file would shadow e2e's fakes. `CONTEXT` is a cache input of `build` and `nuxt:build`, so Nx never restores one
kind of build for the other. To reproduce a Netlify build locally:

```sh
CONTEXT=deploy-preview pnpm exec nx build @monorepo/huella-legal --skip-nx-cache
```

That build reads the live WordPress and Tolgee, and it needs `NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN`.
It fails on any page that fails, so a WordPress or Tolgee outage fails the build, and Netlify keeps
the previous deploy live. Tolgee answering with stale copy doesn't fail it; only messages that never
loaded do, through [`prerenderTranslations.server.ts`](./app/plugins/prerenderTranslations.server.ts).
A 5xx answers `netlify-cdn-cache-control: no-store` from
[`server/plugins/cdn.ts`](./server/plugins/cdn.ts), so an outage never sits in the CDN for a day.

A prerendered page only changes on a build.
[`huella-legal-rebuild.yml`](../../.github/workflows/huella-legal-rebuild.yml) posts to a Netlify
build hook every Monday at 05:00 UTC, which refreshes author counts, related posts and corrections to
old posts. The hook URL is the `NETLIFY_BUILD_HOOK_URL` repo secret, with no default
([provisioning](../../docs/guides/repo-secrets.md)). Running the workflow by hand is also the purge
after an urgent correction, because every deploy empties the CDN cache.

## 🔑 Environment

A variable a feature can't work without is listed under `requiredEnv` in the `nuxt.config.ts` of
the layer that uses it. [`modules/requiredEnv.ts`](./modules/requiredEnv.ts) checks the merged list
once, so no route re-checks its config per request:

| Where | An unset required variable |
| --- | --- |
| Netlify production build (`CONTEXT=production`) | Fails the build naming each one, so the live deploy keeps serving. Netlify has to expose them to builds as well as functions, which is its default |
| `nuxt dev` | One warning at startup naming each one |
| Any other build, CI's included | Nothing: CI builds with none of them set |

A wrong value is the vendor's to refuse, and the adapter maps the refusal: anything Cloudflare
refuses is a `403` and anything Kit or Resend refuses is a `502`, each carrying the vendor's answer as
`cause`. Optional variables (telemetry, social profiles) stay out of the list, since unset only
turns their feature off.

| Variable | What it is |
| --- | --- |
| `NUXT_TRANSLATIONS_VENDOR_BASE_URL` | The translations server's URL in development. A build uses Tolgee's, set in `nuxt.config.ts` |
| `NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN` | The Tolgee API key. Unset in development |
| `NUXT_TRANSLATIONS_VENDOR_PROJECT` | Optional. Overrides the Tolgee project ID set in `nuxt.config.ts` |
| `NUXT_CONTENT_VENDOR_BASE_URL` | Optional. Overrides the WordPress site root set in `nuxt.config.ts` |
| `NUXT_PUBLIC_SITE_URL` | Optional. Overrides the public origin set in `nuxt.config.ts`, with scheme. Article permalinks, the share link, both citations, canonicals and the SEO modules' absolute URLs are built on it rather than on the request's host |
| `NUXT_SITE_ENV` | `production` on the production Netlify context, for builds as well as functions, and unset everywhere else. `nuxt.config.ts` defaults `site.env` to `preview`, so robots.txt disallows everything and every page says `noindex` unless it is set, and a production deploy fails without it. Prerendered pages bake the value in, which is why builds need it |
| `NUXT_PUBLIC_PAGE_SLUGS` | A JSON array of the WordPress page slugs served at `/:slug/`, such as `["aviso-legal"]`. Every other slug there is read as a post. The `articles` layer defaults it to `["aviso-legal"]`; set but empty, it replaces the list with `""`, so leave it unset instead |
| `NUXT_NEWSLETTER_API_KEY` | The Kit v4 API key, sent as `X-Kit-Api-Key` |
| `NUXT_NEWSLETTER_FORM_ID` | The Kit form new readers join. Its incentive email must be on, since that is the confirmation Kit sends |
| `NUXT_NEWSLETTER_BASE_URL` | Optional. Overrides the Kit API origin set in the `newsletter` layer, **without** `/v4` — the adapter owns that path |
| `NUXT_MAIL_API_KEY` | The Resend API key Contacto sends with, as a `Bearer` token. Resend sends only from a domain verified in that account, so the `from` literal has to be on it |
| `NUXT_MAIL_BASE_URL`, `_FROM`, `_TO` | Optional. Override Resend's API origin, the sender and the inbox set in the `contact` layer |
| `NUXT_COMMENTS_USERNAME`, `NUXT_COMMENTS_APPLICATION_PASSWORD` | The WordPress user new comments are posted as, and an application password of theirs. It must hold `moderate_comments` (Editor), the only capability that lets the request file the comment as the reader with their IP and hold it, so it is an editor-grade secret |
| `NUXT_PUBLIC_SUBMISSION_EMAIL` | Optional. Overrides the editorial inbox set in the `publish` layer, which Publicar's `mailto:` writes to |
| `NUXT_TURNSTILE_SECRET_KEY` | The Turnstile widget's secret key. Rejected by Cloudflare, every form route answers `403`, with `invalid-input-secret` in the `cause` |
| `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | The Turnstile widget's site key. Unset, the form shows its error state on submit |
| `NUXT_PUBLIC_OBSERVABILITY_URL` | Faro collector URL. Leave unset and browser telemetry stays off |
| `NUXT_PUBLIC_OBSERVABILITY_APP_VERSION` | Stamped on browser *and* server spans. Defaults to `0.0.0`, which nothing can be attributed to — set it at deploy time |
| `NUXT_PUBLIC_OBSERVABILITY_APP_ENVIRONMENT` | Stamped the same way. Defaults to `development` |
| `NUXT_OBSERVABILITY_URL` | Grafana OTLP gateway URL. Leave unset and server telemetry stays off |
| `NUXT_OBSERVABILITY_INSTANCE_ID` | Grafana Cloud instance ID, the user half of the OTLP credentials |
| `NUXT_OBSERVABILITY_TOKEN` | Grafana Cloud access token, the password half |
| `NUXT_PUBLIC_SOCIAL_INSTAGRAM`, `_LINKEDIN`, `_X` | Profile URLs for the footer's icons. Each one left unset drops its icon, and with none set the list is gone |

Only secrets and values that change per environment are env vars. A public value that is the same
everywhere is a literal in [`nuxt.config.ts`](./nuxt.config.ts), so changing it is a one-line PR:

| Literal | Value |
| --- | --- |
| `content.vendor.baseURL` | The WordPress site root, **without** `/wp-json` — the provider owns that path |
| `public.site.url` | The site's public origin, `www` included, with no trailing slash |
| `mail.baseURL`, `.from`, `.to` | Resend's API origin, the sender Contacto's email comes from and the inbox it goes to, set in [`layers/contact/nuxt.config.ts`](./layers/contact/nuxt.config.ts) |
| `public.submissionEmail` | The editorial inbox Publicar's `mailto:` writes to, set in [`layers/publish/nuxt.config.ts`](./layers/publish/nuxt.config.ts) |
| `translations.vendor.baseURL`, `.project` | Tolgee's API root and the project ID, for builds. Development overrides both |
| `translations.vendor.name`, `content.vendor.name` | Each selects its vendor's config type |

A matching `NUXT_`-prefixed variable still overrides any literal, which is how the e2e suite points
the vendors at its fakes. Every variable is read at **startup**, not at build time, so one build
artifact runs in any environment — the
[i18n module](../../packages/i18n/src/nuxt/README.md#-usage) has the mechanism and why nothing here
reads `process.env`. The exception is a [prerendered page](#-rendering): the build renders it, so
it keeps the `NUXT_PUBLIC_*` values and the vendor URLs the build had, and Netlify has to expose
them to builds.

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
| The first segment is who owns the copy: `app` for the shell (head, layout, header, footer), a page by name, singular for a detail page, or a component in camelCase | `app.title`, `publications.title`, `article.back`, `articleCard.readingTime` |
| Then the element, then its role, all camelCase and nested as objects, never a dotted literal key | `app.footer.links.publishThesis` |
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
from the browser: the `articles` core's routes call `useContent`, map each `Entry` into a view model
and serve that, so the CMS base URL and its unsanitised HTML stay on the server. Content is cached
once, inside `useContent`; the routes map on every request, since mapping a post takes a few
milliseconds and a second cache would add its own window of staleness.

The vendor is `wordpress`, pointed at an external WordPress install — the CMS is not in this repo, so
`infrastructure/` has nothing to do with it. Only the `articles` core's server routes consume it, and
the feature layers' pages read those routes:

| Page | Reads | Notes |
| --- | --- | --- |
| [`index`](./layers/archive/app/pages/index.vue) | `GET /api/home` through `useHome` | The newest post leads, the next five are "Lo último" and the three after those the recent cards, so none repeats. The thesis band takes the three newest theses from the whole index. The subject and format counts come from the same cached index. `ArticleSummary` carries no sticky flag, so the lead is the newest post |
| The four listings: [`publicaciones`](./layers/archive/app/pages/articles/index.vue), [`areas/:slug`](./layers/archive/app/pages/areas/%5Bslug%5D.vue), [`etiquetas/:slug`](./layers/archive/app/pages/etiquetas/%5Bslug%5D.vue) and [`colaboradores/:slug`](./layers/archive/app/pages/colaboradores/%5Bslug%5D.vue) | `GET /api/articles` through `useArticleListing` | `?page`, `?sort=oldest` and `?format=` live in the URL, each left out at its default. The pages don't re-validate them: the route answers anything a reader can type out of bounds with a `404`. [`listingScroll.client.ts`](./layers/archive/app/plugins/listingScroll.client.ts) scrolls to the top when only `?page` changes, wrapping Nuxt's scroll behaviour rather than replacing it |
| [`buscar`](./layers/search/app/pages/search.vue) | `GET /api/search` through `useArticleSearch` | `?query` and `?page` live in the URL, and a blank `query` is the empty state, which never asks the route. The route hands `query` to `useContent`'s `search`, where WordPress matches every word against the title, excerpt and body, so neither authors nor subjects are searched. A blank or overlong `query`, or a page past the end, is a `404`, WordPress's own `400` for the latter included. Only when nothing matches does it read the cached index, to suggest the four subjects with the most publications. The form is a real GET form, so a search works before hydration, and the page is `noindex` |
| [`areas`](./layers/archive/app/pages/areas/index.vue) | `GET /api/subjects` through `useSubjectIndex` | The subject grid, the three formats with the thesis band, and the topics A to Z, each counted from the cached index. The thesis tag marks a format, so it is not listed as a topic. Subject descriptions come from [`getCategories`](./layers/articles/server/services/categories.ts), cached like the index, since the index's embedded terms carry none |
| [`colaboradores`](./layers/archive/app/pages/colaboradores/index.vue) | `GET /api/authors` through `useAuthorDirectory` | Every author of the index with their post count, most published first, since WordPress users carry no count ([0027](../../docs/decisions/0027-huella-legal-content-model.md)). The name filter and the reveal past the first twelve run in the browser over that one list. The article page reads the same route lazily, under its own key, for `ArticleAuthorCard`'s count |
| [`layers/reading/app/pages/articles/[slug].vue`](./layers/reading/app/pages/articles/%5Bslug%5D.vue) | `GET /api/articles/:slug`, through `useArticle` | Served at `/:slug/`, the root permalink WordPress had, so indexed URLs still resolve. The route returns the sanitised `Article` view model with its citations. `GET /api/articles/:slug/related` serves up to three posts from its first category, server-rendered without blocking client navigation; when it fails, that band is hidden and the article is unaffected. `GET /api/articles/:slug/comments` serves its approved comments as `ArticleComments`, read in the browser only, since a prerendered article would otherwise keep a week-old thread; it fills the header's count and `ArticleView`'s `comments` slot, where the page places `CommentsSection`. No `locale` is passed: the content locale is the vendor's axis and WordPress refuses one outright. A slug listed in `pageSlugs` is a WordPress page instead: the route renders `PageView` in place of `ArticleView`, which reads `GET /api/pages/:slug` through `usePage` and never asks for a post. `GET /api/pages/:slug` answers a slug the list doesn't name with a `404`, so a page published in WordPress stays off the site until it is listed |

`GET /api/articles` filters, sorts and pages a cached index of every post as `ArticleSummary`,
because WordPress can filter on neither format nor author slug, and has no counts for them. One fill
reads every page of posts through `useContent` at its ceiling of 50, about 5.7 MB upstream for the
current archive, and is kept for an hour. That index is the one view model cached on top of
`useContent`, since remapping every body per request would cost far more than one post's few
milliseconds, so a new post can take up to two hours to list, plus the CDN's day on a listing
[rendered by Netlify](#-rendering). In dev, both caches keep five minutes
and refetch an expired entry before answering, set by the `$development` blocks in
[`nuxt.config.ts`](./nuxt.config.ts) and the [`articles` layer's](./layers/articles/nuxt.config.ts),
and `pnpm cache:clear` empties them at once. A subject or tag is read whole through
`useContent(event).getTerm`, since embedded terms carry no description. Nothing a listing renders is
HTML: titles and excerpts are decoded to plain text on the server.

See the [module README](../../packages/content/src/nuxt/README.md) for the options, the cache windows
and the gotchas.

## 🧩 Structure

[`app/`](./app) is the front-end shell and stays thin: a layout, an error page and its dev-only debug
panel, two client plugins (Faro telemetry, and a dev-only console filter for a known Nuxt/Vue
warning), a server plugin that fails a prerendered page whose translations didn't load, and one
page — the entry page. Its own server code is three Nitro plugins (telemetry, a log line for every
handled `5xx`, and the header that keeps a `5xx` out of the CDN). Beside it,
[`modules/requiredEnv.ts`](./modules/requiredEnv.ts) checks the
[required variables](#-environment) once per build, and
[`modules/rendering.ts`](./modules/rendering.ts) registers the route rules and lists the
[prerendered routes](#-rendering) on a Netlify build.

| Piece | What it holds |
| --- | --- |
| [`layouts/default.vue`](./app/layouts/default.vue) | The skip link, `SiteHeader`, the one `<main id="contenido">` and `SiteFooter`, fed by `useSiteNav`. A page never renders its own `<main>` |
| [`composables/useSiteNav.ts`](./app/composables/useSiteNav.ts) | The shell's links: the header sections with their `aria-current`, the footer columns, the configured social profiles and the ISSN. The layout calls it and hands the results to the shell |
| [`components/shell/`](./app/components/shell) | `SiteHeader` (`UHeader` with a slideover menu below `lg`) and `SiteFooter` (`UFooter` + `UFooterColumns`), both props-in. Every link is a [route name](#-links). WordPress pages such as `sobre` and `aviso-legal` are `article` slugs, and the privacy and cookies links are anchors on `aviso-legal`, per [0028](../../docs/decisions/0028-huella-legal-urls-and-cutover.md) |
| [`types/`](./app/types) | The vocabulary kits share across layers: `LinkAction`, the `{ label, to }` every link and action prop takes, and `Tone`, the `paper` or `slate` surface a component renders on |
| [`error.vue`](./app/error.vue) | The 404 design for a 404 and the server design for anything else, inside the same layout. It wraps itself in `UApp`, since Nuxt renders it in place of `app.vue` |
| [`utils/createPageError.ts`](./app/utils/createPageError.ts) | A failed page fetch as the fatal error `error.vue` renders: the status the route answered with, or `502` when no response came back, with data and stack kept. Every page controller raises through it, and client code reads and writes `status`/`statusText`, since Nuxt deprecates `statusCode`/`statusMessage` |
| [`app.config.ts`](./app/app.config.ts) | The journal's name and ISSN under `journal`, read by the citation mapper on the server too. The Nuxt UI theme is the [`design`](./layers/design) layer's |

`/lab` pages draw their own lab header and footer, so a `$development` hook in `nuxt.config.ts` sets
`layout: false` on them.

Domain logic lives in Nuxt layers under [`layers/`](./layers): one directory per task a reader
comes for, such as reading, browsing the archive or searching, a **feature**, plus one per concern that several features share, a **capability**, today
`forms` and `design`, and the **core**, `articles`, which owns the content. The core's routes are the only
code that calls `useContent`, and every feature reads them through `useCachedFetch`. A feature is
therefore app-side only: it never sees an `Entry`, and what two features share is the core's view
models, never each other's code. Nuxt auto-registers `<rootDir>/layers/*` by their presence, so
there is no `extends` array to add, and adding one is the mistake. A layer reaches another layer's
server code and shared types through Nitro's and Nuxt's auto-imports, never by a relative path.

Auto-imports make every layer's exports global, so which way they may be used is a rule rather than
something the tree enforces:

| Owner | Paths | May use |
| --- | --- | --- |
| Shell | Everything else under `app/` and `server/`, the lab aside | Anything |
| Kit | `app/components/base/`, `app/components/listing/`, `app/types/`, `app/utils/`, `app/composables/` | The kit |
| Core | `layers/articles/` | Itself and the kit |
| Capability | `layers/forms/`, `layers/design/` | Itself and the kit |
| Feature | Every other `layers/<name>/` | Itself, the kit, the core and the capabilities. Its `app/pages/` may also render another feature's auto-registered components, which is how the article pages place `NewsletterBand` |

A path import of another feature's component breaks the rule even from a page, so a component a
layer keeps out of auto-registration, like `NewsletterForm`, stays private. Review is what holds the
table: the linter sees no edge an auto-import makes. `checkUnknownComponents` in `nuxt.config.ts`
covers the one breakage that would otherwise pass every check, making typecheck fail on a tag that
resolves to nothing, so deleting a layer can't leave its components named on another layer's pages.

| Layer | `shared/` | `app/components/` | `server/` |
| --- | --- | --- | --- |
| [`archive`](./layers/archive) | — | `archive/` is an `ArticleListing` on the four listing pages, under `BasePageIntro` (the breadcrumb, from home) holding `BasePageHeading` or, on a profile, `ArchiveAuthor`, then `ArchiveResults` and the `ArchiveSubjects` aside. A file inside a folder drops the folder's prefix (`archive/Results.vue`): Nuxt collapses a repeated prefix and Storybook doesn't, so `archive/ArchiveResults.vue` would register under two different names; every layer follows this. `useArticleListing` in `app/composables/` is every listing page's controller: the fetch, the query in the URL, the sort and the format pills. [`listingScroll.client.ts`](./layers/archive/app/plugins/listingScroll.client.ts) is its scroll fix. `home/` is the `Home` on the home page, `index.vue`: `HomeFeatured` (the lead and "Lo último"), `HomeSubjects` and `HomeTheses`. `useHome` is its controller. `subjects/` is the `SubjectIndex` on the subjects page: `SubjectsGrid`, `SubjectsFormats` and `SubjectsTopics`, which files topics under their initial with `groupByLetter`. `useSubjectIndex` is the page's controller. `directory/` is the authors page's `DirectoryListing`, which owns the name filter and the no-match state, over `DirectoryCard`s. `Reveal` hands its slot the first `limit` items and shows the rest behind one button, moving focus to the first link revealed. `useAuthorDirectory` is the page's controller. `sobre.vue` is the about page: it counts the archive's articles and authors through `useSubjectIndex` and `useAuthorDirectory` for `AboutIntro`, and holds the static sections itself, between the intro and `AboutCallToAction`. `AboutFingerprint` is the mark that draws itself in, on load or, with `drawOnView`, once it scrolls into view. Its motion is CSS only, in each component's unscoped `<style>`, scroll-driven where the browser supports it, and off under reduced motion | — reads the core's routes: `GET /api/articles`, `GET /api/home`, `GET /api/subjects` and `GET /api/authors` |
| [`articles`](./layers/articles) | The view models the server returns: `Article`, `ArticleBody`, `ArticleSummary`, `ArticleListing` (with its `Facet` counts and `ListingScope`), `Author`, `Category`, `Citation`, `Note`, `SubjectIndex`, `Home`, `TocItem`, `Page` (a WordPress page's title, `ArticleBody`, SEO and `permalink`), `ArticleComments` (whether the post is open, the count, and its `CommentThread`s of `ReaderComment`s), plus the `ListingQuery` the listing route accepts and `ArticleSearch`, a page of results with its query and the subjects suggested when nothing matched. `Article` carries its absolute `permalink` and `citations` | `summary/` is an `ArticleSummary` wherever articles are listed: `SummaryCard` in five variants (lead, optionally split, standard, compact, media, row), and `SummaryGrid` and `SummaryList` to lay them out. `Byline` (authors, date, reading time and the comment count, linked to the thread) and `MediaFallback` sit beside it, since several features render them outside a card too. `useCachedFetch` in `app/composables/` is how every feature reads a route. `FORMAT_KEYS` in `app/utils/` names each format's copy key, and `bylineAuthors` links each author to their profile. `noteAnchor`/`noteReferenceAnchor` in `shared/utils/` are the note ids the body mapper and `ArticleNotes` share, and `toCitationMeta` beside them builds an `Article`'s Google Scholar tags | `toArticleSummary` maps an `Entry` into them, format rule included. Decoding and reading time parse with the domain-free helpers in `server/utils/hast.ts`, and stay server-side. `toArticleBody` is the WP HTML pipeline, with `extractNotes` and `annotateHeadings` beside the view models they produce, `toCitations` writes APA 7 and the journal's own style, `GET /api/articles/:slug` serves the `Article`, `GET /api/articles/:slug/related` its related `ArticleSummary` list, and `getArticleIndex` in `server/services/` caches every post's summary for `toArticleListing` to slice into `GET /api/articles`, `toSubjectIndex` to count into `GET /api/subjects`, `toHome` to pick from into `GET /api/home` and `toAuthorDirectory` into `GET /api/authors`. `GET /api/search` maps WordPress's results through `toArticleSearch`, with `toSuggestedSubjects` counted from the same index. `toPage` runs the same `toArticleBody` over a page, and `GET /api/pages/:slug` serves it to the slugs in `pageSlugs`. Comments are not content, so `server/adapters/wordpress.ts` reads them from WordPress's comments route directly, unauthenticated, which answers approved ones only: `GET /api/articles/:slug/comments` maps them through `toArticleComments`, which hangs every reply under its top-level comment and turns each paragraph into plain text, and `getCommentCounts` in `server/services/` counts every approved comment once, cached like the index, for `withCommentCounts` to put on the summaries the card routes answer. A failed count leaves the cards without one. `GET /api/__sitemap__/urls` hands `@nuxtjs/sitemap` the posts, `pageSlugs`, áreas and colaboradores, and `server/routes/feed.get.ts` serves the RSS `/feed/` from the same index, both leaving out a post Yoast marks `noindex` |
| [`contact`](./layers/contact) | `contactSchema`, the Valibot rules a message must pass (name, email, message and consent `true`), worded by the caller so the server reuses them, and `ContactRequest`, the route's body: those fields plus `FormRequest` | `ContactForm` wires the four fields, `FormHoneypot` and `FormChallenge` to `useContact` in `app/composables/`, the same state machine as `useNewsletter`, so a `422` lands on the fields it names. A failed submit renders `FormErrorSummary`, and the notice under the consent checkbox names Netlify, Cloudflare and Resend as recipients. Its page, `contacto.vue`, places it under `BasePageIntro` at `/contacto/` | `POST /api/contact` answers a filled honeypot like a success and sends nothing, then calls `assertChallenge`, re-validates with the same schema through `assertForm` and calls `sendContactMessage` in `server/adapters/resend.ts`: one plain-text email from `mail.from` to `mail.to` with Reply-To set to the reader, so the inbox answers them directly. The rest is `422` with `FormError[]`, `403` on a failed challenge, and `502` for anything Resend refuses or can't answer. The app stores nothing: a message lives only in the inbox and in Resend's log |
| [`comments`](./layers/comments) | `commentSchema`, the Valibot rules the reader's fields must pass (name, email, comment up to 5,000 characters and consent `true`), `newCommentSchema`, those plus the `post` and the `parent` it replies to, and `CommentRequest`, the route's body | `CommentsSection` is the thread under an article: each top-level `CommentItem` with its replies indented once, however deep WordPress nested them, and the one `CommentForm`. "Responder" hands that comment to the form, which says whom the reply answers and takes focus. A closed article keeps its thread and loses the form and the reply buttons. From five threads up, `ListingSortSelect`, worded through its `copy` prop since "Más antiguos" agrees with comments, flips the threads to newest first; replies always stay oldest first. `usePostComment` is the form's state machine, `useContact`'s plus a `failure` naming why a send failed. The notice names Netlify, Cloudflare, Akismet and WordPress as recipients | `POST /api/comments` answers a filled honeypot like a success and files nothing, then calls `assertChallenge`, re-validates through `assertForm` and calls `createComment` in `server/adapters/wordpress.ts`: authenticated with an application password, it files the comment as the reader with `status: "hold"` and their IP and user agent, so Akismet judges them and not the server. The posting user's `unfiltered_html` skips kses, so the content is escaped and `<>` dropped from the name. WordPress's duplicate, flood and closed refusals become `409`, `429` and `410`; anything else is `502` |
| [`design`](./layers/design) | — | None: the layer is the design system the rest render with. [`main.css`](./layers/design/app/assets/main.css) holds every token and points Nuxt UI's semantic roles at them, and [`app.config.ts`](./layers/design/app/app.config.ts) sets the colour aliases and composes the component theme from `theme/`, one file per component named for its `ui` key (`button.ts`, `footerColumns.ts`), plus `tv.ts` for the tailwind-merge type steps. A `ui` key styles that component everywhere, since Nuxt merges every layer's app config into one, so a look only one layer needs is a `:ui` override where it renders. The layer's `nuxt.config.ts` registers the stylesheet and sets the `ui` and `fonts` options, while `@nuxt/ui` and `@nuxt/fonts` stay in the root `modules` list, because Nuxt installs a layer's modules before the root's | — |
| [`forms`](./layers/forms) | `Challenge`, the type of `FormChallenge`'s slot prop, and `FormRequest`, the `website` and `token` fields every form posts | The form pieces no single feature owns, for the newsletter and publish controllers to drive. A feature's form lives in its own layer: forms are `UForm`, and fields are `UFormField` with Nuxt UI inputs, themed in the `design` layer. `FormErrorSummary` links each error to its field's `id`, and `FormSuccessPanel` takes focus when it mounts, because a status region mounted with its text is never announced. A failed submit is a plain `UAlert` with `role="alert"`. In `app/composables/`, `useFormSubmission` drives a form that posts: it sends the fields with the honeypot's value through `challenge`, words the server's `422` issues onto their fields with `setErrors`, and validates on input once the form has been submitted; `useErrorSummary` builds `FormErrorSummary`'s rows, and the contact and interest forms use it. The spam defence is two components, kept apart because they do different jobs. `FormHoneypot` is a hidden field bound with `v-model`, placed among the form's own fields so a bot filling the form fills it too. `FormChallenge` wraps the form and holds `@nuxtjs/turnstile`'s `NuxtTurnstile`, which stays invisible unless Cloudflare wants an interaction. The widget mounts on the wrapped form's first `focusin`, so a page nobody signs up from never loads Cloudflare's script. The module's own `trigger` can't do this, since it only listens on the widget's element. Its slot gets `challenge(send)`, which waits up to 30 s for a token, hands it to `send`, and resets the widget once `send` settles, since a token is single-use. The layer's `nuxt.config.ts` installs the module and declares both keys empty, which also keeps out the always-pass keys the module would default to in dev | `assertChallenge` in `server/utils/turnstile.ts` makes one siteverify call through the module's `verifyTurnstileToken` and reads only its `success` flag, never the error codes. A refusal is a `403` carrying Cloudflare's answer as `cause`, even when it arrives as a thrown `400`, and no answer at all is a `502`. `assertForm` in `server/utils/assertForm.ts` re-runs a route's schema, returning its output or throwing a `422` with one `FormError` per issue. The honeypot is neither's job: each route returns early on it |
| [`interest`](./layers/interest) | — | `InterestCalculator` lays out two private parts and owns the arithmetic: `InterestCalculatorForm` emits `submit` with a validated `InterestInput`, the preset already resolved to a percentage, and `edit` on any change, which clears a stale result; `InterestCalculatorResult` formats the cents as euros inside a live region that stays mounted so the first result is announced. Like `NewsletterForm`, the layer's `nuxt.config.ts` keeps both parts out of auto-registration. A failed submit renders `FormErrorSummary`. The form validates with `interestFormSchema` in `app/schemas/`, the Valibot rules worded by the caller, and computes with `calculateInterest` in `app/utils/`, simple interest in cents over actual days and a 365-day year, with `INTEREST_RATES` holding the legal and judicial presets. Its page, `calculo-intereses.vue`, replaces the WordPress calculator at `/calculo-intereses/` per [0028](../../docs/decisions/0028-huella-legal-urls-and-cutover.md) | — the arithmetic runs in the browser |
| [`newsletter`](./layers/newsletter) | `subscriptionSchema`, the Valibot rules a subscription must pass, worded by the caller so the server reuses them, and `NewsletterRequest`, the route's body: the address plus `FormRequest` | `NewsletterForm`, the field and button, stacked or inline, in a paper or slate tone, with the privacy notice every variant needs under it. It runs its own `useNewsletter`, so `NewsletterBand` (a landmark; the home page gives it `id="newsletter"`, which the header's newsletter links target) and `NewsletterCard` (the sidebar, naming an optional `subject`) only place it. It is private to the layer: the layer's `nuxt.config.ts` keeps it out of auto-registration. `useNewsletter` in `app/composables/` is the state machine, idle → submitting → success, invalid or error, one per form: a `422` becomes field errors through `UForm`'s `setErrors`, anything else the alert. Success replaces the form with `FormSuccessPanel`, asking the reader to confirm by email. The form sits inside `FormChallenge` with a `FormHoneypot` among its fields, and `subscribe` sends the honeypot's value through `challenge`, so a Turnstile token rides with every post | `POST /api/newsletter` answers a filled honeypot like a success and sends nothing, then calls `assertChallenge`, re-validates with the same schema through `assertForm` and calls `addSubscriber` in `server/adapters/kit.ts`: it creates the subscriber as `inactive`, an upsert that never changes an existing one's state, then adds them to the form, whose incentive email is the confirmation. A subscriber who is `cancelled`, `bounced` or `complained` never reaches the form, so an address that left is never resubscribed and sees the same success. The rest is `422` with `FormError[]`, `403` on a failed challenge, `502` when a vendor fails. A `422` from Kit is a `422` on the field (`rejected`). [0029](../../docs/decisions/0029-huella-legal-forms-and-integrations.md) has the reasoning |
| [`publish`](./layers/publish) | — | The Publicar page's sections, each placing its own copy: `PublishReasons`, `PublishSteps`, `PublishProposal`, `PublishFaq` and `PublishThesis`, the card behind the footer's `#tesis` link. There is no form yet: `PublishProposal` lists what a proposal must include and opens a `mailto:` to `public.submissionEmail`, a literal in the layer's `nuxt.config.ts`, with the subject and a body template filled in. Its page, `publicar.vue`, places them under `BasePageIntro` | — the author's own mail client sends it |
| [`reading`](./layers/reading) | — | `article/` is the article page, one component per section (`ArticleHeader`, `ArticleToc`, `ArticleProse`, `ArticleBackMatter`, `ArticleRelated`) plus their parts: `ArticleTitle` (the breadcrumb and `h1`, with slots for a kicker above and the rest below), `ArticleShareBar`, `ArticleNotes`, `ArticleBibliography`, `ArticleCiteBox` and `ArticleAuthorCard`. `ArticleView` and `page/View.vue` (`PageView`) are what `[slug].vue` chooses between, each awaiting its own controller. `ArticleView` renders the `comments` feature's `CommentsSection` below the article. `PageView` is a WordPress page: `ArticleTitle`, then `ArticleToc`, `ArticleProse`, `ArticleNotes` and `ArticleBibliography` on the article's grid. Aviso legal, with privacy and cookies as sections whose heading ids the footer links target, is one of these pages. `ArticleToc` is a rail or an accordion, lit by Nuxt UI's `useScrollspy`, and takes an optional `title` in place of "En este artículo". `useArticle` in `app/composables/` is the article page's controller: the fetches, the error, the breadcrumb and the SEO meta. `useScholarlyMeta` is what `ArticleView` calls once the article has loaded, for its `citation_*` tags and the `ScholarlyArticle` it hands `nuxt-schema-org`, which renders on the server only. `usePage` is a WordPress page's: the fetch, the error and the SEO meta. `.hl-prose` in [`app/assets/prose.css`](./layers/reading/app/assets/prose.css) styles the sanitised body | — reads the core's routes: `GET /api/articles/:slug` and its `related` and `comments`, `GET /api/pages/:slug`, and `GET /api/authors` for the author counts |
| [`search`](./layers/search) | — | `search/` is search: `SearchDialog`, the header's button, which stays a link to `/buscar/` until hydration and then opens `SearchPalette` in place (also on `/` and ⌘K), and the search page's `SearchForm` and `SearchResults`, whose count lives in a status region that stays mounted, so each new result is announced. Before typing, the palette offers the biggest subjects and the latest posts from `/api/home`; once typing pauses, the first five `/api/search` matches. Its first row is the full results page, because Enter takes the highlighted row and the palette highlights the first. `useArticleSearch` is the search page's controller: the query in the URL and the draft in the input, kept in step with it. `useSearchPreview` is the palette's: a debounced query and both fetches, which fail quietly, since Enter still reaches the results page | — reads the core's routes: `GET /api/search`, and `GET /api/home` for the palette |

### 🔗 Links

The router is the only owner of a URL. A page names itself and sets its path in `definePageMeta`,
and components link by that name — `{ name: "article", params: { slug } }` — never by a built
string, so moving a URL is one edit in one page. `experimental.typedPages` generates the route map
from those pages, so a wrong name or a missing param fails typecheck.

| Name | Path | Page |
| --- | --- | --- |
| `index` | `/` | [`layers/archive/app/pages/index.vue`](./layers/archive/app/pages/index.vue) |
| `publications` | `/publicaciones/` | [`layers/archive/app/pages/articles/index.vue`](./layers/archive/app/pages/articles/index.vue) |
| `article` | `/:slug/` | [`layers/reading/app/pages/articles/[slug].vue`](./layers/reading/app/pages/articles/%5Bslug%5D.vue) |
| `publish` | `/publicar/` | [`layers/publish/app/pages/publicar.vue`](./layers/publish/app/pages/publicar.vue) |
| `contact` | `/contacto/` | [`layers/contact/app/pages/contacto.vue`](./layers/contact/app/pages/contacto.vue) |
| `search` | `/buscar/` | [`layers/search/app/pages/search.vue`](./layers/search/app/pages/search.vue) |
| `about` | `/sobre/` | [`layers/archive/app/pages/sobre.vue`](./layers/archive/app/pages/sobre.vue) |
| `authors` | `/colaboradores/` | [`layers/archive/app/pages/colaboradores/index.vue`](./layers/archive/app/pages/colaboradores/index.vue) |
| `author` | `/colaboradores/:slug/` | [`layers/archive/app/pages/colaboradores/[slug].vue`](./layers/archive/app/pages/colaboradores/%5Bslug%5D.vue) |
| `categories` | `/areas/` | [`layers/archive/app/pages/areas/index.vue`](./layers/archive/app/pages/areas/index.vue) |
| `category` | `/areas/:slug/` | [`layers/archive/app/pages/areas/[slug].vue`](./layers/archive/app/pages/areas/%5Bslug%5D.vue) |
| `tag` | `/etiquetas/:slug/` | [`layers/archive/app/pages/etiquetas/[slug].vue`](./layers/archive/app/pages/etiquetas/%5Bslug%5D.vue) |

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
| `@nuxt/ui/vite` + `@nuxt/ui/vue-plugin` | The `@nuxt/ui` module: components, theme and Vue auto-imports | `ui` in the `design` layer's `nuxt.config.ts` and `app/app.config.ts` |
| `fontless` | `@nuxt/fonts`, which is built on it | `fonts` in the `design` layer's `nuxt.config.ts` |
| `main.css` in [`preview.ts`](./.storybook/preview.ts) | `css` in the `design` layer's `nuxt.config.ts` | — |
| A `<UApp>` decorator | `app.vue`'s root, which overlays portal into | — |
| `vue-i18n` in [`preview.ts`](./.storybook/preview.ts) | `@nuxtjs/i18n`: `$t` in templates, `useI18n()` in scripts | The `es-ES.json` [dev reads](#-i18n) and `i18n.config.ts`'s date formats, injected by `main.ts` |
| `autoImport.dirs` | Nuxt's `utils` auto-imports, in scripts and templates | `app/utils/`, `layers/*/app/utils/` |
| `components.dirs` | Nuxt's component auto-imports, namespaced by directory so `base/Kicker.vue` is `BaseKicker` | `app/components/`, `layers/*/app/components/` |
| `sb.mock` of `useNewsletter` in [`preview.ts`](./.storybook/preview.ts) | The newsletter controller, with `POST /api/newsletter` behind it. Its [`__mocks__`](./layers/newsletter/app/composables/__mocks__/useNewsletter.ts) copy holds one status and never sends a request. Storybook restores its idle default before every story, and a `NewsletterForm` state story sets its own in `beforeEach` | — |
| A `NuxtImg` stub in [`preview.ts`](./.storybook/preview.ts) | `@nuxt/image`'s component, as a plain `<img>` with the original URL | — |
| A `NuxtTurnstile` stub in [`preview.ts`](./.storybook/preview.ts) | The module's widget, which `FormChallenge` mounts when a story's field takes focus, so no story loads Cloudflare's script | — |

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

A 5xx raised through `createError`, which covers every error `useContent` throws, answers the
client with a generic status message. The failure behind it rides on `cause`, and Nitro logs only
*unhandled* errors, so two things keep that cause visible:

| What | Where | Off switch |
| --- | --- | --- |
| A `console.error` for every handled request 5xx, cause chain included | [`server/plugins/errorLog.ts`](./server/plugins/errorLog.ts) | none: logs ship whether or not tracing does |
| A second exception event on the span for the error's `cause` | `recordError` in [`server/plugins/observability.ts`](./server/plugins/observability.ts) | `NUXT_OBSERVABILITY_URL` |

## ✅ Testing

Three layers, each proving something the others can't see.

| Layer | Runs | Where | Command |
| --- | --- | --- | --- |
| `node` | Vitest on the [node preset](../../packages/configs/README.md) | `server/`, `shared/`, `tools/`, and the same in each `layers/*` | `pnpm test` |
| `nuxt` | Vitest in a booted Nuxt app on happy-dom, via `@nuxt/test-utils` | `app/`, and each `layers/*/app/` | `pnpm test` |
| e2e | Playwright, Chromium only, at 390, 768 and 1280 px | [`e2e/`](./e2e) | `pnpm exec nx e2e @monorepo/huella-legal` |

[`vitest.config.ts`](./vitest.config.ts) and [`playwright.config.ts`](./playwright.config.ts) are
wrappers over the shared presets in [`@monorepo/configs`](../../packages/configs/README.md), which
own the project split, where coverage lives and the widths. What stays here is
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
shape itself. There are no fixture files. Kit and Turnstile have no package, so their MSW
handlers live in [`e2e/vendors.ts`](./e2e/vendors.ts), along with the stand-in Turnstile `api.js`
that a spec serves with `page.route`, since the browser fetches that script itself. Both match Turnstile's
paths on any host, because `@nuxtjs/turnstile` fixes Cloudflare's URLs rather than reading them from
config.

Each spec asserts on behaviour and runs an axe scan against WCAG 2.1 AA, once per width. **There
are no screenshot baselines**: while the pages are still being designed nearly every diff is
intended, so they failed every page PR and got accepted unread. CI runs the specs inside
`mcr.microsoft.com/playwright:v1.63.0-noble`, and on failure uploads `.playwright/` as the
`playwright` artifact.

**Console output fails e2e, in the browser and on the server.** The mechanism lives in the
[Playwright preset](../../packages/configs/README.md); this app only wires it. Specs import `test`
from `@monorepo/configs/playwright/test`, never from `@playwright/test`, and the ESLint preset
enforces it. Its `page` fails a test on any browser console message or uncaught page error, checked
once the test body returns, so a test that ends on `page.goto` misses whatever the app logs as it
boots after `load`. A test whose noise is justified allows it with
`test.use({ allowedConsole: [NOT_FOUND_DOCUMENT] })`, a list of patterns. SSR logs in the server
process, where no page listener reaches, so [`e2e/server.ts`](./e2e/server.ts) calls `recordServerConsole()`, and the preset's
teardown fails the run on anything the server logged besides Nitro's `Listening on` line. That run
fails even when every test passed, reported as "1 error was not a part of any test". The recorder
also prints until the server listens, because a server that can't start never reaches the teardown.

| Situation | What to do |
| --- | --- |
| Bumping `@playwright/test` | Bump its catalog entry in [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) and move the image tag in [`ci.yml`](../../.github/workflows/ci.yml) in the same PR. Dependabot sends it alone for that reason |
| Running locally | Needs a Chromium that matches `@playwright/test`'s version in Playwright's browser cache. Nothing in the repo downloads one |
| A page needs new data | Add the `Entry` or `Term` to `e2e/fakes.ts`. A route the fakes don't serve is a change to the package's `testing` entry, with its spec |

Pre-push doesn't run e2e, so a green push is not yet a green `e2e` job.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Visual regression | Once the pages stop changing, `toHaveScreenshot` on the shell alone, where a change nobody meant shows on every page. Baselines have to come from CI's image, since a Mac can't render Linux ones, and only CI should write them. [0028](../../docs/decisions/0028-huella-legal-e2e-and-visual-tooling.md) has the setup that was removed |
| Firefox or WebKit | Another project per browser in the configs preset. Linux WebKit is not Safari, so it won't stand in for iOS readers |
| A per-glob threshold on view models | A3 adds `shared/**` and `layers/*/app/utils/**` at 95 alongside the mappers it creates |
| Shared client state | `@pinia/nuxt`, with `pinia.storesDirs` widened to `./layers/*/app/stores/**`: without it a layer's store isn't picked up, and the failure looks like a missing composable. Stories then need Pinia in the `setup` in `.storybook/preview.ts` |
| A submission form on Publicar | #301 decides between it and the `mailto:`. The form variant's route, mail adapter, 4 MB cap and GDPR notice are the *form only* rows of [0029](../../docs/decisions/0029-huella-legal-forms-and-integrations.md) |
| A role on each contributor | [0027](../../docs/decisions/0027-huella-legal-content-model.md) found no source for it, so the directory cards drop the lab's role line until WordPress carries one |
| Quote and callout styles | `hl-quote`, `hl-quote-short`, `hl-callout` and `hl-highlight` reach the page unstyled. B6 moved `.hl-prose` into the articles layer without rules for them, because no D design covers them |
| Tag links on the article | The *Temas* line is still plain text, though `/etiquetas/<slug>/` now exists to link it to |
| The newsletter band on the home page | C3 places it with `id="newsletter"`, the anchor the header's links already target |
| The newsletter's failure paths in e2e | A vendor `5xx` makes `errorLog.ts` write to the server console, which fails the run, so the `403` and `502` paths are pinned in the route and controller specs only |
| The privacy notice's wording | A draft: the owner rewrites the legal text ([0029](../../docs/decisions/0029-huella-legal-forms-and-integrations.md)), and the notice links `aviso-legal#privacidad` until C6 gives privacy a page |
| *Publicaciones* lit in the header on an article | `useSiteNav` marks sections by route, and `/:slug/` also serves WordPress pages (C6), so it needs to know which one it rendered |
| The `onServerPrefetch` tree-shake override in `nuxt.config.ts` | Drop it once Nuxt stops stripping that hook from client builds; the article e2e's axe scan fails on `aria-controls` if it goes too early |
| A check on layer directions | Once there are enough layers that review stops catching a wrong edge. A spec can read `.nuxt/components.d.ts` and `.nuxt/types/*imports.d.ts`, which map every auto-import to its source file, and fail on an edge the table above forbids. Two layers exporting one auto-imported name only warn during `nuxi prepare`, so the same spec would be the place to fail on that too |
| A shared Nitro cache for `isr` misses | Mount Nitro's `cache` storage on unstorage's `netlify-blobs` driver if misses on cold instances turn out slow. It is Netlify-only, which cuts against the move to Google Cloud |
| Cache windows as constants again | With pages prerendered or held by the CDN, `content.cache` and `articles.cache` only govern the build and `isr` misses. If nothing in production ends up tuning them, they fold back into constants with an `import.meta.dev` switch |
| Parity with the `/lab` pages | Still a human check: the lab is stripped from production builds, and Linux substitutes a serif for Georgia |
