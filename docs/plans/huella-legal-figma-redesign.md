# Huella Legal Figma redesign — phase status

Canonical project scope and sequencing: [`apps/huella-legal/FIGMA.md`](../../apps/huella-legal/FIGMA.md).

## Current status

**Phase P0 — blocked; P1 is not ready.** The Figma plugin authenticated and created an editable Design draft, but the Starter-tier Figma MCP call limit stopped further operations before the core smoke test, cleanup, and Nuxt UI kit verification were complete.

## P0 checklist

| Substep | Status | Result |
|---|---|---|
| P0.a — Verify connection | Complete | Plugin authenticated; one Starter team plan, Full admin seat. |
| P0.b — Create/select master | Complete | New Design draft created with the requested Huella Legal name. File identifiers are intentionally not recorded here. |
| P0.c — Establish structure | Adapted | Starter rejected a second page with a three-page-per-file limit. Created three grouped pages and named sections for all nine requested destinations. “00 — Project” contains the project summary and roadmap. |
| P0.d — Test design-system operations | Blocked | Temporary local color and spacing variables were created and verified. The next plugin operation was rejected by the Starter MCP call-limit paywall, before text-style, component, instance, binding, metadata, and sandbox screenshot checks could be completed. The temporary section and variables remain because the same limit blocks safe cleanup. |
| P0.e — Verify typography | Complete | Georgia is absent from the API font inventory. All exact Montserrat styles are listed below. No font substitution was made. |
| P0.f — Check Nuxt UI kit | Blocked | Library discovery and design-system search were rejected by the same MCP call-limit paywall. Kit availability is unverified; no assets were imported. |
| P0.g — Persistence and recovery | Partial | The permanent page names were rediscovered through the plugin. Metadata confirms the grouped system sections and the permanent project frame; a screenshot of “00 — Project” was captured. A final post-cleanup check remains outstanding. |
| P0.h — Update status | Complete | This status record captures verified results and blockers without external Figma identifiers. |

## Decisions for later phases

- Keep one master Design draft for the design system and website screens.
- Preserve the nine requested destinations as three Starter-compatible pages with named canvas sections: `00 — Project`; `01 — Audit, Foundations & System`; and `02 — Concepts, Templates, QA & Archive`.
- Account plan facts from the canonical plan: unlimited drafts, three team Design-file slots, 30-day version history, no Dev Mode, and no cross-file library publishing. The plugin separately enforced a three-page-per-file limit in this workflow.
- Use the official Nuxt UI Figma kit as the future component foundation, pending plugin library search. Do not import the full kit during P0.
- Record Georgia as missing and Montserrat’s exact available styles for Phase P1: `Black`, `Black Italic`, `Bold`, `Bold Italic`, `ExtraBold`, `ExtraBold Italic`, `ExtraLight`, `ExtraLight Italic`, `Italic`, `Light`, `Light Italic`, `Medium`, `Medium Italic`, `Regular`, `SemiBold`, `SemiBold Italic`, `Thin`, and `Thin Italic`. Do not substitute fonts during P0.
- The canonical repository plan remains the source of truth. Figma project documentation repeats that note.

## Blocker and recovery

The Starter plan's Figma MCP call limit was reached during P0. The plugin returned an upgrade paywall, and subsequent library discovery was blocked by the same limit. The precise reset window was not exposed. Resume P0.d cleanup and remaining checks only when plugin calls are available; then search libraries and design-system assets for the official Nuxt UI kit and a Button representative. Remove only the exact temporary test objects returned by the plugin. Do not proceed to P1 until all P0 exit criteria pass.
