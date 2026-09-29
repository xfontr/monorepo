---
issue: 185
status: to-implement
decision: accepted
---

# 🧭 Huella Legal's content model

## Context

The `/lab` design shows fields that `Entry` doesn't carry: authors with bios and avatars, reading
time, TOC, footnotes, bibliography, citation, issue number, series and a "Más leídas" sort. S1 in
[the implementation plan](../plans/huella-legal-implementation.md) asks where each one comes from,
where each gap gets filled, and how body HTML is sanitised. The lean was app-local mappers. The plan
assumed WordPress exposes nothing beyond core. It turns out to expose several plugins, Yoast among
them, so there's a second question: which plugin output to take.

## Result

The live REST API was probed unauthenticated on 29 Sep 2026: 105 posts, 42 users (all public, each
with at least one post), 14 categories, 35 tags and 21 pages. The recordings stay out of the repo.

**The lean holds for everything derived from body, dates and terms, and is overturned for authors
and SEO.** `WordpressProvider.listEntries` never embeds `author`, and `toEntry` drops
`yoast_head_json`, so no mapper over `Entry` can reach either.

| Plugin output | Plugin | Taken |
| --- | --- | --- |
| `yoast_head_json` on every post, term and user | Yoast SEO | The text fields only: title, description, `robots.index` |
| `simple_local_avatar` on users and embedded authors | Simple Local Avatars | `full`, as the avatar |
| `acf`, empty on every post and user | ACF | No: installed with no fields |
| `google-site-kit/v1` | Site Kit | No: its routes answer 401 |
| `fluentform/v1`, `cookieyes/v1`, `akismet/v1` | Fluent Forms, CookieYes, Akismet | Left to S3 and S4 |

| Design field | Source found | Filled in |
| --- | --- | --- |
| Authors | `_embedded.author`, always one per post; no co-authors plugin | Package: `Entry.authors` |
| Bio | User `description`, non-empty for 33 of 42 | Package: `Author.bio` |
| Avatar | `simple_local_avatar.full` for 27 of 42. The other 15 are hashless default-Gravatar URLs | Package: `Author.avatar`, left unset for the 15 |
| Role | Nothing | Dropped |
| Article count | Nothing on users | App: aggregated from the post index |
| SEO title, description, noindex | Yoast: 48 custom titles, 84 descriptions (71 differ from the excerpt), 4 `noindex` | Package: `Entry.seo`, `Term.seo` |
| Canonical, `og:url`, JSON-LD, breadcrumbs | Yoast, with the WP host in every URL | Not taken; E3 generates them against the new routes |
| Reading time | Word count ÷ 230. Yoast's own figures have a median of 230 wpm, and a strip-tags count lands within 10% of its `wordCount` on 86 of 105 posts | App mapper |
| TOC | h2 (586) and h3 (826); 13 posts already carry heading ids | App pipeline, existing ids kept |
| Footnotes | No `wp-block-footnotes`. Word `_ftn` anchors appear in 1 post and bare `<sup>` numbers in 3 | Dropped; rendered as they are |
| Bibliography | The last heading matching `bibliografía`, `fuentes` or `referencias`, in 56 posts | App pipeline: split from that heading to the end |
| Citation | Authors, title, date, new URL | App mapper |
| Issue "Nº" | Nothing | Dropped |
| Series | No tag or category convention; one two-post run, numbered only in its titles | Dropped |
| Format (B designs) | Category `ensayos`, tag `trabajos-de-fin-de-grado`, the `jurisprudencia-*` tags | App term map |
| Primary category | The first category; 103 posts have exactly one | App mapper |
| `hl-note` | Theme class `contenedor` (13 uses) | App pipeline class map |
| Quote and callout styles | `cita-larga` (53 posts), `cita-corta` (32), `texto-importante` (24), `texto-destacado` | App pipeline class map |
| `hl-law`, `hl-num` | Not in the corpus; no heading is numbered | No source |
| "Más leídas" | No view counts; `orderby=comment_count` answers 400 | Dropped |

No post has a `<table>`. Bodies do carry `<meta charset>` (50 posts), `style=` (9) and empty
`superfontello3-*` icon spans (23 uses). None has `<script>`, `<iframe>` or an `on*` attribute.

**Sanitising runs server-side**, in an app route that also runs the rest of the pipeline and caches
the result. A mapper in `shared/` would also run in the browser, because `useContent` refetches on
client navigation. The library is the rehype stack. Line numbers are as of this report:

| # | File | Change |
| --- | --- | --- |
| 1 | `packages/content/src/core/domain/content.ts:39` `Entry` | Add `authors: Author[]` and `seo?: Seo`. `Author = { id, slug, name, bio?, avatar?: Asset }`, `Seo = { title?, description?, noindex? }` |
| 2 | `content.ts:31` `Term` | Add `seo?: Seo` |
| 3 | `content.ts:66` `EntryQuery` | Add `author?: string`, for C2's author profile |
| 4 | `wordpress/WordpressTypes.ts:24` | `author` under `_embedded`, `yoast_head_json?` on entry and term, a `WordpressUser` type |
| 5 | `wordpress/WordpressProvider.ts:17` | Embed `wp:featuredmedia,wp:term,author`, and send `author` from `query.author` |
| 6 | `wordpress/WordpressHelpers.ts:45` `toEntry`, `toTerm` | Map authors and seo. `seo` exists only when `yoast_head_json` does |
| 7 | `nuxt/runtime/server/utils/request.ts` `parseQuery` | Add `author: toText(query.author)`, for entries only, the way `term` is handled |
| 8 | `nuxt/runtime/composables/useContent.ts` `toRequestQuery` | Serialise `author` |
| 9 | `packages/content/src/index.ts`, `packages/content/README.md` "📄 The domain" | Export `Author` and `Seo`; update the type block |
| 10 | `apps/huella-legal/server/utils/` (new) | Pipeline: `rehype-parse` → class map, drop `meta`, `style` and icon spans, heading ids, TOC and bibliography extraction, image `loading` → `rehype-sanitize` → `rehype-stringify`. The schema is spelled out rather than defaulted: `clobber: []`, `figure` and `figcaption` added, `className` and `id` on `*`, the default's per-tag `className` lists removed (`a`, `code`, `h2`, `li`, `ol`, `section`, `ul`), and `img` gaining `alt`, `width`, `height`, `loading`, `decoding`, `srcSet` and `sizes` |
| 11 | `apps/huella-legal/server/api/articles/[slug].get.ts` (new) | Cached. Builds the provider from `useRuntimeConfig(event).content.vendor` the way `resolveProvider` in `request.ts` does, and returns the `Article` view model |
| 12 | `apps/huella-legal/server/api/authors.get.ts` (new) | Cached. Pages through `posts` at WP's 100 per request (2 requests today), and returns distinct authors with counts |
| 13 | `apps/huella-legal/shared/` (new) | Pure mappers: `Entry` → `ArticleSummary` (reading time, primary category, format), and the citation |

`unified`, `rehype-parse`, `rehype-sanitize` and `rehype-stringify` go into
`apps/huella-legal/package.json`. That is the dependency check-in. `unified` 11.0.5 and `rehype-slug`
6.0.0 already resolve in the workspace, through `@nuxt/ui` → `@nuxt/content` → `@nuxtjs/mdc`.

## Options considered

| Option | Why not |
| --- | --- |
| App-local mappers for authors and SEO | The provider discards both before `Entry` exists |
| A `users` resource, as a third family, for Colaboradores | Every user has a post, so the post index yields the same authors plus the counts `users` lacks. A third family touches `content.ts`, `parsing.ts`, both routes and `useContent` |
| Dropping Yoast | Loses 48 hand-written titles, 71 descriptions that differ from the excerpt, and 4 `noindex` choices |
| Taking Yoast whole (`yoast_head` or all of `yoast_head_json`) | Every URL in it is the WP host, which moves at cutover. `yoast_head` is raw HTML for `<head>` |
| Reading time from Yoast's `twitter_misc` | A formatted Spanish string under a Spanish key |
| Issue "Nº" as the post's ordinal within its year | It renumbers every later post when one is back-dated or unpublished, and that number goes into citations |
| Sanitising at render, in `shared/` or a controller | Ships the parser to the browser and reparses on every client navigation |
| `ultrahtml` 1.7.0 | No dependencies, but its `sanitize` transformer kept `onclick` and a `javascript:` href |
| `sanitize-html` | Safe, but it gives no tree for TOC and bibliography extraction, so the body gets parsed twice |
| `isomorphic-dompurify` | Puts `jsdom` in the server function |
| Hand-rolled regex | Not a sanitiser |

## Consequences

This unlocks A3 and A4, and lets B2 type against `ArticleSummary`. Five pieces of the kit lose their
data: Notes with back-links, SeriesNav, IssueNumber, "Más leídas" and the author role. B1, B6 and C3
drop them, or the design is revised first.

**Order.** Changes 1–9 come first, in one package change, because every app mapper types against
`Entry.authors`. Then 10 and 11 (A4), then 13 (A3). Change 12 lands with C4, which is its only
consumer.

**Findings for the other spikes:**
- **S2.** WP echoes any request `Origin` in `access-control-allow-origin`, with credentials allowed.
  Browser-side search is therefore possible, contrary to the plan.
- **S4.** Yoast's sitemap index answers 200, which makes it the permalink inventory. 47 bodies link
  to uploads by absolute URL on the live host, and 53 link to other posts the same way. Both are
  literal in `post_content`, so they break at the hostname move unless the pipeline rewrites them
  or Nuxt proxies `/wp-content/uploads/**`. The S4 map therefore feeds change 10.
- **Cost.** A 10-post list with embeds is about 550 KB upstream, about 12 KB of it Yoast per post.
  Change 12 pulls every body, about 5.7 MB per fill. WP's `_fields` would cut that, but the
  provider has no such axis yet.

**Tripwires:**
- The recordings hold the live host in every `link`, `guid` and `source_url`, plus real names and
  bios. The fake WP synthesises its data (S5).
- `WordpressProvider.spec.ts:46` and `:88` assert the `_embed` string, and
  `WordpressHelpers.spec.ts:92` compares a whole `Entry` with `toEqual`. `ContentProvider.spec.ts`
  and `content.spec.ts` build `Entry` literals, which a required `authors` fails to typecheck.
  Changes 1 and 5 are expected to break all of them.
- rehype-sanitize's default schema (`hast-util-sanitize` 5.0.2) rewrites every `id` to
  `user-content-<id>`, which breaks the TOC's anchors. It also empties `class` on `h2` and drops
  `figure`, `figcaption`, `loading` and `srcset`. That is why change 10 lists its schema in full.
- `contentKey.ts:13` spreads the query, so `author` is keyed with no change there.
- An embedded author carries `simple_local_avatar` as a falsy value when unset. A hashless Gravatar
  URL is a placeholder, never an avatar.
- Yoast titles already end in a site suffix the editor chose. Use them verbatim, and never append
  the site name again.
- The 4 `noindex` posts stay out of E3's sitemap too.

Revisit this if a co-authors plugin appears, or once comments are designed: 134 already exist.

## Confirmation

| Claim | Check |
| --- | --- |
| `Entry` carries authors and seo from WP | `pnpm exec nx test @monorepo/content`, with `toEntry` specs over an embedded author and a `yoast_head_json` sample |
| No Yoast URL field is read | `grep -nE "canonical\|og_url\|schema\|yoast_head\"" packages/content/src/core/adapters/providers/wordpress/*.ts` finds nothing outside specs |
| The pipeline strips unsafe markup | A spec beside the pipeline in `apps/huella-legal/server/utils/`, with inline `onclick`, `javascript:`, `<script>` and `<meta>` samples |
| The sanitiser never reaches the browser | After `pnpm exec nx build @monorepo/huella-legal`, `grep -rl "user-content-" apps/huella-legal/.output` finds a chunk under `server/` and none under `public/` |
| No endpoint is committed | `git grep -ni` for the live hostname finds nothing, and every spec host is `wp.test` |
