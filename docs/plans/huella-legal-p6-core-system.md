# 🧱 Huella Legal P6 core system handoff

This is Luna's execution sheet for P6 in [`DESIGN.md`](../../apps/huella-legal/DESIGN.md).
Build the P3 inventory as native, reusable Penpot components and editorial patterns using the
completed [P5 theme](./huella-legal-p5-theme.md). Direction **A · Archivo editorial** is selected.
P6 is already authorized: create the system first, then present Gate 3 for review. A `proposed`
label on the P2 brief is not a reason to stop.

The Penpot file is shown as `Huella Legal` and has pages `04 Components` and `05 Patterns`. P3
already placed `P3 · Baseline decision` and `P3 · Component inventory` on `04 Components`; preserve
both. The P3 baseline uses the shadcn/Radix kit as a **curated anatomy reference** for generic
controls. No kit asset was copied, and no library or kit tokens should be imported. Nuxt UI is the
code behavior baseline; all future code ownership stays in `apps/huella-legal`, with zero
`@monorepo/ui` mappings.

## 🧭 Work order

| Step | Luna's action | Required readback |
| --- | --- | --- |
| 1 | Connect the official Penpot MCP to the open `Huella Legal` file. Read the current page list, `04 Components`, `05 Patterns`, local component inventory and active token theme. Use the P5 token JSON in the private archive as a read-only reference. | `Huella / Light` is active; the three P5 sets and six `F00`–`F05` boards remain present. The two P3 boards remain untouched. Do not repeat P0–P5 research. |
| 2 | Inspect existing P6 work by **component ID and name**. If a complete asset already exists, extend it; if a failed earlier batch left a partial object, remove only the verified partial ID. | No duplicate component names, orphan children or overwritten P3 boards. |
| 3 | On `04 Components`, create the 18 masters below in dependency order: controls → navigation → discovery/authorship → reading/chrome. Use native Penpot flex or grid; make each reusable and create at least two instances for inheritance testing. | Changing one harmless master property updates its instances; restore the intended value afterward. Board labels are not substitutes for real components. |
| 4 | On `05 Patterns`, create the seven masters below, composed from P6 components where relevant. | Each pattern is a local reusable asset, with native flex/grid and linked child instances. |
| 5 | Populate the component and pattern specimen boards specified below. Use 1280 px desktop and 390 px mobile examples, plus one 768 px constraint check. | Relevant default, focus, error, loading, missing-content and long-content examples are visible; no manual child positioning inside reusable flex/grid assets. |
| 6 | Inspect a representative fill, text style, gap, radius, border and focus treatment. Render every board, fix clipping and unreadable states, and record only concrete deviations from the P5 tokens. | Native bindings and component instances survive export/readback; desktop and mobile renders are legible. |
| 7 | Save a named Penpot version `P6 — Core system — 25 Sep 2026`. Export board renders and a concise component index to `design-archive/p6` outside the repository. Leave `C00 — System review` open and report the completed inventory and any real limitation. | Gate 3 can review one board and inspect the detailed boards. Do not require a local `.penpot` download; the user waived it for this design pass. |

Use small MCP write batches, one asset family at a time, and return only IDs and counts from
structural reads. Penpot follows the currently focused page, so recheck it before every write batch.
Do not ask for a new P2 or P4 approval, and do not ask whether to proceed to P6. Ask only if the
target file is inaccessible or a required MCP operation repeatedly fails after a bounded retry.

## 🎛️ Shared construction rules

| Concern | Exact rule |
| --- | --- |
| Naming | Master name is the **Design asset** in the tables below. Instances keep meaningful context names, such as `Header / article / mobile`; specimen boards use `C` and `P` prefixes. |
| Layer anatomy | Give nested layers role names: `root`, `surface`, `label`, `icon`, `description`, `action`, `media`. Avoid anonymous rectangles and text layers. |
| Layout | Use flex for rows/stacks and grid for card collections. Apply tokenized gaps and padding after enabling layout. Children use fill/hug/min/max constraints rather than fixed x/y placement. |
| Reuse | Make one source per design asset. Use variants for real state/structure axes; use text/image overrides for content. Do not duplicate a whole component to change its title. |
| Text | Bind editorial copy to `huella.type.*` and interface copy to `huella.type.nav`, `.label`, `.metadata` or `.caption`. Do not create parallel unbound text styles. |
| Colour | Use semantic `ui.*` and `huella.*` colours. `ui.color.accent.default` (`#5DA399`) is decorative; use `ui.color.accent.text` for teal text. |
| Focus | Show keyboard focus as `ui.color.focus` + `ui.border.focus` (2 px) with `ui.focus.offset` (4 px). On dark controls, add a white separator. Focus is visible independently of hover. |
| Targets | Interactive controls and icon buttons have at least `ui.size.control.min-height` = 44 px; icon buttons are at least 44 × 44 px. |
| Corners | Controls `ui.radius.control` (8 px), cards `ui.radius.card` (12 px), pills `ui.radius.pill`. |
| Elevation | Prefer borders and spacing. Apply `ui.shadow.card` or `.overlay` only where elevation is needed. Inspect rendered opacity: the P5 JSON resolves shadow colour as `#23333f` without alpha although its source value contains alpha. If it renders opaque, correct the token's opacity before reuse and record the correction on F04. |
| Icons | Draw only menu, close, search, chevron and external-link symbols as simple native 20 px vector strokes. Do not import a large kit icon library. All icon-only controls need a specimen label explaining the future accessible name. |
| Code mapping | Add a short note on each specimen: design asset → exact `apps/huella-legal` code name and Nuxt UI direct/composition or Huella-specific mapping below. This is a design handoff, not production Vue work. |

The P5 Penpot catalogue uses `.default` where a token also has child variants. Bind to the **actual**
names `ui.color.primary.default`, `ui.color.text.default`, `ui.color.surface.default`,
`ui.color.border.default`, `ui.color.danger.default`, `huella.type.body.default`,
`huella.type.display.default`, `huella.type.heading.1.default` and
`huella.measure.article.default`. Do not create the shorter names from the original P5 proposal.
Read the active catalogue if a binding fails; do not substitute a literal hex or a new token.

## 🧩 Component masters

Create these **18** local Penpot components on `04 Components`. The anatomy column names required
children, not just a visual impression. For state examples, use the same master/variant family and
show an instance per listed representative state. All code names are future `apps/huella-legal`
ownership, even when the implementation maps directly to Nuxt UI.

| # | Design asset → code map | Anatomy and layout | Required variants and specimen states |
| --- | --- | --- | --- |
| 1 | `Button` → `UButton` direct | Label, optional 20 px leading/trailing icon, flex row, 8 px gap, 16 × 12 px padding, 44 px min height. Primary fill `ui.color.primary.default` and white label. | Primary, secondary (surface + strong border), ghost, link; default, hover, focus, active, disabled, loading. Loading keeps width stable. |
| 2 | `Icon button` → `UButton` direct | 44 × 44 px target, centered 20 px icon; no empty text node. | Menu, search, close; default, hover, focus, disabled. Label future accessible names: `Abrir menú`, `Buscar`, `Cerrar`. |
| 3 | `Text link` → `ULink` direct | Text and optional external icon, inline layout; `huella.color.article.link`, underline for in-body use. | Editorial inline, navigation, external; default, hover, focus, visited editorial, current navigation. Colour alone never signals state. |
| 4 | `Form field` → `UFormField` + `UInput`/`UTextarea` | Label, required marker when applicable, input surface, optional help and error; vertical 8 px gap; input min 44 px. | Single line, multiline; empty, filled, focus, invalid, disabled, help. Error uses `ui.color.danger.default` and `.border`. |
| 5 | `Site header` → `SiteHeader.vue`, `UHeader` + `UNavigationMenu` + `UButton` | Brand, links `Publicaciones`, `Materias`, `Autores`, `Contacto`, one secondary action; desktop flex row, mobile brand + menu icon. | Desktop, mobile closed/open; current section, focus, long label. Mobile panel is part of this master. |
| 6 | `Breadcrumbs` → `AppBreadcrumbs.vue`, `UBreadcrumb` | Linked ancestors, chevrons, final current item; flex wrap with clear current marker. | Two-level, long path, mobile wrap; hover/focus on linked ancestors. |
| 7 | `Article pagination` → `ArticlePagination.vue`, `UPagination` + route adapter | Previous, numbered/current, next; 44 px targets; text or accessible icon labels. | First, middle, last, loading, focus. Annotate bare `/articles` for page 1, `?page=N` after, real prev/next URLs and `rel` behavior. |
| 8 | `Search control` → `ContentSearchForm.vue`, `UForm` + `UInput` + `UButton` | Search label, input, submit action, status line; row desktop, stack mobile. | Empty, typing, loading, results, no results, error. Do not invent a backend result contract. |
| 9 | `Newsletter signup` → `NewsletterSignup.vue`, Nuxt UI form composition | Monthly-digest heading, email field, submit action, privacy/helper line and status region. | Desktop inline, mobile stacked; default, invalid, submitting, success, failure. Avoid promising delivery or storage behavior. |
| 10 | `Category badge/link` → `CategoryLink.vue`, `UBadge` + `ULink` | Label in pill; linked version has a full 44 px hit area beyond the visible pill if needed. | Static, linked, hover, focus, current, long category label. |
| 11 | `Article metadata` → `ArticleMeta.vue` | Date, category, reading time in wrapping flex row with separators only between present items. | Full, compact, missing date/category, narrow wrap. |
| 12 | `Author byline` → `AuthorByline.vue` | Optional avatar, name(s), role; flex row that wraps without losing authorship order. | One/two/three authors, avatar/no avatar, long names. |
| 13 | `Featured article card` → `FeaturedArticleCard.vue` | Media, category, `huella.type.heading.2` title, excerpt, metadata, author, reading action; grid desktop, stack mobile. | Image/no image, long title, multiple authors, hover, focus. Avoid nested links from the card and its category/author links. |
| 14 | `Article card` → `ArticleCard.vue` | Optional thumbnail, category, `huella.type.heading.3` title, excerpt, metadata; compact version removes excerpt. | Standard, compact, image/no image, long title, multiple authors, hover, focus. |
| 15 | `Contributor summary` → `ContributorSummary.vue` | Optional portrait, name, role, bio, profile link; row/card layout. | Card, inline, no avatar, missing bio, long bio. |
| 16 | `Article table of contents` → `ArticleToc.vue`, mobile `UAccordion` | `En este artículo`, nested H2/H3 links, active marker; desktop side rail, mobile disclosure. | Desktop sticky, mobile closed/open, active heading, 12+ dense headings, long wrap. |
| 17 | `Site footer` → `SiteFooter.vue`, `UFooter` + `ULink` | Brand line, grouped navigation, legal links, closing line; grid desktop, stack mobile. | Desktop, mobile, long labels, link hover/focus. |
| 18 | `Utility state` → `UtilityState.vue`, `UEmpty`/`UError` | Heading, explanation, optional action and simple icon; centered constrained stack. | Initial search, no results, empty listing, 404, server error, loading, retry; distinct copy per state. |

Use P5 bindings consistently: text `ui.color.text.default`, headings
`ui.color.text.strong`, muted details `ui.color.text.muted`, canvas `ui.color.canvas`, card
`ui.color.surface.default`, borders `ui.color.border.default` or `.strong`, control padding
`ui.space.control.x/y`, card padding `ui.space.card`, and section spacing
`ui.space.section.mobile/desktop`. Use `huella.measure.article.default` for reading content,
`ui.container.max` for the site shell and `ui.container.content` for ordinary content. A variant
may add a semantic treatment; it must not fork a palette or spacing scale.

## 📚 Editorial pattern masters

Create these **seven** local Penpot pattern components on `05 Patterns`. Patterns are reusable
compositions, not full page templates. Assemble from component instances where there is overlap.

| # | Design pattern → code map | Required anatomy and example |
| --- | --- | --- |
| 1 | `Page intro` → `PageIntro.vue` | Optional kicker, H1, description, optional one action; constrain to `ui.container.content`. Show a 90-character title, two-line description, no-kicker case and 390 px wrap. |
| 2 | `Article body` → `ArticleBody.vue` | 680 px reading measure, paragraphs, H2/H3, ordered/unordered lists, table with horizontal overflow treatment, inline/external links, footnote and dense headings. Use real Spanish legal prose; show 390 px instance. |
| 3 | `Editorial callout` → `EditorialCallout.vue` | Optional title, body and link in `huella.color.article.callout` with border; note, context, caution variants. Caution uses danger semantics only for an actual warning. |
| 4 | `Pull quote` → `PullQuote.vue` | `huella.type.quote` text, `huella.border.quote` leading rule, optional attribution; show long quote and multiline attribution. |
| 5 | `Editorial figure` → `EditorialFigure.vue` | Media rectangle, optional caption and credit; image and illustration variants. Annotate alt-text decision for informational images and empty alt for decorative media. No unlicensed stock imagery. |
| 6 | `Legal citation` → `LegalCitation.vue` | Inline, block, footnote and backlink variants with `huella.type.citation` and `huella.color.article.citation`; show long multi-reference citation wrapping at 390 px. |
| 7 | `Contribution form` → `ContributionForm.vue`, Nuxt UI form composition | Name, email, work type (`Artículo`, `TFG`, `TFM`), title, message/abstract, consent, submit; desktop two-column groups and mobile stack. Show default, invalid, submitting, success, server failure. Validation, privacy copy and API are later implementation decisions. |

## 🖼️ Specimen boards

Keep the P3 boards where they are. Create these native boards after the masters exist. Lay out
specimens as component instances with labels and short design-to-code annotations. The board may
have a fixed canvas size; its specimens use flex/grid constraints.

| Page and board | Contents |
| --- | --- |
| `04 Components` → `C00 — System review` | Compact 1280 px and 390 px editorial composition using **instances** of header, breadcrumbs, featured card, article card, TOC, action and footer, plus form field and focus. This demonstrates the system, not the P7 template. |
| `04 Components` → `C01 — Controls and states` | Button, icon button, text link, form field, search, newsletter and category specimens with state labels and 44 px targets. |
| `04 Components` → `C02 — Navigation and chrome` | Header desktop/mobile open/closed, breadcrumbs, pagination first/middle/last, footer desktop/mobile. |
| `04 Components` → `C03 — Discovery and authorship` | Featured/standard/compact cards, metadata, byline, contributor, and missing media/multiple-author/long-title cases. |
| `04 Components` → `C04 — Reading and utility` | TOC desktop/mobile, utility-state examples, long heading hierarchy and focus links. |
| `05 Patterns` → `P01 — Editorial reading` | Page intro, article body, callout, pull quote, figure and citation at desktop and 390 px. |
| `05 Patterns` → `P02 — Participation` | Newsletter instance and contribution form desktop/mobile with invalid, submitting, success and failure states. |

Use these fixed stress strings so specimens are comparable: title
`La responsabilidad de las plataformas digitales ante decisiones automatizadas que afectan a
derechos fundamentales`; authors `María-José Fernández Ruiz`, `Alejandro de la Vega Pérez` and
`Lucía Martín Salcedo`; category `Derecho digital y garantías constitucionales`; citation
`STC 76/2019, de 22 de mayo, FJ 5; DOUE L 119, de 4 de mayo de 2016, pp. 1–88`.
Use a neutral placeholder for missing media, not a broken image icon.

## ✅ Acceptance and review

| Check | Evidence Luna must produce |
| --- | --- |
| Inventory | Exactly 18 named component masters and seven named pattern masters, with the two P3 and six P5 boards preserved. If a P3 item is omitted, explain its concrete absent use case before omission. |
| Reuse | At least two instances per master; one controlled master edit propagates to instances. Pattern child instances remain linked. |
| Layout | Desktop 1280, mobile 390 and tablet 768 render without clipping, overlap or horizontal overflow except documented article table scroll. |
| Binding | Representative instances expose P5 token bindings for fill, text, spacing, radius, border and focus; no extra token catalogue or kit import. |
| States | Focus, disabled, loading, invalid, success, empty and long-content cases appear on relevant boards; interactive targets are at least 44 px. |
| Ownership | Index maps each asset to `apps/huella-legal` and P3 Nuxt UI direct/composition or Huella-specific choice; `@monorepo/ui` mappings remain zero. |
| Handoff | Seven boards rendered and checked, index archived, named Penpot version saved, `C00 — System review` left open for Gate 3. Report known limitations without requesting implementation decisions. |

Gate 3 asks whether the theme and representative system feel right **after** the deliverables are
reviewable. If the user requests changes, update masters and let instances inherit before moving
to P7. The design can state intended keyboard and screen-reader behavior, but only the later Nuxt
implementation can verify it in a browser.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Page templates | P7 assembles these instances into the seven agreed archetypes and validates full responsive page flow. |
| Code and API behavior | Nuxt UI configuration, WordPress HTML handling, search, newsletter transport, contribution submission and routed pagination are implementation work in `apps/huella-legal`. |
| Accessibility verification | Browser testing checks keyboard operation, screen readers, focus management and reduced motion against documented design states. |
