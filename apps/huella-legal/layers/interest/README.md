# 🧮 interest

The interest calculator at `/calculo-intereses/`: simple interest on a debt at the legal, judicial or
a custom rate, plus a table of calculations kept in the reader's browser. It is a tool few readers
want, on a site built for reading, so it is held to one rule: it costs no other page anything.

| Built by |
| --- |
| AI, with no human supervision |

## 🗂 Structure

| Path | What it is |
| --- | --- |
| [`pages/calculo-intereses.vue`](./app/pages/calculo-intereses.vue) | The page: the calculator, then the WordPress page `calculo-intereses` as its guide, through the core's `GET /api/pages/:slug` and `ArticleProse`. Prerendered, per [0028](../../../../docs/decisions/0028-huella-legal-urls-and-cutover.md) |
| [`InterestCalculator`](./app/components/InterestCalculator.vue) | Two `UTabs`, *Sencilla* and *Avanzada*, over the private parts below. Owns the arithmetic and the history. Hidden tabs stay mounted, so switching keeps each tab's fields |
| `InterestCalculatorForm` | The legal and judicial presets and two native date inputs |
| `InterestCalculatorAdvancedForm` | Adds a custom rate, a concept and each date as separate day, month and year fields, so a monthly debt changes one field per row |
| `InterestCalculatorResult` | The euros, inside a live region that stays mounted so the first result is announced. *Añadir a la tabla* gives way to a focused confirmation |
| `InterestCalculatorHistory` | The shared table: an editable concept per row, totals summed in cents, a two-press clear, and a copy as tab-separated plain numbers for a spreadsheet |
| [`useInterestHistory`](./app/composables/useInterestHistory.ts) | The table's rows in `localStorage`, read after mount so the prerendered page hydrates. A stored row [`interestEntrySchema`](./app/schemas/interestEntry.ts) rejects is dropped |
| [`useInterestRateOptions`](./app/composables/useInterestRateOptions.ts) | The rate radios, each preset labelled with its percentage in the reader's locale |
| [`app/schemas/`](./app/schemas) | The two forms' Valibot rules, worded by the caller through `t()` |
| [`app/utils/interest.ts`](./app/utils/interest.ts) | `calculateInterest`, in cents over actual days and a 365-day year. `INTEREST_RATES` holds the presets, `calendarDate` refuses a day that doesn't exist, and `parseDecimal` reads a number as a Spanish reader types it |

The layer's `nuxt.config.ts` keeps the four form parts out of auto-registration, as
`NewsletterForm` is, so only `InterestCalculator` is public. The arithmetic runs in the browser, so
there is no `server/`.

## 📝 The guide

The guide is editorial copy, so it lives in WordPress, where the owner edits it, and not in the
translations. The WordPress page holds only that copy: the old jQuery calculator is gone from it,
and the app's own heading stands above the calculator, so the page's title is never rendered.
`calculo-intereses` is in `pageSlugs` only so that `GET /api/pages/:slug` will read it; the static
route wins over `/:slug/`. If WordPress fails, the page renders the calculator without the guide
rather than failing, which `calculo-intereses.spec.ts` pins.

## ⚡ What the rest of the site pays

| Cost | On other pages |
| --- | --- |
| The page's JS (Valibot, `UTabs`, `URadioGroup`, the forms) | Nothing. It is one route chunk that only the router imports |
| The footer's *Calculadora de intereses* link | Nothing. It is the one link with `prefetch: false`, in [`useSiteNav`](../../app/composables/useSiteNav.ts), so a pointer crossing it on the way down fetches neither the chunk nor its `_payload.json`. `e2e/interest.spec.ts` pins it against a neighbour that does prefetch |
| Copy under `interestCalculator.*` | 0.8 kB brotli of the 7.1 kB `messages.json` every page fetches once hydration starts: the labels and errors, 10 % of the locale. The guide is in this page's HTML and payload only |
| Tailwind utilities only this layer uses | ~0.2 kB brotli (2 kB raw) of the stylesheet inlined into every HTML response |
| `nav.interestCalculator` in [`app.config.ts`](./app/app.config.ts) | One route object |

The copy is the locale document compressed with and without `interestCalculator`; the utilities
are a production build against one with this layer kept out of Tailwind's scan.

## ✅ Validation

Nothing validates before the first submit. Validating on blur rendered the error under a field on
`mousedown`, which pushed *Calcular* out from under the pointer before `mouseup`, so the first
click did nothing. Once a submit has failed, every edit revalidates the whole form and
`FormErrorSummary` follows the form's live errors, so a fixed field drops off at once and an
order error clears whichever date moved.

Amounts and the custom rate are text inputs with `inputmode="decimal"`, never `type="number"`. Typed
into a number input in Chrome, `1.000` became 100 and `1.000,50` became 100.5, with no error, so a
Spanish reader got a result for the wrong debt. `parseDecimal` treats a dot before groups of three
digits as a thousands separator in an amount, a comma as the decimal point, and refuses anything
ambiguous, such as `1,000.50`, rather than guess.

Each date in the advanced form reports one issue, on its day field, so the summary links to the
first of its three inputs. Every part shares that issue through `errorPattern`, so all three are
`aria-invalid` and each one's description reads it out. An incomplete date and one that doesn't
exist get different messages, since a two-digit year is the usual mistake.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| The labels out of every page's messages | `@nuxtjs/i18n` serves a locale as one `messages.json`. Moving `interestCalculator.*` into its own document, imported by the page and merged with `mergeLocaleMessage` when it mounts, would need a second locale file for this layer, for 0.8 kB |
| The utilities out of the global stylesheet | `@source not` on this layer in `main.css`, plus a page-scoped stylesheet. A `@reference` to `main.css` inherits that `@source not`, and negation always wins, so the design layer's tokens would have to move into a file of their own first. Nuxt UI's `componentDetection` still sees `URadioGroup` here either way |
| A calendar picker | `UCalendar` in a `UPopover` loads floating-ui and makes the usual case, a start date years back, a dozen clicks through the years. Typing is faster, and the native date input already opens the platform picker on a phone. `UInputDate` is the one worth trying, as a replacement for the advanced form's three number fields: Reka's segmented field gives the same one-segment edit with a single control, at the cost of `@internationalized/date` on this page and `CalendarDate` values in the schema |
| Rates that change within the period | One rate covers the whole range. The guide tells the reader to split by year and sum in the table, which is what a per-year rate table would automate |
