---
scope: "@monorepo/scripts"
commit: "88f5939"
---

# 🔎 SonarQube code smells: scripts

## 🗺 Context

SonarQube Cloud reported 14 open code smells for `infrastructure/scripts` on `master` on
2026-09-25. Each flagged line was checked against commit `88f5939`; the issue keys identify the
original findings. The fixes pass the scripts project tests, lint and typecheck.

## 🧹 Quality

| ID | Where | Severity and issue | What goes wrong | Fix | Status |
| --- | --- | --- | --- | --- | --- |
| Q1 | [`issue/adapters/gh.ts:84`](../../infrastructure/scripts/src/issue/adapters/gh.ts#L84) | Critical `AaBpoHA5_jgBJHByMPAI` | `void gh(...)` discards a synchronous result with the `void` operator. | Use a block-bodied `void` function and call `gh(...)` as a statement; verify errors still propagate. | fixed |
| Q2 | [`issue/adapters/gh.ts:88`](../../infrastructure/scripts/src/issue/adapters/gh.ts#L88) | Critical `AaBpsCFV2q7RbhuE3wBk` | Branch creation repeats the same `void` pattern. | Apply Q1's block-bodied form to `developBranch`. | fixed |
| Q3 | [`issue/adapters/gh.ts:92`](../../infrastructure/scripts/src/issue/adapters/gh.ts#L92) | Critical `AaB38bfP50elM9qDIsBZ` | Project-status updates repeat the same `void` pattern. | Apply Q1's block-bodied form to `moveToInProgress`. | fixed |
| Q4 | [`issue/adapters/git.ts:9`](../../infrastructure/scripts/src/issue/adapters/git.ts#L9) | Critical `AaBtJzn-TKt27OlRUvfV` | Checkout discards the command result with `void`. | Call `git("checkout", branch)` in a block-bodied `void` function; keep command failure behavior. | fixed |
| Q5 | [`package-contracts/domain/validate.ts:205`](../../infrastructure/scripts/src/package-contracts/domain/validate.ts#L205) | Critical `AaDFDh5nEA0Bk8tS9EXV` | `validatePackage` combines manifest guards, exports, peer metadata and tags, crossing the complexity limit. | Extract export and peer-dependency validation into focused helpers that append to the same error and skipped lists; retain current error ordering in specs. | fixed |
| Q6 | [`issue/domain/branch.ts:12`](../../infrastructure/scripts/src/issue/domain/branch.ts#L12) | Major `AaBpoHBb_jgBJHByMPAK` | The trim regex can backtrack on a long all-hyphen slug. | Trim leading and trailing hyphens with a linear scan or two anchored replacements; cover empty and long punctuation-only names. | fixed |
| Q7 | [`package-contracts/adapters/files.ts:14`](../../infrastructure/scripts/src/package-contracts/adapters/files.ts#L14) | Minor `AaDFDh77EA0Bk8tS9EXW` | `split("\\").join("/")` creates an array to normalize a path. | Use `.replaceAll("\\", "/")`; retain Windows-path coverage. | fixed |
| Q8 | [`package-contracts/domain/validate.ts:23`](../../infrastructure/scripts/src/package-contracts/domain/validate.ts#L23) | Minor `AaDFDh5nEA0Bk8tS9EXT` | A ternary restates the undefined fallback after `JSON.stringify`. | Use `rendered ?? String(value)`; keep `undefined` and symbol cases covered. | fixed |
| Q9 | [`package-contracts/domain/validate.ts:73`](../../infrastructure/scripts/src/package-contracts/domain/validate.ts#L73) | Minor `AaDFDh5nEA0Bk8tS9EXU` | The replacement text escapes a backslash in an ordinary string. | Use `String.raw` for the replacement while keeping the produced regex unchanged. | fixed |
| Q10 | [`shared/domain/layout.ts:4`](../../infrastructure/scripts/src/shared/domain/layout.ts#L4) | Minor `AaDAU-A_y0vepUx4FnAW` | Acronym membership uses an array scan. | Make `ACRONYMS` a `Set` and use `.has()` in `titleCase`. | fixed |
| Q11 | [`review-version/domain/manifest.spec.ts:81`](../../infrastructure/scripts/src/review-version/domain/manifest.spec.ts#L81) | Minor `AaCkZBKMv8--a__ZffrM` | Comparing `.length` hides the relevant collection when the assertion fails. | Assert `toHaveLength(METHOD_ARTIFACTS.length)` on the filtered lines. | fixed |
| Q12 | [`map/adapters/files.ts:76`](../../infrastructure/scripts/src/map/adapters/files.ts#L76) | Minor `AaCFksdWXFUGTcAAmGOX` | Ignored-directory membership uses an array scan. | Make `IGNORED_DIRS` a `Set` and use `.has()` at the walk site. | fixed |
| Q13 | [`map/domain/capabilities.ts:65`](../../infrastructure/scripts/src/map/domain/capabilities.ts#L65) | Minor `AaBsdAgrc4poDHW_U8-z` | The regex-escape replacement uses a doubly escaped replacement string. | Use `String.raw` for the replacement; assert punctuation tokens still match literally. | fixed |
| Q14 | [`map/domain/capabilities.ts:66`](../../infrastructure/scripts/src/map/domain/capabilities.ts#L66) | Minor `AaBsdAgrc4poDHW_U8-0` | The dynamic regex also escapes character classes inside a template string. | Use `String.raw` for the pattern template and preserve boundary behavior. | fixed |

## 🪜 Order

Address Q6 and Q5 with focused regression cases, then Q1–Q4 together because they share one
adapter pattern. The remaining findings are local substitutions; run the scripts project specs,
lint and typecheck after those edits.
