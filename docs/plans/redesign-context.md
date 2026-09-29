# 🎨 Huella Legal redesign context and Claude handoff

This records the Huella Legal website redesign as of 29 September 2026 and the user's current
request. Read it with the [Penpot design plan](../../apps/huella-legal/DESIGN.md), the
[P5 execution sheet](./huella-legal-p5-theme.md), the
[P6 execution sheet](./huella-legal-p6-core-system.md), and the private
[P6 component index](</Users/xifre/Documents/ChatGPT/Huella Legal/design-archive/p6/component-index.md>).
The component index is the last recorded Penpot state, not proof that the live file is unchanged.

## 🎯 What the user wants

Finish the **existing P6 core system in Penpot**, then present a genuinely reviewable Gate 3. The
user has already authorized P6. They want the duplicate component masters consolidated, every
remaining instance linked to the chosen masters, token bindings read back and fixed, propagation
verified, seven specimen boards re-rendered and inspected, the private archive updated, and a new
named Penpot version saved. Leave `C00 — System review` open when the work is actually complete.
Do not advance to P7 or describe P6 as complete while these checks remain open.

The user is handing this to Claude because the repeated Codex/Luna attempts did not finish the
repair; in the user's words, "codex is just way too incompetent." Treat this as a request to
**execute and verify the remaining work**, rather than another request for a plan or a status-only
response. Report precisely what is complete and what is blocked if Penpot fails again.

## 🗺️ Project and decisions

| Area | Established direction |
| --- | --- |
| Product | Redesign the Huella Legal law blog as a restrained, Spanish-first editorial website. Preserve warm ivory, slate blue, muted teal, charcoal, classical legal imagery and Georgia/Montserrat typography. |
| Workspace | The target is the existing Penpot `Huella Legal` design file, with pages `00 Brief` through `07 QA` and `99 Archive`. Use the official Penpot MCP. |
| Concept | The user selected **A · Archivo editorial** on 23 September 2026. P6 is based on that choice. |
| Implementation | Nuxt UI is the generic control and behavior baseline. Future site code belongs to `apps/huella-legal`; there are no `@monorepo/ui` mappings for this system. P6 is Penpot design work, not production Vue work. |
| Scope | Light theme, desktop 1280 px and mobile 390 px examples, plus a 768 px constraint check. P7 templates, browser accessibility verification and production code follow Gate 3. |
| Backup | The user waived a local `.penpot` download for this design pass. Named Penpot versions, token JSON and board renders are the available recorded handoff. |

The old [Figma phase-status file](./huella-legal-figma-redesign.md) describes an abandoned P0
attempt stopped by Figma's Starter MCP limit. Penpot replaced Figma as the design workspace; do
not resume that Figma checklist or its kit search.

## ✅ Work already recorded

| Phase | Recorded result | Source or limit |
| --- | --- | --- |
| P0–P2 | A Penpot master file and earlier brief/audit work exist. The P2 board may still say `proposed`; the P5 and P6 handoffs explicitly say this label is not a reason to stop authorized work. | [Design plan](../../apps/huella-legal/DESIGN.md) and [P5 handoff](./huella-legal-p5-theme.md); do not infer a new approval requirement from the stale label. |
| P3 | `P3 · Baseline decision` and `P3 · Component inventory` remain on `04 Components`. The shadcn/Radix kit was used as an anatomy reference; no kit asset or token catalogue was imported. | [P6 handoff](./huella-legal-p6-core-system.md) and the last recorded P6 inventory. |
| P4 | Direction A was selected. | [P5 handoff](./huella-legal-p5-theme.md). |
| P5 | `Huella / Light` and three active token sets exist: `01 Tailwind primitives`, `02 UI semantics`, `03 Huella semantics`. F00–F05 renders and the token JSON are in the private `design-archive/p5` directory. The named version is `P5 — Huella / Light — 23 Sep 2026`. | [P5 handoff](./huella-legal-p5-theme.md) and the archived files. Actual live bindings still need P6 readback. |
| P6 specimens | C00–C04 and P01–P02 were built and seven renders archived in `design-archive/p6`. The index maps 18 component families and seven pattern families to future app code. Version `P6 — Core system — 25 Sep 2026` exists. | [Component index](</Users/xifre/Documents/ChatGPT/Huella Legal/design-archive/p6/component-index.md>). Those renders and that version predate the attempted repair. |

The P6 target is **exactly 18 component masters and seven pattern masters**, one source per asset
name, with at least two linked instances per master. Specimens must use native flex/grid and
component instances. The [P6 handoff](./huella-legal-p6-core-system.md) defines the exact assets,
states, stress content, token names and Gate 3 acceptance checks.

## ⚠️ Last recorded P6 state and blocker

The latest entry in the [component index](</Users/xifre/Documents/ChatGPT/Huella Legal/design-archive/p6/component-index.md>)
reports **38 live library masters across 25 distinct names**: 13 excess masters at that read. An
earlier read showed 39/25. The `Article metadata` duplicate disappeared between reads without a
deletion reported in the retry, so inventory must be refreshed by ID before changing anything.
The original claim of 15 duplicates is stale; do not search for a fifteenth ID to delete.

The last successful Button read found zero instances linked to duplicate master
`ea931b8b-a9c8-80e7-8008-b1563ab4d793`. Button keeper
`22a34caf-fcc4-800e-8008-b1563b29840f` was selected after comparing structure and bindings.
Earlier page-scoped swaps of Button and Newsletter instances were read back, but **no duplicate
master was removed** in the recorded attempts.

The last successful Text link scan found six shapes linked to duplicate master
`22a34caf-fcc4-800e-8008-b1563bfe4d80` on `04 Components`: two root instances and four
children. The root IDs were `22a34caf-fcc4-800e-8008-b1577217cbc4` and
`22a34caf-fcc4-800e-8008-b1577275117f`. The candidate keeper is
`ea931b8b-a9c8-80e7-8008-b1563b43c594`. A guarded swap of the first root produced no MCP
result because the browser suspended the Penpot plugin. Subsequent readbacks failed with the same
heartbeat error. **The outcome of that swap is unknown.** The last visible selection was
`C01 — Controls and states` on `04 Components`, not C00.

An earlier cross-page `swapComponent` attempt failed with
`Cannot modify a page that is not currently active. Code: :swapComponent`. Penpot MCP follows
the currently focused page in its active browser tab; the tab has also repeatedly stopped sending
heartbeats. Do not assume a failed or timed-out write was atomic. Re-read the exact affected IDs
before retrying or deleting anything. Keep a single Penpot tab connected and active, and work one
page and one small batch at a time.

## 🧭 Claude's execution order

| Step | Action | Evidence required before continuing |
| --- | --- | --- |
| 1 | Reconnect the official Penpot MCP and read the active file/page, 25 names, live master IDs and instance links across **all pages**. Start by resolving the uncertain Text link swap and the 38/39 inventory change. | A current ID-level table with each duplicate's linked instances, including nested instances. Distinguish root instances from child shapes. |
| 2 | For each duplicate family, compare both masters' structure, variants and actual token bindings; choose the keeper on evidence. Focus each page containing affected instances, swap one root instance at a time, and read back its master link and nested children. | The duplicate ID has zero file-wide linked instances before its master is removed. A timeout triggers readback, never an assumed retry. |
| 3 | Remove only verified unused duplicate master IDs, in small batches. Re-inventory after each family. | Exactly 25 uniquely named masters remain: 18 components and seven patterns. P3 boards, P5 boards and all seven P6 boards remain intact. |
| 4 | Check at least two instances per master, linked children in pattern masters, and one harmless master change that propagates to instances; restore the property afterward. | Record master/instance IDs and the before/change/restored readback. |
| 5 | Audit all 25 masters for applicable fill, text, spacing, radius, border and focus token bindings. Record actual token names and `N/A` only where a property truly does not apply. Fix missing or wrong bindings and read them back. | A 25-row binding matrix in the private archive. Visual similarity to a token value alone is insufficient. Use the live P5 catalogue's `.default` names. |
| 6 | Re-render C00–C04 and P01–P02 and inspect 1280/390/768 px examples, relevant states, 44 px targets, long content and layout overflow. Update the component index, save a new named Penpot version and leave C00 open. | Refreshed seven renders, final counts and IDs, binding/propagation results and a specific list of any remaining limitation. Then present Gate 3 for the user's review. |

Penpot should not receive a cross-page swap batch. If heartbeat failures persist after a bounded
reconnect and exact-ID readback, stop writes and report the last verified operation and state.
Do not remove a master merely because a previous scan said it had zero links; confirm that again
in the live file immediately before removal.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Gate 3 decision | The user reviews the completed theme and representative system only after the evidence above is ready. Requested visual changes should be made in masters so instances inherit them. |
| P7–P9 | Assemble page templates, validate the full site and package the final design after Gate 3. |
| Production implementation | Translate the approved Penpot system into Nuxt UI-backed code under `apps/huella-legal`; verify keyboard, screen-reader and API behavior in a browser. |
