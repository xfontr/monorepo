---
scope: "@monorepo"
commit: "88f5939"
---

# 🔎 SonarQube code smells: shared packages

## 🗺 Context

SonarQube Cloud reported nine open code smells and one accepted code smell across
`packages/content`, `packages/i18n` and `packages/observability` on `master` on 2026-09-25. The
flagged lines were checked against commit `88f5939`. Open findings have proposed fixes; the
accepted finding needs no code change. Each issue key identifies its SonarQube finding.

## 🧹 Quality

| ID | Where | Severity and issue | What goes wrong | Fix | Status |
| --- | --- | --- | --- | --- | --- |
| Q1 | [`content/WordpressProvider.ts:34`](../../packages/content/src/core/adapters/providers/wordpress/WordpressProvider.ts#L34) | Major `AaAah6BfpluT0KmYWf3S` | The trailing-slash regex can rescan a long slash suffix. | Find the last non-slash character and slice once; preserve the path of subdirectory WordPress installs. | open |
| Q2 | [`content/contentKey.ts:19`](../../packages/content/src/core/contentKey.ts#L19) | Major `AaAah6EcpluT0KmYWf3X` | Sorting is chained into the returned mapping expression, hiding mutation. | Sort `entries` in its own statement or use `toSorted` if the runtime supports it; preserve deterministic key order. | open |
| Q3 | [`content/useContent.ts:43`](../../packages/content/src/nuxt/runtime/composables/useContent.ts#L43) | Minor `AaBoBQ8nh-ku-SWtJH3v` | The resource union is repeated in several helper signatures. | Name `EntryResource \| TermResource` once and use the alias at all three call sites. | open |
| Q4 | [`content/contentKey.ts:10`](../../packages/content/src/core/contentKey.ts#L10) | Minor `AaAah6EcpluT0KmYWf3V` | A global regex substitutes underscores in key segments. | Use `.replaceAll("_", "_u")`, retaining key-collision coverage. | open |
| Q5 | [`content/contentKey.ts:10`](../../packages/content/src/core/contentKey.ts#L10) | Minor `AaAah6EcpluT0KmYWf3W` | A second global regex substitutes hyphens. | Use `.replaceAll("-", "_d")` in the same edit as Q4. | open |
| Q6 | [`content/errors.ts:10`](../../packages/content/src/core/domain/errors.ts#L10) | Minor `AaAah6D6pluT0KmYWf3T` | HTTP passthrough membership uses an array scan. | Make the status collection a `Set` and use `.has()` where the error is mapped. | open |
| Q7 | [`i18n/translationsKey.ts:10`](../../packages/i18n/src/core/translationsKey.ts#L10) | Minor `AaBoBQ4Ch-ku-SWtJH3t` | A global regex substitutes underscores in key segments. | Use `.replaceAll("_", "_u")`, retaining encoded-key collision cases. | open |
| Q8 | [`i18n/translationsKey.ts:10`](../../packages/i18n/src/core/translationsKey.ts#L10) | Minor `AaBoBQ4Ch-ku-SWtJH3u` | A second global regex substitutes hyphens. | Use `.replaceAll("-", "_d")` in the same edit as Q7. | open |
| Q9 | [`i18n/translations.ts:1`](../../packages/i18n/src/core/domain/translations.ts#L1) | Major `AZ_8etZSbSjYjv7QodyM` | `Locale` aliases `string`; SonarQube suggests replacing the name at its call sites with `string`. | Retain the domain name: it distinguishes a locale value in signatures even though the current representation is a string. SonarQube already marks this issue accepted. | wont-fix — accepted in SonarQube |
| Q10 | [`observability/node.ts:34`](../../packages/observability/src/node.ts#L34) | Major `AZ__HlrVjHpLikj8piLb` | A nested template literal builds Basic authorization inside another template literal. | Build the `instanceId:token` credential and its encoded header in separate local values, then pass the header to the exporter; keep the existing wire value. | open |

## 🪜 Order

Fix Q1 with long slash-suffix and subdirectory URL cases, then Q2 to preserve content-key order.
Q4–Q5 and Q7–Q8 are paired substitutions. Q3, Q6 and Q10 are local refactors. Run the affected
package specs, lint and typecheck after edits; Q9 is already accepted in SonarQube.
