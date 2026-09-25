---
scope: "@monorepo/developer-portal"
commit: "88f5939"
---

# 🔎 SonarQube code smells: developer portal

## 🗺 Context

SonarQube Cloud reported 14 code smells for this project on `master` on 2026-09-25. Each flagged
line was checked against commit `88f5939`, and all 14 findings have been fixed. The issue key
identifies the exact SonarQube finding. Four separate `BUG` issues in this project are outside this
code-smell audit.

## 🧹 Quality

| ID | Where | Severity and issue | What goes wrong | Fix | Status |
| --- | --- | --- | --- | --- | --- |
| Q1 | [`shared/audits.ts:34`](../../apps/developer-portal/shared/audits.ts#L34) | Critical `AaDXsYuBE61A28_-R1h_` | `parseFindings` handles fences, headings, table headers and rows in one loop, giving cognitive complexity 22. | Extract table-header detection and finding-row parsing into small functions; keep fence and heading state in the outer loop. Pin malformed and prose-table cases in the existing parser spec. | fixed |
| Q2 | [`tools/collect/docs.ts:11`](../../apps/developer-portal/tools/collect/docs.ts#L11) | Major `AaB3Fi0FwgYnFLlV-z9r` | The inline-link regex has overlapping paths when a long malformed link lacks a closing delimiter. | Exclude nested openers from link text and destinations so failed matches cannot overlap; retain link-title and code-span cases in specs. | fixed |
| Q3 | [`tools/collect/docs.ts:15`](../../apps/developer-portal/tools/collect/docs.ts#L15) | Major `AaDY6_Z_aSqI9phY3mAn` | The backreference in `CODE_SPAN` makes unmatched runs of backticks costly to scan. | Require whole backtick runs at both ends so an unmatched delimiter cannot restart at each backtick; cover multiline spans and unmatched runs. | fixed |
| Q4 | [`shared/issues.ts:5`](../../apps/developer-portal/shared/issues.ts#L5) | Major `AaB3Fi09wgYnFLlV-z9y` | Link stripping can repeatedly rescan malformed markdown. | Exclude nested openers from link text and destinations so failed matches cannot overlap; preserve link text in the summary. | fixed |
| Q5 | [`shared/issues.ts:6`](../../apps/developer-portal/shared/issues.ts#L6) | Major `AaB3Fi09wgYnFLlV-z9z` | Whitespace and bullet prefixes overlap in the checkbox regex. | Restrict prefix whitespace to spaces and tabs so it cannot span lines; cover long indentation and whitespace-only lines. | fixed |
| Q6 | [`shared/issues.ts:7`](../../apps/developer-portal/shared/issues.ts#L7) | Major `AaB3Fi09wgYnFLlV-z90` | The bullet regex can backtrack across long whitespace and marker runs. | Restrict indentation and suffix whitespace to spaces and tabs, keeping each match on its own line. | fixed |
| Q7 | [`tools/collect/docs.ts:180`](../../apps/developer-portal/tools/collect/docs.ts#L180) | Major `AaB3Fi0FwgYnFLlV-z9u` | `pages.sort(...)` mutates data inside a returned object expression. | Sort in a separate statement, or use `pages.toSorted(...)` if the workspace runtime supports it; verify page order stays the same. | fixed |
| Q8 | [`tools/lib/scorecards.ts:52`](../../apps/developer-portal/tools/lib/scorecards.ts#L52) | Major `AaB3Fiy4wgYnFLlV-z9o` | The total-row branch assigns `totalDelta` again when later total rows cannot change the result. | Keep the first parsed Total row and return or break, or document and test last-row precedence before removing the redundant assignment. | fixed |
| Q9 | [`shared/auditReports.ts:54`](../../apps/developer-portal/shared/auditReports.ts#L54) | Minor `AaDXsYrZE61A28_-R1h9` | `string \| "all"` is just `string`; the literal gives no type constraint. | Use `scope?: string`, or a narrower known-scope union if the UI needs exhaustive values. | fixed |
| Q10 | [`shared/issues.ts:53`](../../apps/developer-portal/shared/issues.ts#L53) | Minor `AaB3Fi09wgYnFLlV-z94` | `string \| "all"` collapses to `string`. | Use `label?: string`, keeping the existing `"all"` runtime branch. | fixed |
| Q11 | [`app/composables/useIssues.ts:1`](../../apps/developer-portal/app/composables/useIssues.ts#L1) | Minor `AaC_Dgx3BzpILJi2DMLP` | Three imports from the same module are separate. | Combine the value imports with a single `import { ..., type IssuesRead, type GithubIssue }` statement. | fixed |
| Q12 | [`app/composables/useIssues.ts:2`](../../apps/developer-portal/app/composables/useIssues.ts#L2) | Minor `AaC_Dgx3BzpILJi2DMLQ` | The second type import repeats the same module path. | Resolve with Q11; keep both types in the consolidated import. | fixed |
| Q13 | [`tools/collect/metrics.ts:23`](../../apps/developer-portal/tools/collect/metrics.ts#L23) | Minor `AaB3FiziwgYnFLlV-z9p` | Filtering every tag to take the first one allocates an unnecessary array. | Use `.find(Boolean)` and retain the `null` fallback. | fixed |
| Q14 | [`tools/collect/metrics.ts:86`](../../apps/developer-portal/tools/collect/metrics.ts#L86) | Minor `AaB3FiziwgYnFLlV-z9q` | Filtering every commit SHA to take the first one allocates an unnecessary array. | Use `.find(Boolean)` and preserve the no-release branch. | fixed |

## 🪜 Order

Address Q2–Q6 first because malformed or adversarial markdown can multiply parsing time. Then split
the parser in Q1, resolve Q8's total-row behavior, and take Q7 and Q9–Q14 as small cleanup changes.
Run the developer portal specs, lint and typecheck after edits; use long malformed markdown cases to
check that failed regex matches stay fast.
