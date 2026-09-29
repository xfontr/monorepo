# 🎨 Huella Legal P5 theme handoff

This is the execution sheet for P5 in [`DESIGN.md`](../../apps/huella-legal/DESIGN.md).
Luna creates the specified tokens and foundations boards in Penpot; this file supplies the values,
names, bindings and checks so the MCP work is mechanical. Values here are the v1 light theme, anchored
to the four brand colours in the design brief. The user selected **direction A** on 23 September
2026 and asked Luna to execute P5. Use the existing P2 brief as the working baseline even if its
board still says `proposed`; leave that approval label unchanged. An explicit design choice on the
brief or direction A board overrides the corresponding value here.

## 🧭 Execution order

| Step | Luna's action | Readback before continuing |
| --- | --- | --- |
| 1 | Connect the official Penpot MCP to the single open `Huella Legal — Website` tab; read file name, page list, active page, P2 brief and P4 direction A. Update the P4 comparison board's stale direction status to record the user's selection of A. | Confirm the file, P2 content and direction A exist. The P2 `proposed` label and an unfinished P0 checklist are not stop conditions for P5 when the required MCP operations work. Stop only if the target file or source content cannot be identified, or the MCP cannot perform a required write. |
| 2 | Focus `03 Foundations`. Inspect existing token sets, themes, typography assets and boards; retain any non-test work. | Record names of conflicts before creating anything. Do not import a kit's token catalogue: Penpot library token import replaces the file catalogue. |
| 3 | Create sets `01 Tailwind primitives`, `02 UI semantics` and `03 Huella semantics`, in that order. Activate all three in one theme named `Huella / Light`. | Every set is enabled; no duplicate names in active sets. Use the full dotted token names below because set names are not part of token names. |
| 4 | Create all primitive tokens first, then `ui.*` aliases, then `huella.*` aliases and composite typography. Use `{exact.token.name}` for references. | Read each set back and check resolved values, token types and broken references. |
| 5 | Create the six named boards specified below on `03 Foundations` and apply the tokens to actual layers. | Inspect token binding on representative layers; visual similarity without binding does not pass. |
| 6 | Render the boards; check the specified contrast pairs, desktop/mobile measures and long Spanish text. Correct only an objectively failing pair or overflow, then record the changed token and reason on the board. | One screenshot or exported image shows the six boards legibly. |
| 7 | Export token JSON and board renders to the private design archive used at earlier gates. Save a named Penpot version and leave the file on `03 Foundations` with `F00 — Theme review` open. | Reopen/export readback shows the three sets and aliases; report the archive location and review board name without pasting credentials. |

### P5 execution notes

- The user selected direction A and waived the local `.penpot` download because the browser would not download it. The named Penpot version `P5 — Huella / Light — 23 Sep 2026` is the source of truth; the private archive contains the token JSON and six board renders.
- Penpot rejects a token name when it is also a prefix path for another token. Base tokens that have sibling variants therefore use a `.default` suffix (for example, `ui.color.primary.default`); all values and aliases are recorded in the active token sets and the naming adaptation is called out on F01.

Penpot MCP follows the currently focused page, even if another Penpot window receives focus. Verify
the active page immediately before each write batch. Work in batches of one set or one board, then
read back. The official [MCP guide](https://help.penpot.app/mcp/) documents this behavior and its
read/write tools; the [token guide](https://help.penpot.app/user-guide/design-systems/design-tokens/)
documents aliases, composite type, shadow tokens and set order.

## 🎨 Primitive catalogue

Create the following as **Color** tokens in `01 Tailwind primitives`. Numeric suffixes are scale
steps, not opacity. The four exact source colours are `tailwind.ivory.100`, `tailwind.slate.500`,
`tailwind.teal.400` and `tailwind.neutral.700`; adjacent stops support hover, subtle surfaces and
legible text. `tailwind.white` and `tailwind.black` are also Color tokens.
Brace notation in the table is an instruction to create one fully named token per suffix; do not
enter braces in a Penpot token name.

| Token names | Values in the same order |
| --- | --- |
| `tailwind.ivory.{50,100,200,300,400,500,600,700,800,900}` | `#FBF8F2`, `#F1E9DB`, `#E5D8C4`, `#D2C2A9`, `#B9A78B`, `#9B866A`, `#79674F`, `#5B4C3A`, `#3D3328`, `#261F18` |
| `tailwind.slate.{50,100,200,300,400,500,600,700,800,900}` | `#F3F6F8`, `#DCE6EB`, `#B9CDD6`, `#91AEBD`, `#6C90A3`, `#3E5A6D`, `#344E60`, `#2B4050`, `#23333F`, `#192630` |
| `tailwind.teal.{50,100,200,300,400,500,600,700,800,900}` | `#F1F8F6`, `#DDEFEA`, `#BBE0D7`, `#92C7BB`, `#5DA399`, `#43877F`, `#326C65`, `#28554F`, `#20423E`, `#17312E` |
| `tailwind.neutral.{50,100,200,300,400,500,600,700,800,900}` | `#FAFAF9`, `#F2F1EF`, `#E6E4E0`, `#CBC8C2`, `#A8A49D`, `#85817B`, `#6B6863`, `#4E4E4E`, `#363636`, `#242424` |
| `tailwind.danger.{50,100,500,600,700}` | `#FDF4F2`, `#F9E8E4`, `#B84D43`, `#9B3D35`, `#7D302A` |
| `tailwind.white`, `tailwind.black` | `#FFFFFF`, `#000000` |

Create these numeric primitives in the same set. Enter dimensions in `px`. The spacing scale is
Tailwind's four-pixel base with only the steps this site needs; do not create unused intermediate
stops. Penpot has separate Spacing, Sizing, Border Radius and Stroke Width types, so choose the
specified type instead of a generic number whenever possible.

| Type | Token names and values |
| --- | --- |
| Spacing | `tailwind.space.0=0px`, `.1=4px`, `.2=8px`, `.3=12px`, `.4=16px`, `.5=20px`, `.6=24px`, `.8=32px`, `.10=40px`, `.12=48px`, `.16=64px`, `.20=80px`, `.24=96px` |
| Sizing | `tailwind.size.6=24px`, `.8=32px`, `.10=40px`, `.11=44px`, `.12=48px`, `.14=56px` |
| Border Radius | `tailwind.radius.none=0px`, `.sm=4px`, `.md=8px`, `.lg=12px`, `.xl=16px`, `.full=999px` |
| Stroke Width | `tailwind.stroke.hairline=1px`, `.strong=2px`, `.accent=3px` |
| Sizing | `tailwind.breakpoint.mobile=390px`, `.tablet=768px`, `.desktop=1280px` |

Create two **Shadow** composites in this set. Each has one Drop Shadow, with fields in the order
`color / x / y / blur / spread`: `tailwind.shadow.card = rgba(35,51,63,0.10) / 0 / 2 / 10 / 0`;
`tailwind.shadow.overlay = rgba(35,51,63,0.16) / 0 / 8 / 24 / 0`. Do not create a fake “none”
shadow; an unelevated layer simply has no shadow token applied.

## 🧩 Interface semantics

Create these aliases in `02 UI semantics`. The quoted braces are the exact Penpot values. The
default page remains warm ivory, while cards and controls have lighter surfaces. Teal at its brand
value is decorative; text and keyboard focus use the darker teal step.

| Color token | Value | Use |
| --- | --- | --- |
| `ui.color.primary` | `{tailwind.slate.500}` | Primary control and prominent link |
| `ui.color.primary.hover` | `{tailwind.slate.700}` | Hover/pressed control |
| `ui.color.on-primary` | `{tailwind.white}` | Text on primary control |
| `ui.color.accent` | `{tailwind.teal.400}` | Decorative accent only |
| `ui.color.accent.text` | `{tailwind.teal.600}` | Accent link or label on light surface |
| `ui.color.accent.hover` | `{tailwind.teal.700}` | Hover accent text |
| `ui.color.text` | `{tailwind.neutral.700}` | Default body copy |
| `ui.color.text.strong` | `{tailwind.slate.800}` | Headings |
| `ui.color.text.muted` | `{tailwind.neutral.600}` | Secondary copy |
| `ui.color.text.inverse` | `{tailwind.white}` | Text on dark surface |
| `ui.color.canvas` | `{tailwind.ivory.100}` | Page background |
| `ui.color.surface` | `{tailwind.ivory.50}` | Reading panel/card |
| `ui.color.surface.raised` | `{tailwind.white}` | Menu and overlay |
| `ui.color.surface.tint` | `{tailwind.slate.50}` | Quiet secondary section |
| `ui.color.border` | `{tailwind.ivory.300}` | Default division |
| `ui.color.border.strong` | `{tailwind.slate.300}` | Control outline |
| `ui.color.focus` | `{tailwind.slate.700}` | Keyboard focus ring |
| `ui.color.danger` | `{tailwind.danger.600}` | Error text/icon |
| `ui.color.danger.surface` | `{tailwind.danger.50}` | Error background |
| `ui.color.danger.border` | `{tailwind.danger.500}` | Invalid control border |

| Type | Token and alias | Binding |
| --- | --- | --- |
| Spacing | `ui.space.control.gap={tailwind.space.2}`; `ui.space.control.x={tailwind.space.4}`; `ui.space.control.y={tailwind.space.3}` | Icon/label gap and control padding |
| Spacing | `ui.space.card={tailwind.space.6}`; `ui.space.section.mobile={tailwind.space.12}`; `ui.space.section.desktop={tailwind.space.20}` | Card padding and section rhythm |
| Spacing | `ui.space.page.mobile={tailwind.space.4}`; `ui.space.page.tablet={tailwind.space.8}`; `ui.space.page.desktop={tailwind.space.12}` | Horizontal page gutters |
| Sizing | `ui.size.control.min-height={tailwind.size.11}`; `ui.size.icon-button={tailwind.size.11}` | Minimum 44 px target |
| Border Radius | `ui.radius.control={tailwind.radius.md}`; `ui.radius.card={tailwind.radius.lg}`; `ui.radius.pill={tailwind.radius.full}` | Controls, cards and badges |
| Stroke Width | `ui.border.default={tailwind.stroke.hairline}`; `ui.border.focus={tailwind.stroke.strong}`; `ui.border.accent={tailwind.stroke.accent}` | Stroke widths |
| Shadow | `ui.shadow.card={tailwind.shadow.card}`; `ui.shadow.overlay={tailwind.shadow.overlay}` | Use only for elevated elements |
| Sizing | `ui.container.max=1200px`; `ui.container.content=800px` | Site shell and ordinary content max width |
| Spacing | `ui.focus.offset={tailwind.space.1}` | 4 px gap between object and 2 px focus ring |

Focus is a **recipe**, because Penpot has no single outline token: use `ui.color.focus` as the ring
stroke, `ui.border.focus` as its 2 px width, and `ui.focus.offset` as the 4 px separation. On dark
primary controls, use a white inner separator and the same outer slate ring. Document this recipe
on the focus board; do not encode it as a decorative drop shadow.

## 📚 Huella semantics and typography

Create these in `03 Huella semantics`. They name site-specific meaning so P6 components can refer
to the design role rather than a palette stop.

| Type | Token | Value |
| --- | --- | --- |
| Color | `huella.color.brand.paper` | `{tailwind.ivory.100}` |
| Color | `huella.color.brand.ink` | `{tailwind.neutral.700}` |
| Color | `huella.color.brand.slate` | `{tailwind.slate.500}` |
| Color | `huella.color.brand.teal` | `{tailwind.teal.400}` |
| Color | `huella.color.article.link` | `{ui.color.primary}` |
| Color | `huella.color.article.citation` | `{ui.color.accent.text}` |
| Color | `huella.color.article.callout` | `{tailwind.teal.50}` |
| Color | `huella.color.article.rule` | `{ui.color.border}` |
| Sizing | `huella.measure.article` | `680px` |
| Sizing | `huella.measure.article.wide` | `760px` |
| Spacing | `huella.space.article.paragraph` | `{tailwind.space.6}` |
| Spacing | `huella.space.article.section` | `{tailwind.space.12}` |
| Spacing | `huella.space.article.citation` | `{tailwind.space.4}` |
| Stroke Width | `huella.border.quote` | `{tailwind.stroke.accent}` |

First create **Font Family** tokens `huella.font.editorial=Georgia, "Libre Baskerville", serif` and
`huella.font.interface=Montserrat, sans-serif`. Test them on a real text layer. If Georgia reports
missing, set the editorial token to `"Libre Baskerville", Georgia, serif` and record that one
substitution on the typography board. If Libre Baskerville also reports missing, stop the typography
batch and report the font inventory; do not silently use a generic serif. Montserrat must resolve
before creating its composite styles. Do not fetch an unlicensed font into the file.

Create **Typography composite** tokens below. For each row, set family from the preceding tokens,
size in px, numeric weight, unitless line-height, letter spacing in px, and text case `none` unless
shown. All samples are sentence case; avoid automatic uppercase for Spanish accents. These are
complete styles, not separate unbound labels.

| Token | Family | Size / weight / line-height / tracking | Use |
| --- | --- | --- | --- |
| `huella.type.display` | editorial | `52 / 400 / 1.12 / -1` | Homepage feature title; mobile uses `display.mobile` |
| `huella.type.display.mobile` | editorial | `36 / 400 / 1.17 / -0.5` | Mobile feature title |
| `huella.type.heading.1` | editorial | `40 / 400 / 1.18 / -0.5` | Page or article title |
| `huella.type.heading.1.mobile` | editorial | `32 / 400 / 1.2 / -0.3` | Mobile page title |
| `huella.type.heading.2` | editorial | `30 / 400 / 1.25 / 0` | Section heading |
| `huella.type.heading.3` | editorial | `24 / 400 / 1.3 / 0` | Subsection heading |
| `huella.type.body` | editorial | `18 / 400 / 1.65 / 0` | Reading copy, 65–75 characters per line |
| `huella.type.body.mobile` | editorial | `17 / 400 / 1.6 / 0` | Narrow reading copy |
| `huella.type.body.small` | editorial | `16 / 400 / 1.55 / 0` | Compact card copy |
| `huella.type.quote` | editorial | `24 / 400 / 1.45 / 0` | Pull quote |
| `huella.type.citation` | editorial | `15 / 400 / 1.5 / 0` | Legal citation and footnote text |
| `huella.type.nav` | interface | `14 / 600 / 1.4 / 0` | Navigation |
| `huella.type.label` | interface | `14 / 600 / 1.4 / 0` | Form label and button label |
| `huella.type.metadata` | interface | `13 / 500 / 1.45 / 0` | Date, category, reading time |
| `huella.type.caption` | interface | `13 / 400 / 1.5 / 0` | Figure caption and helper text |

The composite tokens are the typography assets for P5. Bind the board's text layers to them. Do not
create parallel unbound Penpot text styles, since applying a style detaches a typography token. Note
any kit-style-to-Huella-token mapping in the component inventory.

## 🖼️ Foundations boards

Create these six boards, in this order, on `03 Foundations`. Use responsive flex/grid layout for
the contents so samples remain inspectable. Every sample's visible label is its token name and
resolved value. Avoid making the boards into reusable product components; P6 owns components.

| Board | Required contents and bindings |
| --- | --- |
| `F00 — Theme review` | One compact desktop editorial composition plus its 390 px mobile treatment: canvas, header, H1, article excerpt, citation, card, primary action and visible focus sample. Bind every visible value to tokens. Leave this board open for review. |
| `F01 — Colour and contrast` | Four 10-step palette ramps plus danger and white/black; semantic surface cards; six exact text/background pairs listed below; label the accent `decorative at #5DA399`. |
| `F02 — Type and reading` | Every typography style with one Spanish sample; one 680 px article column and a 390 px mobile column; paragraph, H1–H3, quote, citation, metadata and long title. |
| `F03 — Spacing and geometry` | Every space, size, radius and stroke primitive with numeric label; side-by-side 390/768/1280 px page shells with correct gutters, 1200 px max container and 680 px article measure. |
| `F04 — Surfaces and elevation` | Canvas, card, raised menu and tinted callout with semantic fills/borders; card and overlay shadows applied as tokens; no shadow on ordinary text. |
| `F05 — Focus and states` | Primary button, text link and input in default/hover/focus/invalid states; 44 px minimum target; 2 px ring plus 4 px offset; show the focus ring on both ivory and dark primary backgrounds. |

The colour board must show these measured foreground/background pairs. Ratios are the intended
values from the specified hex colours, rounded to two decimals; recheck them in the actual file
after any override. Regular text needs at least 4.5:1 under the WCAG 2.2 AA target.

| Foreground / background | Intended ratio |
| --- | --- |
| `ui.color.text` / `ui.color.canvas` | 6.90:1 |
| `ui.color.primary` / `ui.color.canvas` | 6.03:1 |
| `ui.color.text.muted` / `ui.color.canvas` | 4.60:1 |
| `ui.color.accent.text` / `ui.color.canvas` | 5.02:1 |
| `ui.color.on-primary` / `ui.color.primary` | 7.27:1 |
| `ui.color.danger` / `ui.color.danger.surface` | 6.23:1 |

## ✅ P5 acceptance

| Check | Passing evidence |
| --- | --- |
| Catalogue | All named tokens exist exactly once in the three active sets; aliases resolve; one active `Huella / Light` theme. |
| Bindings | Inspect shows token pills for a colour fill, border stroke, spacing, radius, width, shadow and composite text style. |
| Typography | No missing-font warning; display, headings, body, metadata, label, citation and caption are shown at intended desktop/mobile sizes. |
| Reading | The 680 px article sample reads at roughly 65–75 characters per line with real Spanish prose; 390 px sample has no horizontal overflow. |
| Accessibility | Listed text pairs pass 4.5:1; focus treatment is visible on light and dark surfaces; 44 px target demonstrated. |
| Handoff | Six named boards, board renders and token JSON exist; the named Penpot version is saved and `F00 — Theme review` is left ready for review. A local `.penpot` backup was explicitly waived by the user. |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Dark mode | Add a separate mode set and re-test every colour and state pair. |
| Production theme | Transform the approved JSON into CSS/Nuxt UI values and test parity during implementation. |
| Components and responsive templates | P6 binds these tokens to actual components; P7 applies the system to page layouts. |
