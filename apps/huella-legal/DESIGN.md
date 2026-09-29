# 🎨 Huella Legal Penpot design plan

This plan produces a focused editorial design system and the website templates needed for Huella
Legal. Penpot replaces Figma as the design workspace, and its official MCP server is the path for
AI-assisted design work.

The target remains one weekend. That is realistic only if the system covers this website rather
than every hypothetical future Huella product.

## 🧩 What should remain recognizably Huella Legal

A superficial inspection of [huellalegal.com](https://www.huellalegal.com/) shows brand ingredients
worth preserving.

| Ingredient | Direction |
| --- | --- |
| Background | Warm ivory around `#F1E9DB` |
| Primary | Slate blue around `#3E5A6D` |
| Accent | Muted teal around `#5DA399` |
| Text | Charcoal around `#4E4E4E` |
| Editorial type | Georgia, or a closely related serif if testing exposes a concrete problem |
| Interface type | Montserrat for navigation, labels and calls to action |
| Imagery | Classical legal imagery rather than generic corporate-law stock photography |
| Personality | Academic, restrained and content-first |

These are the brand DNA, not a requirement to preserve the existing interface. The redesign may
replace the layout, hierarchy, cards, navigation, spacing, article experience, mobile behaviour and
conversion structure. Decorative gradients should mostly disappear; blue-to-teal may remain as a
controlled accent rather than a background treatment.

## 🧰 How Penpot fits the work

Penpot Professional is sufficient for this scope. The hosted free plan currently allows unlimited
design files, up to eight team members, unlimited viewers and 10 GB of storage. Its meaningful
constraint is short retention: seven days of autosaved versions and deleted-file recovery. The
[current pricing page](https://penpot.app/pricing) is the source of truth if those limits change.

Penpot also supports components, variants, flex and grid layouts, prototypes, inspect mode, shared
libraries and native design tokens. Tokens use the W3C Design Tokens Community Group format and can
be imported or exported as JSON, so the design vocabulary can later be mapped to code without a
proprietary translation layer. See the Penpot guides for
[design tokens](https://help.penpot.app/user-guide/design-systems/design-tokens/),
[libraries](https://help.penpot.app/user-guide/design-systems/libraries/) and
[developer inspection](https://help.penpot.app/user-guide/dev-tools/).

The working setup is:

| Concern | Decision | Why |
| --- | --- | --- |
| Project | One Penpot project named `Huella Legal` | Keeps design work discoverable without coupling it to personal drafts |
| Design file | One master file named `Huella Legal — Website` for v1 | Avoids token-copy drift and keeps the weekend handoff self-contained |
| File pages | `00 Brief`, `01 Audit`, `02 Concepts`, `03 Foundations`, `04 Components`, `05 Patterns`, `06 Templates`, `07 QA`, `99 Archive` | Separates decisions from reusable assets and final boards |
| Reuse | Start from a vetted Tailwind-oriented Penpot kit, then copy the required assets into local Huella components | Reusing sound primitives and states saves time without making a community file the product's source of truth |
| Tokens | Native Penpot tokens split into Tailwind primitives, interface semantics and Huella semantics | Keeps design values close to the eventual Nuxt UI theme while preserving a brand-level vocabulary |
| Backups | Export a `.penpot` file and token JSON at each approval gate to a private design archive | Seven-day hosted history is too short to be the only recovery strategy |
| Developer handoff | Shared View-mode link plus Inspect mode and exported token JSON | Developers can read measurements, CSS, HTML and SVG without editing the source |

Use a Tailwind-oriented Penpot kit as the implementation substrate rather than recreating generic
primitives. The leading candidates are the Penpot Hub Tailwind kit and its Radix/Tailwind UI Design
System. Audit native tokens, flex layouts, variants, responsive behaviour, naming and licensing
before adopting either one; community provenance is a reason to inspect a kit, not to discard the
time it can save.

Connect the selected kit as a reference library, then copy only the required assets into this
file's local library. Local copies are where Huella naming, token bindings and structural changes
live. Do not import a connected library's tokens blindly because Penpot replaces the file's full
token catalogue when it imports library tokens.

Nuxt UI remains the implementation baseline. Its Tailwind and Reka UI foundations are close enough
to the candidate Penpot kits that generic controls can share scales, anatomy and states even when
there is no official Nuxt UI Penpot file. All Huella UI code, including local wrappers and editorial
patterns, lives in `apps/huella-legal`; `@monorepo/ui` is not part of the target architecture.

The design vocabulary has three layers:

| Layer | Contents | Purpose |
| --- | --- | --- |
| `tailwind.*` | Palette ramps, spacing, sizing, breakpoints, radii and shadows | Keeps primitive decisions aligned with Tailwind CSS |
| `ui.*` | Primary, neutral, surfaces, borders, muted text, focus, container and control semantics | Maps the design onto Nuxt UI theming rather than raw utility classes |
| `huella.*` | Brand colours, editorial typography, reading measure, citations and article treatments | Preserves product meaning when implementation details change |

## 🤖 AI workflow

Use Penpot's official MCP server rather than relying on cursor movement or a third-party generative
plugin. The [Penpot MCP guide](https://help.penpot.app/mcp/) documents the connection: enable MCP in
the Penpot account, add its server to the AI client, open the target file, and connect the active
Penpot tab through **File → MCP Server → Connect**.

The integration follows two operational constraints:

| Constraint | Consequence |
| --- | --- |
| MCP operates on the currently focused Penpot page | Every task names the page it expects and verifies that page before writing |
| Only one Penpot browser tab can be MCP-active | Keep one pinned design tab active and close or disconnect competing Penpot tabs |

The MCP key and server URL are credentials. Never paste them into this repository, a prompt, a
screenshot or an exported design note. If setup requires the user to enter a secret, pause for that
action and resume only after the Penpot tools are available to the agent.

AI should work in small transformations: inspect, propose, write, render, verify and then continue.
It should not attempt to generate the whole site in one operation. Each completed phase must leave
named components, applied tokens, flex or grid constraints and a visual QA board rather than a set
of disconnected mock-ups.

## 🗺️ Delivery phases

| Phase | Work | Deliverable | Approval |
| --- | --- | --- | --- |
| P0. Validate the workflow | Connect Penpot MCP; prove read, write, component, token, layout, inspect and export operations; establish the master-file structure | A disposable smoke-test page, the structured master file and a recorded pass/fail checklist | None unless credentials or permissions block the connection |
| P1. Audit Huella Legal | Sample the homepage, article, listing, static page and mobile behaviour; extract visual, content and conversion patterns | `01 Audit` with annotated evidence and a short findings table | None |
| P2. Lock the brief | Define brand invariants, audience, conversions, accessibility target, page archetypes and exclusions | `00 Brief` with one concise decision board | **Gate 1: brief** |
| P3. Curate the implementation baseline | Audit the Tailwind-oriented Penpot candidates, inspect the relevant Nuxt UI and `@monorepo/ui` components, then localize only the structures needed by the editorial site | Selected kit, adoption notes and a component inventory with design-to-code names and states | None |
| P4. Explore directions | Produce two directions using the same brand: one homepage section, article reading view, header and mobile treatment | Concept A and B on `02 Concepts` | **Gate 2: direction** |
| P5. Define the theme | Create primitive and semantic tokens for colour, typography, spacing, radius, containers, borders, shadows and focus states | Token sets, typography assets and foundations boards | Review one foundations board |
| P6. Build the core system | Build the required components from tokens and flexible layouts; add Huella-specific editorial patterns | Reusable components and patterns with representative states | **Gate 3: system** |
| P7. Build templates | Apply the chosen direction to the agreed page archetypes at desktop and mobile sizes | Final template boards with responsive constraints | Review the assembled site |
| P8. Validate | Check accessibility, contrast, readability, content stress, responsive behaviour, consistency and conversion clarity | `07 QA` with evidence and a resolved issue table | **Gate 4: ready** |
| P9. Package the result | Clean naming, annotations, component index, final screenshots, decision summary and milestone exports | Development-ready Penpot file, View link, `.penpot` backup and token JSON | None |

The sequence is deliberate: discovery precedes tokens, tokens precede components, and components
precede complete screens. Skipping that order produces attractive boards that cannot be maintained.

## 🧪 P0 acceptance criteria

P0 is a capability test, not design production. It passes only when the assigned agent can prove
each operation in the real Penpot file and then remove the disposable artefacts.

| Check | Evidence of success |
| --- | --- |
| Connection | Penpot tools can identify the open file and focused page without exposing the MCP credential |
| Structure | The nine named pages exist in the master file in the stated order |
| Read | The agent can list a page and inspect a selected object by stable name |
| Tokens | Primitive colour and spacing smoke-test tokens can be created, applied and read back |
| Flexible layout | A test card uses flex layout, gap and padding rather than manually positioned children |
| Component | The test card becomes a component and a copy inherits a changed source property |
| Inspect | The test board exposes measurements and code information in Penpot Inspect mode |
| Visual verification | A rendered image or screenshot confirms that the result matches the requested hierarchy |
| Export | A `.penpot` backup and token JSON can be exported without adding either artefact to this repository |
| Cleanup | The smoke-test component, tokens and board are deleted; the permanent page structure remains |

If the hosted MCP connection is unavailable, P0 stops after recording the exact missing prerequisite.
Browser-only drawing is not an acceptable substitute because every later phase depends on reliable
structured reads and writes.

## 🧱 System scope

For Huella Legal v1, a proper design system means the following bounded set.

| Area | Required coverage |
| --- | --- |
| Tokens | Tailwind-aligned primitives plus interface and Huella semantic colour, type, spacing, radius, border, shadow, container and focus tokens |
| Typography | Display, heading, body, metadata, label, citation and caption treatments |
| Layout | Desktop and mobile rules plus responsive flex/grid behaviour between them |
| Components | Approximately 12–18 components with only useful states and variants |
| Editorial patterns | Approximately 5–7 reusable compositions |
| Templates | The agreed website archetypes, not every CMS permutation |
| Documentation | Naming, purpose, states, content constraints and implementation mapping |

The provisional inventory is:

| Kind | Items |
| --- | --- |
| Navigation | Header, desktop navigation, mobile navigation, breadcrumbs, pagination |
| Actions | Button, icon button, text link, newsletter form |
| Discovery | Featured article card, standard article card, category badge, metadata row |
| Authorship | Author/byline block and contributor summary |
| Reading | Article table of contents or accordion, callout, quote, figure/caption, legal citation |
| Site chrome | Footer |
| Templates | Homepage, publications/category listing, article, static editorial page, author/contributor page, contribution/contact page |
| Utility states | Search, empty result and 404 as one compact family |

The definitive list is set at P2 after the content audit. A provisional item with no real use case
is removed rather than built for completeness.

## 👀 Review gates

The user makes four decisions; AI owns the smaller choices inside those boundaries.

| Gate | Decision |
| --- | --- |
| 1 | This brief describes Huella Legal |
| 2 | Choose concept A or B |
| 3 | The theme and representative components feel right |
| 4 | The assembled templates are ready |

Spacing, radii, minor colour values, component states, text sizing, card composition, responsive
rearrangement and routine visual polish do not need escalation unless they change the brand, scope
or content strategy.

## ⚙️ Defaults

| Decision | Default |
| --- | --- |
| Accessibility | WCAG 2.2 AA |
| Theme | Light only |
| Language | Spanish-first |
| Responsive scope | Desktop and mobile designed explicitly; tablet validated through constraints |
| Primary conversion | Discover and read quality legal content |
| Secondary conversions | Subscribe and contribute an article |
| Article measure | Approximately 65–75 characters per line |
| Imagery | Restrained editorial or classical legal photography and illustration |
| Motion | Minimal and functional |
| Implementation alignment | Tailwind scales and Nuxt UI anatomy for generic controls; custom components only for Huella-specific editorial needs |

## ⚠️ Risks

| Risk | Control |
| --- | --- |
| Short hosted history | Export `.penpot` and token JSON snapshots at every gate |
| Scope expansion | Cover this website and its real content, not a general multi-product system |
| Community-kit drift | Audit the chosen kit, copy only the required assets locally and record every design-to-code mapping against Nuxt UI |
| Token drift across files | Keep v1 in one master file; introduce a shared library only with a second consumer and an explicit token-sync procedure |
| Disconnected AI output | Lock the brief and tokens before screens; require named components and flexible layouts |
| Extreme legal content | Test long Spanish titles, missing images, multiple authors, footnotes, blockquotes, tables, lists, citations and dense headings |
| Undefined conversion | Confirm at P2 whether discovery, newsletter signup and contributor submissions are the real goals |
| False accessibility confidence | Penpot verifies design intent; implementation must later verify semantics, keyboard use, screen readers and performance |
| Asset licensing | Record the source and licence of every retained photograph, illustration, icon and font |
| Sleeping browser tab | Pin the active Penpot tab and exclude it from browser memory-saving while MCP work runs |

## ⏱️ Weekend budget

| Work | Budget |
| --- | --- |
| P0 workflow validation | 30–45 minutes |
| Audit, brief and direction boards | 1.5–2 hours |
| Theme and foundations | 1–2 hours |
| Components and patterns | 2–3 hours |
| Templates and responsive states | 2–3 hours |
| QA, documentation and exports | 1–1.5 hours |

The total is roughly one focused day of design work plus four short reviews. Dark mode, dozens of
unique pages, advanced prototypes, custom illustration production or a general-purpose component
library are outside that budget.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A second product or design file | Publish the master file as a shared library, document update ownership and decide how token imports are reconciled before connecting consumers |
| Upstream kit updates | Compare useful upstream changes manually; local Huella components do not inherit community-library changes automatically |
| Design tokens in production | Export DTCG JSON, define the transformation into the app's CSS or Nuxt UI theme and test design/code parity |
| Dark theme | Add a theme set, re-evaluate imagery and elevation, then repeat contrast and content QA |
| Advanced prototype | Add only the interactions needed for a specific usability question; static handoff does not justify simulating the whole application |
| Implementation | Translate the approved system into Nuxt UI-backed components owned by `apps/huella-legal`, then test keyboard behaviour, semantics, screen readers and Core Web Vitals in the browser |
| Self-hosted Penpot | Choose hosting, backups, upgrades and access controls; the hosted free plan is adequate for this design pass |
