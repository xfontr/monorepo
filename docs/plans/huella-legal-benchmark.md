# 🔎 Huella Legal benchmark

A comparison of the `/lab` redesign with nineteen well-regarded US essay, science and law
publications, taken on 29 Sep 2026 and aimed at style: typography, taxonomy, listings and article
furniture. Each finding worth trying is built as a variant route next to the approved page, so the
two can be compared in a browser rather than argued about. None of it changes the pages that passed
gates A–C in [`DESIGN.md`](../../apps/huella-legal/DESIGN.md).

On 30 Sep 2026 the D set below was approved and took the place of the A pages it proposes. A, B and
C moved under `/lab/attempts/`; every route and anchor here is the one it has now.

## 🧪 Variant routes

B pages link to one another. Where no B version exists, they fall back to the approved page (see
[`app/lab/variant.ts`](../../apps/huella-legal/app/lab/variant.ts)). Each B page has a badge in the
bottom-right corner that lists what changed and where each new element's data would come from in
read-only WordPress. Anything WordPress core can't supply is flagged in that badge. `?notas=1` opens
it.

| Route | Compare with | Proposal |
| --- | --- | --- |
| `/lab/attempts/home-b` | `/lab/attempts/home-a` | Text-first homepage: an editor's pick set in type beside a numbered "Lo último" list, then the series as its own band, the latest pieces for three subjects, a TFG/TFM band, "Del archivo", and a single publish line in place of the facts block and the two cards |
| `/lab/attempts/category-b` | `/lab/category` | Subject page: subtopics as text links, format tabs with counts, the result count, text-only rows grouped by year with the year in the margin, the subject's series in the header |
| `/lab/attempts/category-c` | `/lab/category` | The other model: one archive with facets (subject, format, series, year, contributor) and accent-insensitive search. A subject page becomes a saved filter. Counts account for the other active facets, and every facet lives in the URL |
| `/lab/attempts/categorias-b` | `/lab/attempts/categorias-a` | One index for four separate axes (subject with subtopics, format, series, tag), with tags as an A–Z index instead of pills |
| `/lab/attempts/article-b` | `/lab/attempts/article-a` | No hero image; the standfirst sits between rules; notes in the margin from 1280 px; a record rail (format, issue, published and revised dates, word count); a running head with reading progress; "Cómo citar" in three formats plus a PDF; "Normas y resoluciones citadas"; an invitation to reply; previous/next within the series |
| `/lab/attempts/serie-b` | — (new) | Series landing page: introduction, numbered readings with standfirsts, total time and status, and a signed editor's note |

The B pages share [`fixtures-b.ts`](../../apps/huella-legal/app/lab/fixtures-b.ts), which has 29
entries:
- The five Fundamentos titles are real, but their dates, issue numbers and credit to Xifré Font are
  placeholders.
- The other pieces by real people are the ones already in `fixtures.ts`.
- Everything else is invented and credited to invented people.

## 🎯 Fit for Huella's readers

The nineteen sites serve academics who browse an archive. Most of Huella's readers are students and
general readers who arrive from search, on a phone, at one article. That puts the article first,
listings second and the home page third. Two facts outrank the benchmark:
- [ADR 0027](../decisions/0027-huella-legal-content-model.md) found no source for series (one run of
  two posts) or issue numbers, and footnotes in only 4 of 105 posts. Subtopics would work as child
  categories, but only after all 105 posts are reclassified.
- Most live posts do carry a featured image.

Neither A nor B fits as it stands, so a D set keeps A's structure and takes only the B ideas that
have data:

| Page | A | B / C | D |
| --- | --- | --- | --- |
| Home | Leans on the Fundamentos series and a facts block | Drops the statement line approved at Gate B, so a first visit never says what Huella is; adds a Series nav item | Statement and lead image, "Lo último", subjects with formats split out, TFG/TFM band |
| Article | First line of the body at 1,102 px on a phone, 1,287 at 1280 | 788 / 743 px, but margin notes, issue, PDF, cited laws and series navigation have no data | 787 / 727 px with the image kept after the first paragraph; APA 7 citation; print styles |
| Listing | Kicker repeats the subject; "Más leídas" has no data | B's subtopics need all 105 posts reclassified; C's five facets cover about 7 posts per subject | One template for archive and subject; search and format tabs only where they have something to filter |

D was built at `/lab/home-d`, `/lab/publicaciones-d`, `/lab/article-d` and `/lab/categorias-d`,
and now lives at `/lab/home`, `/lab/publicaciones`, `/lab/article` and `/lab/categorias`. It applies
the small fixes below, whose line anchors point at the A pages under `attempts/`.

## 🗂 The taxonomy change behind every B page

The best-organised publications keep subject, format, collection and author on separate axes, each
with its own URLs:
- The Law and Political Economy (LPE) blog: Topics × Category (format) × Symposia × Contributor.
- Harvard Law Review (HLR): `/topics/` × `/category/` × Volume/Issue.
- Noema: topic × type.

The A index mixes three axes in one list of eleven "materias". B splits them:

| A "materia" | What it really is | Where it goes in B |
| --- | --- | --- |
| Nine areas of law | Subject | Subject, each with 1–4 subtopics |
| Ensayos jurídicos | Format | Format: Artículo · Comentario · Ensayo · TFG o TFM |
| Trabajos TFG y TFM | Student work | Format, with its own band on the home and index pages, like HLR's "Student Writing" |
| Fundamentos (a homepage block) | Collection | Series, with a landing page, a position on every piece and previous/next |
| Tags | Cross-cutting theme | Kept on the article and in an A–Z index, never in the nav |

The top journals don't facet their topic pages. HLR, the Yale Law Journal (YLJ), Boston Review and
JSTOR Daily use a reverse-chronological list with numbered pages. Only Just Security's tag pages and
Lawfare's search offer real facets. That is why `category-b` stays light (format tabs and
subtopics), while `category-c` shows the facet model at full strength.

## 📏 Reading typography

| Site | Body | Column |
| --- | --- | --- |
| Psyche | Serif 19/34 on `#F4F1EA` | 730 px |
| Noema | Ivar Text 21/31 | 649 px |
| Asterisk | Noe Text 18 on `#FAF8F0`, 265 px note rail | 750 px |
| Works in Progress | Editor 18/27 on `#FFF7F4` | 728 px |
| The New Atlantis | Calluna 20/30 | 672 px |
| Yale Law Journal | Cardo 18, 184 px footnote rail | about 64 rem container |
| Huella A and B | Georgia 18/1.7 on `#F1E9DB` | 680 px (`--container-measure`) |

Huella already sits in the middle of this range, so B changes nothing here. The typography is
not what separates Huella from these sites. The furniture around the text is: margin notes, a
citation block, issue data, series navigation.

## 📋 Patterns, ranked by fit

| Pattern | Seen at | Built in |
| --- | --- | --- |
| Separate subject / format / series / author axes | LPE, HLR, YLJ, Lawfare, Noema, Aeon, Psyche | every B page |
| Notes in the margin, endnotes on narrow screens | Asterisk, YLJ | `article-b` |
| Citation block: formats, stable URL, dates, PDF | Stanford Encyclopedia of Philosophy (SEP), Issues, HLR, Knowable | `article-b` |
| Series landing page, numbered position on each piece | Just Security, YLJ Collections, The New Atlantis | `serie-b`, `article-b` |
| Student work as its own section | HLR "Student Writing", YLJ Fellow Essays | `home-b`, `categorias-b` |
| One-sentence standfirst between rules | Issues, Quanta, Aeon | `home-b`, `article-b` |
| Metadata rail beside the body | The New Atlantis | `article-b` |
| A kicker that says what the page doesn't: format or subtopic, never the page's own subject | HLR, JSTOR Daily, Marshall Project | `ArchiveRow` |
| Result count on listings | Noema, Just Security | `category-b`, `category-c` |
| Lists grouped by year or volume | YLJ, HLR | `category-b` |
| Sources in full after the essay | Knowable "Take a deeper dive", JSTOR "Resources" | `article-b` (legislation and rulings cited) |
| Reply invitation | Issues Forum, Boston Review, Asterisk letters | `article-b` |
| "Best of the archive" block | Noema | `home-b` |
| Running head with progress | The New Atlantis | `article-b` |
| Support prompts once, after the text | Aeon, LPE, Boston Review | already true in A |

## 🔧 Small fixes for the A pages

These sit in approved pages, so they are listed rather than applied. The B pages already avoid
them.

| Where | Problem | Fix |
| --- | --- | --- |
| [`home-a.vue:119`](../../apps/huella-legal/app/pages/lab/attempts/home-a.vue#L119) | Series titles are 21 px tall targets | Stretch the link over the row (`after:absolute after:inset-0` on a `relative` item), as `ArchiveRow` does |
| [`article-a.vue:209`](../../apps/huella-legal/app/pages/lab/attempts/article-a.vue#L209) | The "↩" note return is a 12 × 16 px target | Make the note number the return link, at least 44 px tall |
| [`SectionHeading.vue:33`](../../apps/huella-legal/app/lab/SectionHeading.vue#L33) | On phones "Ver todas" wraps under the title and sits 12 px in from the left edge, because only `-mr-3` is set | `flex-col sm:flex-row` with `-ml-3 sm:ml-0 sm:-mr-3` |
| [`category.vue:136`](../../apps/huella-legal/app/pages/lab/category.vue#L136) | Every row repeats "DERECHO PENAL" on the Derecho penal page | Show format or subtopic in the kicker instead |
| [`category.vue:123`](../../apps/huella-legal/app/pages/lab/category.vue#L123) | "Más leídas" has no data source without a plugin (S1 already expects to drop it) | Remove the option |
| [`category.vue:30`](../../apps/huella-legal/app/pages/lab/category.vue#L30), [`:107`](../../apps/huella-legal/app/pages/lab/category.vue#L107) | Header `md:pb-14` meets the list's `md:py-12`, a 104 px gap before the toolbar | One section gap; B uses `pb-10`/`lg:pb-12` then `pt-6` |
| [`home-a.vue:63–225`](../../apps/huella-legal/app/pages/lab/attempts/home-a.vue#L63) | Five vertical rhythms: `pb-16`, `pb-20`, `py-16 lg:py-20`, `py-20 lg:py-24`, `pb-20` | Two steps: 64/80 px for bands, 48/64 px inside them |
| [`home-a.vue:41`](../../apps/huella-legal/app/pages/lab/attempts/home-a.vue#L41) | "ISSN" is presented as a statistic | Drop the facts block, or move the ISSN to the header strip, where it already is |
| [`categorias-a.vue:45`](../../apps/huella-legal/app/pages/lab/attempts/categorias-a.vue#L45) | Ten areas in three columns leave Abogacía alone on the last row | Nine subjects, as in B, fill the grid |
| [`categorias-a.vue:75`](../../apps/huella-legal/app/pages/lab/attempts/categorias-a.vue#L75) | The TFG band's button uses `rounded-md` against the 4 px `--ui-radius` | `rounded-(--ui-radius)` or a `UButton` |
| [`article-a.vue:119`](../../apps/huella-legal/app/pages/lab/attempts/article-a.vue#L119) | A 21:9 placeholder pushes the first line of the body to about 1,300 px at 1280 | Remove the placeholder when an article has no image, or place the image in the body |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Issue-led homepage (Asterisk, Issues, The New Atlantis) | Only makes sense if Huella groups pieces into real issues. "Nº 04/24" is a per-article serial, so there is nothing to lead with yet |
| PDF per article | `article-b` shows the button; WordPress has no PDF. It needs print CSS plus a generator in S2, or the button goes |
| Contributor index with every title (Asterisk) | A `colaboradores-b` that lists each contributor's pieces inline instead of linking to thin profile pages |
| Forum format: lead essay, named responses, author's reply (Boston Review, YLJ Exchanges) | A fifth format and a thread view; wait until the first reply is actually published |
| Republish and syndicate links (Aeon, Knowable) | Needs a licence decision first, such as CC BY-NC-ND |
| Bilingual edition (Knowable's "Lea en español") | Out of scope while the site is Spanish-first |
| Month and year archive jump (Nautilus) | Worth adding to `category-c` once the archive runs to hundreds of pieces |
| "Edited by" credit on articles (Aeon, Psyche) | Needs a named editor per piece, which the current workflow doesn't record |
