---
issue: 141
status: implemented
decision: accepted
---

# 🧭 Docs checks report on the portal, and only generated files gate CI

## Context

[`0011`](./0011-docs-system-enforcement.md) moved four docs checks into one CI gate,
`pnpm exec nx check-docs @monorepo/developer-portal`: broken relative links, the mirrored
`check-invariants.sh` rules, and decision filenames and frontmatter (including number collisions).
`bf29d16` took the step out of `ci.yml` and `3414e2c` (#141) deleted the target and
`tools/check-docs/index.ts`. Nothing recorded where each check went, so filed reports and a live
skill went on citing a gate that no longer exists.

## Result

**Nothing about docs content fails CI any more.** Two generated-file checks do, and the rest report
on the developer portal after `nx collect`:

| Check | Where it lives now | Blocks? |
| --- | --- | --- |
| `docs/FEATURES.md` is current | `pnpm docs:map --check`, in pre-commit and `ci.yml` | Yes |
| Review method version is current | `pnpm review:version --check`, in pre-commit and `ci.yml` | Yes |
| Broken relative links | `brokenLinkCount` in `apps/developer-portal/tools/collect/docs.ts`, shown on the Overview and Docs pages | No |
| Mirrored invariants (tag table, layout block, review history, scorecard and audit shape) | `collectInvariants` in `apps/developer-portal/tools/lib/invariants.ts`, shown on the Overview | No |
| Decision filename, frontmatter and number collisions | `compareDecisionShape` in the same file, calling `decisionProblems` from `tools/lib/decisions.ts`. It had no caller between `3414e2c` and this report | No |
| The `check-invariants.sh` rules on an agent's edit | [`.claude/hooks/check-invariants.sh`](../../.claude/hooks/check-invariants.sh), on Claude Code edits only | Yes, for that edit |

The mirrored invariants still don't run in CI, and a hand edit that breaks one passes every gate.

These filed reports cite `check-docs` as a gate. Their sections stay as written, and this table is
where the claim is corrected:

| Report | Claim | Now |
| --- | --- | --- |
| [`0002`](./0002-docs-drift-detection.md) | `check-docs` runs in `ci.yml` | It doesn't exist |
| [`0005`](./0005-nx-generators-and-ai-agent-setup.md) Confirmation | `check-invariants.sh`'s assertions "now also run in CI" | They never ran in CI after `bf29d16` |
| [`0011`](./0011-docs-system-enforcement.md) changes 1 and 3 | The link check, invariants and decision validator gate CI | They report on the portal, as above |
| [`0013`](./0013-linter-coverage.md), [`0014`](./0014-developer-portal-deployment.md), [`0018`](./0018-developer-portal-duplicated-facts.md) | `brokenLinkCount` gates CI | It's shown on the portal only |
| [`0020`](./0020-review-frontmatter.md) step 2 row 4 and two Confirmation rows | Two new `check-docs` rules over review `method:` | They belong in `pnpm review:version --check`, which already gates the method version |

## Options considered

| Option | Why not |
| --- | --- |
| Restore `check-docs` in CI | #141 removed it on purpose, after `bf29d16` ("broken links, exclude check from CI") had already pulled it from CI |
| Move the checks into `infrastructure/scripts` as a `docs:check` script | The parsers live in the portal, and a script reaching into an app breaks the `type:tooling` boundary |
| Leave `decisionProblems` uncalled | The skill tells agents a number collision gets caught; without a caller, nothing catches it anywhere |

## Consequences

0011 is marked superseded by this report. Its changes 2, 4, 5 and 6 stand, and change 7 shipped with
0014, so its status is `implemented`.

Anyone implementing 0020 hosts its two rules in `infrastructure/scripts/src/review-version`, not in
the portal: that is the one place a review-method rule still fails a commit.

Revisit if a docs defect reaches `master` that a blocking check would have stopped. The cheapest
gate then is running `nx collect` in CI and failing on any finding, which is what `check-docs` was.

## Confirmation

| Claim | Check |
| --- | --- |
| No `check-docs` target exists | `git grep -n check-docs -- nx.json '*/package.json' .github` returns nothing |
| Decision shape is checked again | `apps/developer-portal/tools/lib/invariants.spec.ts` `compareDecisionShape` fails if a reused number stops producing a finding |
| Only the two generated-file checks gate docs in CI | `grep -n "run:" .github/workflows/ci.yml` lists `docs:map --check` and `review:version --check`, and no other docs step |
