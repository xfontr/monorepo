# 🎨 Huella Legal design

The redesign of [huellalegal.com](https://www.huellalegal.com/) is designed directly in code, as
dev-only pages under `/lab`, and reviewed as real pages in a browser at 390, 768 and 1280 px. There
is no design file. The approved lab pages *are* the design; the production components that later
replace the provisional article pages are built from them, not from a separate handoff.

An earlier Penpot attempt was abandoned: the MCP link was too unreliable to maintain a component
library, and its boards were never reviewed against real rendering. Its token values survived and
are the ones below.

## 🧩 What stays recognizably Huella

| Ingredient | Direction |
| --- | --- |
| Paper | Warm ivory `#F1E9DB` as the page, lighter `#FBF8F2` for fields and panels |
| Ink | Charcoal `#4E4E4E` for text, deep slate `#192630` for headings |
| Primary | Slate blue `#3E5A6D` for links and actions |
| Accent | Teal `#5DA399` as decoration only; `#326C65` whenever teal carries text |
| Type | Georgia for everything read, Montserrat for everything used to navigate |
| Tone | An academic journal, not a law firm: numbered issues, ISSN, hairline rules, no gradients |

## 🚀 Development

| Command | What it does |
| --- | --- |
| `pnpm exec nx serve @monorepo/huella-legal` | Dev server; the lab is at `/lab` |
| `pnpm exec nx build @monorepo/huella-legal` | Production build, which never contains `/lab` |

The lab is stripped from every non-dev build by a `pages:extend` hook under `$production` in
[`nuxt.config.ts`](./nuxt.config.ts). It is the environment switch Nuxt already resolves, so the
config still reads no `process.env` ([`CLAUDE.md`](./CLAUDE.md)). Lab pages use hard-coded Spanish
copy from [`app/lab/fixtures.ts`](./app/lab/fixtures.ts) and never call `@monorepo/content`, so a
design review never depends on WordPress being reachable.

Tailwind's incremental scan in the dev server sometimes misses classes in a newly created file under
`app/lab/` or `app/pages/lab/`. If a fresh page renders with a collapsed grid, touch
[`main.css`](./app/assets/css/main.css) to force a rescan, or restart the server, before debugging
the markup.

## 🗂 Structure

| Path | Role |
| --- | --- |
| [`app/assets/css/main.css`](./app/assets/css/main.css) | Every token: palettes, type scale, measure, and Nuxt UI's semantic roles pointed at them |
| [`app/app.config.ts`](./app/app.config.ts) | Nuxt UI colour aliases and control defaults: 44 px minimum height, paper field surface, and a button theme that darkens on hover, rings outlines in ink and draws the 2 px focus ring the foundations page promises |
| `app/pages/lab/*.vue` | One review page per site archetype: the approved design |
| `app/pages/lab/attempts/*.vue` | The A, B and C pages the approved set replaced, kept for reference |
| `app/lab/*.vue` | Lab-only building blocks shared across those pages; loose on purpose |
| [`app/lab/article-body.ts`](./app/lab/article-body.ts) | The article body as WordPress-style HTML, so the reading styles are tested against CMS output |
| `.hl-prose` in [`app/lab/prose.css`](./app/lab/prose.css) | Reading typography for that HTML: headings, drop cap, notes, quotes, quoted legislation, tables, figures. It styles plain elements and Gutenberg's own wrappers (`wp-block-table`), so production can reuse it on CMS HTML |

## 🎨 Tokens

Palettes are namespaced (`ivory`, `huella-slate`, `huella-teal`, `huella-ink`, `huella-danger`) so
none shadows a Tailwind palette, and each runs 50–950 because Nuxt UI generates all eleven shades
for every alias. Contrast ratios are measured on the canvas; the foundations page computes them
from hex values mirrored from `main.css`, so a token change must be copied there too.

| Role | Token | Ratio on paper |
| --- | --- | --- |
| Headings | `--ui-text-highlighted` → `huella-slate-900` | 12.80:1 |
| Body | `--ui-text` → `huella-ink-700` | 6.90:1 |
| Secondary text | `--ui-text-muted` → `huella-ink-600` | 4.60:1 |
| Links, primary | `--ui-primary` → `huella-slate-500` | 6.03:1 |
| Teal text | `--ui-secondary` → `huella-teal-600` | 5.02:1 |
| Errors | `--ui-error` → `huella-danger-600` | 6.23:1 on `danger-50` |

| Type step | Spec | Use |
| --- | --- | --- |
| `text-display` | Georgia 52/1.08, −0.02em | Homepage statement; 36 px on mobile |
| Page title | Georgia 42/1.06, −0.02em; 56 from `md` | The h1 of every listing, index and utility page. Not a token yet: it is `text-[2.625rem] leading-[1.06] md:text-[3.5rem]` wherever it appears |
| `text-h1` / `h2` / `h3` | Georgia 40 / 30 / 24 | Lead-article titles, section titles and subsection titles, always regular weight |
| `text-reading` | Georgia 18/1.7 | Article body inside `max-w-measure` (680 px, about 70 characters) |
| `text-quote` / `text-citation` | Georgia italic 24 / Georgia 15 | Pull quotes / legal citations and footnotes |
| `text-meta` | Montserrat 400 13 | Date and reading time; author names set it at 600 |
| Kicker | Montserrat 600 12, uppercase, 0.12em | Category labels, section numbers |

### Where the lab departs from the Penpot tokens

The Penpot P5 sheet is deleted, so its deviations are recorded here.

| Token | P5 value | Lab value | Why |
| --- | --- | --- | --- |
| Control / card radius | 8 px / 12 px | 4 px (`--ui-radius`) / 2–4 px | Rounded cards read as an app, not a journal; hairline rules carry the structure instead |
| Focus offset | 4 px | 2 px (set for buttons in `app.config.ts`; Nuxt UI's own is a 3 px ring at 25 % with no offset) | Keeps the ring attached to tight inline links; still a 2 px ring, visible on paper and slate |
| Heading colour | `slate-800` | `slate-900` | More separation from body copy at regular weight |
| Kickers | No automatic uppercase | Uppercase, 0.12em tracking | CSS uppercase keeps Spanish accents; approved at Gate A |
| Canvas | `ivory-100` | `ivory-100` | Unchanged |
| Muted text | Stated as 4.60:1 | Measured 4.60:1 | Unchanged; the ratio was re-measured |

## 🗺️ Site inventory

These pages come from the live site, not from an invented sitemap. They are the approved design:
the benchmark's D set where it proposed a page, and the original A page where it did not.

| Lab page | Archetype | Notes |
| --- | --- | --- |
| `/lab` | Foundations | Colour, type, reading, controls, cards; links to every other lab page |
| `/lab/home` | Homepage | Statement line, lead image beside a numbered "Lo último", three image cards, subjects with formats split out, TFG/TFM band, one publish line; `?menu=1` opens the mobile menu |
| `/lab/article` | Article | The image after the first paragraph, section-only rail, APA 7 and Huella citations, print styles; `?sin-notas=1&sin-imagen=1` previews the common post |
| `/lab/publicaciones` | Archive and subject listing | One listing for the archive and, with `?materia=`, each subject: text rows with a thumbnail from `sm`, accent-insensitive search and format tabs on the archive only |
| `/lab/categorias` | Subject index | Subject, format and tag as three separate axes; A–Z tag index |
| `/lab/category?autor=1` | Contributor profile | Profile header over the contributor's listing. Without `?autor=1` it is A's subject listing, kept only as the attempt `/lab/publicaciones` replaced |
| `/lab/colaboradores` | About + contributors | Mission, three editorial principles, searchable directory with a no-match state |
| `/lab/publicar` | Publish an article | Reasons, five-step process, form, FAQ, TFG/TFM track; `?estado=invalid\|submitting\|success\|error` previews each submission state |
| `/lab/estados` | Utility states | 404, search results, no results, empty subject, server error, loading |

The approved pages keep their benchmark badge, because its "De dónde salen los datos" list is what
the production components need to wire each element to WordPress. D kept A's structure and took
only the B ideas that have data today:
[ADR 0027](../../docs/decisions/0027-huella-legal-content-model.md) found none for series or issue
numbers, and subtopics would first need every post reclassified into child categories.

### Earlier attempts

The pages D replaced stay under `/lab/attempts/` as reference, never as a source for production.
Each set links within itself and falls back to the approved page where it has no version
([`app/lab/variant.ts`](./app/lab/variant.ts)).

| Attempt | Replaced by | What it tried |
| --- | --- | --- |
| `/lab/attempts/home-a` | `/lab/home` | Statement line, lead article beside the Fundamentos series, subject index |
| `/lab/attempts/article-a` | `/lab/article` | Issue number, series position, TOC rail, roman-numbered sections, "Cómo citar", author card, series navigator |
| `/lab/category` | `/lab/publicaciones` | Sort, row cards with image fallback, a pager with a 2 px ink rule on the current page |
| `/lab/attempts/categorias-a` | `/lab/categorias` | Ten areas of law plus the TFG/TFM archive, then tags |
| `/lab/attempts/home-b` | `/lab/home` | Text-first homepage: lead in type, numbered "Lo último", series band, latest by subject, TFG/TFM band, "Del archivo" |
| `/lab/attempts/category-b` | `/lab/publicaciones` | Subtopics, format tabs, result count, text rows grouped by year |
| `/lab/attempts/category-c` | `/lab/publicaciones` | One faceted archive (subject, format, series, year, contributor, search); a subject is a saved filter |
| `/lab/attempts/categorias-b` | `/lab/categorias` | Subject, format, series and tag as four separate axes; A–Z tag index |
| `/lab/attempts/article-b` | `/lab/article` | Margin notes from 1280 px, record rail, running head, citation formats, cited legislation, reply invitation |
| `/lab/attempts/serie-b` | — | Series landing page; there is no series data to fill it |

## 🚦 Review gates

| Gate | Question | Status |
| --- | --- | --- |
| A | Do the foundations feel like Huella? | Approved 29 Sep 2026 |
| B | Which homepage direction? | Approved 29 Sep 2026: A · Revista, opened by B's statement line |
| C | Is the whole site ready at 390 / 768 / 1280? | Approved 29 Sep 2026 |
| D | Which benchmark proposals make it in? | Approved 30 Sep 2026: the D set, A wherever D has no page |

Every lab page is screenshotted at the three widths and checked for overflow, sub-44 px targets
and long-string wrapping before it reaches a gate.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Production components | Rebuild the approved lab pages as components in `app/components/` wired to `@monorepo/content` (issues #28–#35), replace the scoped CSS in `app/pages/articles/*`, then delete `app/pages/lab/`, `app/lab/` and the `$production` hook |
| Copy in i18n | Lab copy is hard-coded Spanish; production copy goes in [`es-ES.json`](../../infrastructure/translations/projects/huella-legal/es-ES.json), keyed per the [README's convention](./README.md#-copy-keys). The site is `es-ES` only |
| Interest calculator | A tool, not editorial design; it keeps the current page until it gets its own design pass |
| Comments | Dropped from the design pending a moderation decision |
| Mid-article newsletter | The current site interrupts articles with repeated sign-up blocks; the redesign keeps one band after the article. Add an inline block only if sign-ups drop |
| Contributor copy | Roles, bios, counts and years in [`app/lab/fixtures.ts`](./app/lab/fixtures.ts) are placeholders on real names; only Raquel Crespo Ruiz's credentials come from the live site. Never copy them into production content |
| Search overlay | The header search button has no overlay design; it goes to the results page shown on `/lab/estados` |
| WordPress block mapping | `.hl-prose` uses `hl-law`, `hl-note` and `hl-num` for quoted legislation, editor notes and section numerals; production maps them to Gutenberg block classes or custom blocks |
| Real imagery | Lab cards use a `§` tile where an image goes; licensed classical legal imagery is chosen per article in the CMS |
| Dark theme | `ui.colorMode` is off; adding one means a second set of `--ui-*` roles and a new contrast pass |
