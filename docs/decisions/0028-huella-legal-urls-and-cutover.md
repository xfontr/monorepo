---
issue: 188
status: to-implement
decision: accepted
---

# 🧭 Huella Legal's URLs, SEO and cutover

## Context

S4 in [the implementation plan](../plans/huella-legal-implementation.md) asks for the new route
scheme, a 301 for every indexed WordPress permalink, the move of WordPress to another hostname and
who makes it, the source of canonical tags, sitemap, robots, JSON-LD and RSS, what replaces the
analytics and cookie banner, and where the interest calculator goes. The lean was Spanish slugs and
a 301 map. [0027](./0027-huella-legal-content-model.md) settled the content model and handed S4 the
inventory and the absolute URLs in post bodies.

## Result

The live site was probed on 29 Sep 2026. Yoast's sitemap index lists 101 posts, 20 pages and 42
author archives, but it isn't the whole inventory. REST adds 4 `noindex` posts and 1 `noindex` page,
all of which answer 200. Category and tag archives are `noindex` and appear in no sitemap, yet every
page links to them. **The inventory is REST's posts, pages, categories, tags and users, plus the
fixed families in the table.** Every permalink sits at the root, ends in a slash and lives on `www`.
The apex already 301s to `www`, and `www` stays the host.

**The lean holds for archives and is overturned for posts.** Posts keep `/<slug>/`. No post slug
collides with a page, a term or a new route, so the 105 citable URLs need no redirect, and the 53
bodies that link to other posts by absolute URL keep resolving. Canonical URLs keep the trailing
slash. Netlify matches a `_redirects` rule whether or not the path ends in a slash, so a rule that
only adds or strips the slash loops.

| Old path | Count | New | How |
| --- | --- | --- | --- |
| `/<post>/` | 105 | Same | `[slug]` route: the post by slug, else the page |
| `aviso-legal`, `contacto`, `sobre`, `empieza-aqui`, `recursos`, `chupitos-de-derecho`, `consulta-legal-gratis`, `listado-de-preguntas-y-respuestas`, `suscripcion` | 9 | Same | Same `[slug]` route, C6 template |
| `recursos/conecta` | 1 | Same | Its own page file, the only nested page kept |
| `/`, `/publicaciones/`, `/colaboradores/`, `/calculo-intereses/` | 4 | Same | App pages replace the WP pages |
| `/categorias/` | 1 | `/materias/` | 301 |
| `/Categoria/<slug>/` | 14 | `/materias/<slug>/` | 301, one splat rule |
| `/Etiqueta/<slug>/` | 35 | `/etiquetas/<slug>/` | 301, one splat rule |
| `/author/<slug>/` | 42 | `/colaboradores/<slug>/` | 301, one splat rule |
| `/publicar-mi-articulo/` and its child `publicar-tfm-tfg-derecho/` | 2 | `/publicar/` | 301 |
| Its grandchild `trabajos-de-fin-de-grado-y-master-publicados/` | 1 | `/etiquetas/trabajos-de-fin-de-grado/` | 301 |
| `/noticias/`, `/page/2/` to `/page/20/` | 20 | `/publicaciones/` | 301 |
| `/feed/`; `/comments/feed/` | 2 | `/feed/` | Server route; the comments feed 301s to it |
| `/sitemap_index.xml`, `/post-`, `/page-`, `/author-sitemap.xml` | 4 | `/sitemap.xml` | 301 |
| `/?s=<q>` | — | `/buscar/?q=<q>` | Middleware: `routeRules` can't match a query |
| `/wp-content/uploads/**`, `/wp-admin/**`, `/wp-login.php`, `/wp-json/**` | — | The WP host | Middleware 301: the host is runtime config |
| `/testposts/`, `/area-privada/`, `/<post>/feed/`, `/Categoria/<slug>/page/<n>/`, `/?p=<id>` | — | Dropped | 404; `?p` gets the home page |

| Concern | Live today | Decided |
| --- | --- | --- |
| Canonical, `og:url` | Yoast, on the WP host | `NUXT_PUBLIC_SITE_URL` + the entry's own path, never the request's, ending in `/` |
| Sitemap, `noindex` | Yoast's index; every term archive `noindex` | Hand-rolled: posts, kept pages, materias, colaboradores. A post or page with `seo.noindex` is left out and gets a robots `noindex` meta. Materias and colaboradores are indexed and ignore `Term.seo.noindex`, which Yoast set for WP's theme archives; etiquetas stay `noindex` |
| Robots | Yoast block, allow all | Allow all plus the sitemap on the canonical host; `Disallow: /` on any other host, so previews stay out |
| JSON-LD | Yoast's `ScholarlyArticle` graph | Generated: `ScholarlyArticle` with authors and dates, `isPartOf` a `Periodical` carrying the ISSN |
| Scholar tags | None | `citation_title`, `citation_author`, `citation_publication_date` (Google Scholar's three required), `citation_journal_title`, `citation_issn` |
| RSS | Site, comment, per-post and per-term feeds | `/feed/` only, hand-rolled |
| Analytics | GA4 through Site Kit, loaded in `<head>` before any consent | The same GA4 property, ID from `NUXT_PUBLIC_ANALYTICS_ID`, injected only after consent. Unset means no GA and no banner |
| Cookie banner | CookieLawInfo, five categories, GA not gated | In-app banner, consent kept in a first-party cookie. No lab design exists |
| Legal pages | Cookies and privacy are sections of `/aviso-legal/`; privacy cites the repealed LOPD 15/1999 | The footer's three legal links target that page's heading ids. The text is content, rewritten in WP under S3 |
| Interest calculator | jQuery inside the page's `content`, with 3% and 5% hard-coded | App page at `/calculo-intereses/`. 0027's sanitiser strips the script, so WP can't render it |

Line numbers are as of this report, in `apps/huella-legal/`:

| # | File | Change |
| --- | --- | --- |
| 1 | `nuxt.config.ts:52` `runtimeConfig.public` | Add `site: { url: "" }` and `analytics: { id: "" }` |
| 2 | `nuxt.config.ts` | `routeRules` for every 301 row, each with `statusCode: 301`; `experimental.defaults.nuxtLink.trailingSlash: "append"` |
| 3 | `.env.example:8`, `README.md:52` | `NUXT_PUBLIC_SITE_URL` (the `www` origin) and `NUXT_PUBLIC_ANALYTICS_ID` |
| 4 | `app/pages/[slug].vue`, `app/pages/recursos/conecta.vue` (new) | `getEntry("posts")`, then `"pages"`, else 404. Canonical from the entry's slug |
| 5 | `server/middleware/legacy.ts` (new) | 301s: `/?s=` → `/buscar/?q=`, and the four WP prefixes → `content.vendor.baseURL` + the same path |
| 6 | 0027's change 10, `server/utils/` | Absolute URLs on either host: `/wp-content/uploads/` goes to the WP host, anything else becomes root-relative |
| 7 | `server/routes/sitemap.xml.get.ts`, `robots.txt.get.ts`, `feed.get.ts` (new) | As in the second table |
| 8 | `shared/` beside A3's mappers | JSON-LD and `citation_*` from `Article`, set from the article page's controller |
| 9 | `app/components/shell/` (B3) | Consent banner and the GA loader |
| 10 | `app/pages/calculo-intereses.vue`, `shared/interest.ts` (new) | The calculator, arithmetic in the pure function |

## Options considered

| Option | Why not |
| --- | --- |
| `/publicaciones/<slug>/` for posts, the lean | 105 permanent 301s for citable URLs, a hop on every body link, and a committed list of real slugs. Nothing in the design needs the prefix |
| A Nitro fallback that 301s `/<slug>/` to the prefix | No list, but every stray root path costs a function call and an upstream lookup, all to serve a prefix nobody needs |
| Dropping the trailing slash | Every kept URL needs a slash-only redirect, which loops in `_redirects` and costs a function call in Nitro |
| `/categoria/<slug>/`, lowercasing in place | Netlify's `_redirects` is case-sensitive while Vue Router isn't, so the two disagree about one path; a new word avoids that |
| Proxying `/wp-content/uploads/**` | Every image byte through a function; a `routeRules` proxy can't read the host, which is runtime config |
| WP's "Discourage search engines" for the old front end | It changes robots output on the install whose Yoast robots 0027 maps to `Entry.seo.noindex`. The Cloudflare rule leaves that untouched |
| Cookieless analytics, no banner | A new vendor, and GA4's history starts over |
| Consent Mode with GA always loaded | Sends pings to Google before consent, for modelled data this site doesn't use |
| `@nuxt/scripts`, `@nuxtjs/sitemap`, an RSS library | One script, about 150 URLs and one feed. Each is a dependency check-in for a short server route. Core's `useScript` is a stub without the module |
| Leaving the calculator on WP | Step 5 below sends the WP front end to `www` |
| Mapping `/?p=<id>` | Only `rel="shortlink"` emits it, and it would need a 105-row query map |

## Consequences

This unlocks C's route names (`/publicaciones/`, `/materias/[slug]/`, `/etiquetas/[slug]/`,
`/colaboradores/[slug]/`, `/publicar/`, `/buscar/`), E3 (changes 7–9) and F2. It forecloses one
thing: a future post whose slug equals an app route is shadowed by that route. WordPress won't
stop an editor from creating one. Revisit this if the design ever needs a post URL prefix.

**Order.** Changes 1–3 first, because every absolute URL reads `site.url`. Then 4 with C1, and 5
and 6 before cutover. Change 10 blocks F2 too: the calculator is in the live nav and sitemap. The
hostname move runs in this sequence:

| Step | Role | Action |
| --- | --- | --- |
| 1 | DNS and hosting owner | A new WP hostname on the current origin, with TLS. WP answers on both hosts |
| 2 | Netlify owner | Production and preview env: `NUXT_CONTENT_VENDOR_BASE_URL` → the new host, `NUXT_PUBLIC_SITE_URL` → `www`. The Confirmation walk passes on a preview |
| 3 | DNS owner | `www` and the apex to Netlify, per Netlify's external-DNS page |
| 4 | Hosting owner | `WP_HOME` and `WP_SITEURL` → the new host in `wp-config.php`, or `wp option update` over WP-CLI. Purge LiteSpeed's cache |
| 5 | DNS owner | A Cloudflare redirect rule on the WP host: anything outside `/wp-json/`, `/wp-admin/`, `/wp-login.php`, `/wp-content/` and `/wp-includes/` 301s to the same path on `www`. Purge Cloudflare's cache |

Step 3 comes before 4. With the Site Address moved first, WP answers `www` visitors with a 301 to
the new host, and browsers cache it. Step 4 bypasses Settings → General, because after step 3 the
login form posts to `www`, which is Netlify. Step 5 comes last: before step 4 it loops.

**Tripwires:**
- Nitro defaults a `routeRules` redirect to 307, and the Netlify preset writes 307 into
  `_redirects` as 302. Set `statusCode: 301` on every rule.
- Netlify's CDN serves `_redirects` before Nitro runs, so `nuxi preview` exercises Nitro's runtime
  copy of the rules, not the deployed one. Only the preview walk proves them.
- The preset's `writeRedirects` turns only a trailing `/**` into a splat. Keep every rule to that
  shape.
- After step 4, media `source_url` moves hosts on its own. Bodies don't: old posts carry `www`,
  and new posts will carry the WP host. That is why change 6 matches both.
- `www` doesn't change, so Search Console needs no change of address. Submit `/sitemap.xml` there
  once step 3 is done.
- `EntryQuery.author` from 0027 is a string, but WP's `posts?author=` takes a user ID. The
  `/colaboradores/<slug>/` controller resolves slug to ID through 0027's change 12 index.
- The GA ID, the WP host and every author slug stay out of the repo. The first two are env vars,
  and author slugs come from REST at runtime.
- The `aviso-legal` heading ids come from the pipeline's slugger, so rewording a heading in WP
  breaks a footer link.
- Check the current year's legal and judicial rates before copying the live calculator's 3% and 5%.
- Faro's browser telemetry sits outside the banner. Whether it needs consent is S3's GDPR question.

## Confirmation

| Claim | Check |
| --- | --- |
| Every old permalink gets its declared outcome | A walk over the inventory, built from REST on the WP host plus the fixed families: `curl -so /dev/null -w '%{http_code} %{redirect_url}'` against the preview matches each family's row in the first table — 200, one 301 to a 200, or 404 for the dropped ones |
| Every redirect is permanent | `NITRO_PRESET=netlify pnpm exec nx build @monorepo/huella-legal --skip-nx-cache`, then `test -s apps/huella-legal/dist/_redirects`, `grep -c '' apps/huella-legal/dist/_redirects` equals the rule count in `routeRules`, and `grep -vE '\s301$' apps/huella-legal/dist/_redirects` prints nothing |
| Canonicals come from the entry | E2E: `/<post>/`, `/<post>` and an upper-cased `/<Page>/` all return the same `link[rel=canonical]`: `NUXT_PUBLIC_SITE_URL` + the entry's slug + `/` |
| `noindex` posts say so | E2E: a fake-WP post with `seo.noindex` renders `<meta name="robots" content="noindex">` |
| `noindex` stays out of the sitemap | A spec on `sitemap.xml.get.ts` with a fake-WP entry whose `seo.noindex` is set |
| GA waits for consent | Playwright: no request to the Google tag host before accepting, one after |
| Previews aren't indexable | `curl <preview>/robots.txt` contains `Disallow: /` |
| The old front end forwards | After step 5, `curl -sI` on a post path at the WP host returns 301 to `www`, and `/wp-json/` returns 200 |
| No ID or host is committed | `git grep -nE 'G-[A-Z0-9]{8,}'` finds nothing, and neither does 0027's hostname grep |
