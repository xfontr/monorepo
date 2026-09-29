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
| `app/pages/lab/*.vue` | One review page per site archetype |
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
| `text-h1` / `h2` / `h3` | Georgia 40 / 30 / 24 | Page, section and subsection titles, always regular weight |
| `text-reading` | Georgia 18/1.7 | Article body inside `max-w-measure` (680 px, about 70 characters) |
| `text-quote` / `text-citation` | Georgia italic 24 / Georgia 15 | Pull quotes / legal citations and footnotes |
| `text-meta` | Montserrat 500 13 | Author, date, reading time |
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

These pages come from the live site, not from an invented sitemap.

| Lab page | Archetype | Notes |
| --- | --- | --- |
| `/lab` | Foundations | Colour, type, reading, controls, cards; links to every other lab page |
| `/lab/home` | Homepage | Direction A: statement line, lead article beside the Fundamentos series, subject index; `?menu=1` opens the mobile menu |
| `/lab/article` | Article | Issue number, series position, TOC rail (accordion on mobile), roman-numbered sections, quoted legislation, scrolling table, notes, bibliography, "Cómo citar", author card, series navigator |
| `/lab/category` | Category listing | Sort, row cards with image fallback, pager that marks the current page with a 2 px ink rule (numbers collapse to "Página n de m" on phones); `?autor=1` turns it into a contributor profile |
| `/lab/categorias` | Subject index | Ten areas of law plus the TFG/TFM archive, then tags |
| `/lab/colaboradores` | About + contributors | Mission, three editorial principles, searchable directory with a no-match state |
| `/lab/publicar` | Publish an article | Reasons, five-step process, form, FAQ, TFG/TFM track; `?estado=invalid\|submitting\|success\|error` previews each submission state |
| `/lab/estados` | Utility states | 404, search results, no results, empty subject, server error, loading |

The B routes are proposals from the [benchmark](../../docs/plans/huella-legal-benchmark.md), not
approved design. They link to one another and fall back to the A page where no B version exists;
a badge on each lists what changed and which data WordPress can't supply.

| Variant | Against | Proposal |
| --- | --- | --- |
| `/lab/home-b` | `/lab/home` | Text-first homepage: lead in type, numbered "Lo último", series band, latest by subject, TFG/TFM band, "Del archivo" |
| `/lab/category-b` | `/lab/category` | Subtopics, format tabs, result count, text rows grouped by year |
| `/lab/category-c` | `/lab/category` | One faceted archive (subject, format, series, year, contributor, search); a subject is a saved filter |
| `/lab/categorias-b` | `/lab/categorias` | Subject, format, series and tag as four separate axes; A–Z tag index |
| `/lab/article-b` | `/lab/article` | Margin notes from 1280 px, record rail, running head, citation formats, cited legislation, reply invitation |
| `/lab/serie-b` | — | Series landing page |

## 🚦 Review gates

| Gate | Question | Status |
| --- | --- | --- |
| A | Do the foundations feel like Huella? | Approved 29 Sep 2026 |
| B | Which homepage direction? | Approved 29 Sep 2026: A · Revista, opened by B's statement line |
| C | Is the whole site ready at 390 / 768 / 1280? | Approved 29 Sep 2026 |

Every lab page is screenshotted at the three widths and checked for overflow, sub-44 px targets
and long-string wrapping before it reaches a gate.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Production components | Rebuild the approved lab pages as components in `app/components/` wired to `@monorepo/content` (issues #28–#35), replace the scoped CSS in `app/pages/articles/*`, then delete `app/pages/lab/`, `app/lab/` and the `$production` hook |
| Copy in i18n | Lab copy is hard-coded Spanish; production copy moves to `infrastructure/translations/projects/huella-legal/`. `defaultLocale` is still `en-GB` although the site is Spanish-first, a call to make then |
| Interest calculator | A tool, not editorial design; it keeps the current page until it gets its own design pass |
| Comments | Dropped from the design pending a moderation decision |
| Mid-article newsletter | The current site interrupts articles with repeated sign-up blocks; the redesign keeps one band after the article. Add an inline block only if sign-ups drop |
| Contributor copy | Roles, bios, counts and years in [`app/lab/fixtures.ts`](./app/lab/fixtures.ts) are placeholders on real names; only Raquel Crespo Ruiz's credentials come from the live site. Never copy them into production content |
| Search overlay | The header search button has no overlay design; it goes to the results page shown on `/lab/estados` |
| WordPress block mapping | `.hl-prose` uses `hl-law`, `hl-note` and `hl-num` for quoted legislation, editor notes and section numerals; production maps them to Gutenberg block classes or custom blocks |
| Real imagery | Lab cards use a `§` tile where an image goes; licensed classical legal imagery is chosen per article in the CMS |
| Dark theme | `ui.colorMode` is off; adding one means a second set of `--ui-*` roles and a new contrast pass |
