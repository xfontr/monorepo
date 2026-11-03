# 🎨 Huella Legal design

The redesign of [huellalegal.com](https://www.huellalegal.com/) was designed directly in code, as
dev-only pages reviewed in a browser at 390, 768 and 1280 px, and those pages have since been
replaced by the production components. There is no design file: the running site *is* the design,
and this document keeps the tokens and decisions behind it.

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
| `pnpm exec nx serve @monorepo/huella-legal` | Dev server |
| `pnpm exec nx build @monorepo/huella-legal` | Production build |

Tailwind's incremental scan in the dev server sometimes misses classes in a newly created file. If a
fresh page renders with a collapsed grid, touch
[`main.css`](./layers/design/app/assets/main.css) to force a rescan, or restart the server, before debugging
the markup.

## 🗂 Structure

| Path | Role |
| --- | --- |
| [`layers/design/app/assets/main.css`](./layers/design/app/assets/main.css) | Every token: palettes, type scale, measure, Nuxt UI's semantic roles pointed at them, and the base focus ring any element without its own falls back to |
| [`layers/design/app/app.config.ts`](./layers/design/app/app.config.ts) | Nuxt UI colour aliases and control defaults: 44 px minimum height, paper field surface, and a button theme that darkens on hover, rings outlines in ink and draws the 2 px focus ring |
| `.hl-prose` in [`layers/reading/app/assets/prose.css`](./layers/reading/app/assets/prose.css) | Reading typography for that HTML: headings, drop cap, notes, quotes, quoted legislation, tables, figures. It styles plain elements and Gutenberg's own wrappers (`wp-block-table`), so production can reuse it on CMS HTML |

## 🎨 Tokens

Palettes are namespaced (`ivory`, `huella-slate`, `huella-teal`, `huella-ink`, `huella-danger`) so
none shadows a Tailwind palette, and each runs 50–950 because Nuxt UI generates all eleven shades
for every alias. Contrast ratios are measured on the canvas, so a token change needs them re-measured.

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

### Where the design departs from the Penpot tokens

The Penpot P5 sheet is deleted, so its deviations are recorded here.

| Token | P5 value | Value | Why |
| --- | --- | --- | --- |
| Control / card radius | 8 px / 12 px | 4 px (`--ui-radius`) / 2–4 px | Rounded cards read as an app, not a journal; hairline rules carry the structure instead |
| Focus offset | 4 px | 2 px (the base `:focus-visible` rule in `main.css`, restated for buttons in `theme/button.ts` because Nuxt UI's own is a 3 px ring at 25 % with no offset) | Keeps the ring attached to tight inline links; still a 2 px ring, visible on paper and slate |
| Heading colour | `slate-800` | `slate-900` | More separation from body copy at regular weight |
| Kickers | No automatic uppercase | Uppercase, 0.12em tracking | CSS uppercase keeps Spanish accents; approved at Gate A |
| Canvas | `ivory-100` | `ivory-100` | Unchanged |
| Muted text | Stated as 4.60:1 | Measured 4.60:1 | Unchanged; the ratio was re-measured |

## 🚦 Review gates

| Gate | Question | Status |
| --- | --- | --- |
| A | Do the foundations feel like Huella? | Approved 29 Sep 2026 |
| B | Which homepage direction? | Approved 29 Sep 2026: A · Revista, opened by B's statement line |
| C | Is the whole site ready at 390 / 768 / 1280? | Approved 29 Sep 2026 |
| D | Which benchmark proposals make it in? | Approved 30 Sep 2026: the D set, A wherever D has no page |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Interest calculator | A tool, not editorial design; it keeps the current page until it gets its own design pass |
| Comments | Built from Nuxt UI parts without a design pass, in the back matter's style; every comment is held for moderation |
| Mid-article newsletter | The current site interrupts articles with repeated sign-up blocks; the redesign keeps one band after the article. Add an inline block only if sign-ups drop |
| WordPress block mapping | `.hl-prose` uses `hl-law`, `hl-note` and `hl-num` for quoted legislation, editor notes and section numerals; production maps them to Gutenberg block classes or custom blocks |
| Real imagery | Cards fall back to a `§` tile where an image goes; licensed classical legal imagery is chosen per article in the CMS |
| Dark theme | `ui.colorMode` is off; adding one means a second set of `--ui-*` roles and a new contrast pass |
