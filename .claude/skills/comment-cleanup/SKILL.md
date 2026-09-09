---
name: comment-cleanup
description: Strip AI-generated comment noise from code — narration, diff-addressed notes, stale and bloated comments — while keeping the ones that carry real context. Use this whenever the user asks to clean, prune, tidy, audit or review comments, says there are too many comments or the comments are too verbose, asks for a "comment pass" or to "de-AI the comments", or asks to tidy a file, staged diff or PR before committing. Use it even if they only gesture at it ("these comments are noise", "can you thin these out").
---

# Comment cleanup

A comment-only editing pass over the target files.

## Scope

**Edit comments. Do not touch code.** No renames, no extractions, no logic changes, no drive-by improvements. When a comment exists only because the code beneath it is unclear, the comment survives this pass — it is doing real work, badly — and goes in the report as a refactor candidate. Fixing that is a different task the user can ask for separately.

Tidy whitespace left by deleted comments. Otherwise the code must be byte-identical. Verify that before reporting: `git diff -w --ignore-blank-lines` should show comment lines only.

## The gauntlet

Run every comment through these in order. First match wins.

**1. Narration.** Restates the adjacent line, the parameter names, the type, or the signature, or marks a block end. → Delete. This is the bulk of what you'll find. The code was fine; leave it alone.

**2. Diff narration.** Written to a reviewer rather than a reader: "updated to use the v2 client", "removed the old fallback", "added per feedback". → Delete. Test: does the sentence still make sense to someone who never saw the PR? If not, it was a commit message in the wrong place.

**3. Moving target.** "See spec §7", "per the requirements doc", "as in the design doc". → Delete if the line never needed a comment, or rewrite to encode the substance directly. A section number is never durable regardless of what it indexes. Ticket IDs, RFCs, permalinks and maintained repo docs at stable paths are fine — but only as a trailing breadcrumb. The comment must stand alone with the reference removed.

**4. Bloated why.** The rationale is real but overlong or misplaced. Cut to the single non-obvious fact a reader needs *at that line*. Drop the mechanism the code already shows, where the value gets consumed downstream, and the justification of the justification. Prefer several short comments adjacent to the lines they govern over one header block three screens up — proximity is what keeps a comment true when the code changes.

Some rationale is irreducibly multi-part: a workaround, plus the upstream bug, plus when it can be removed. Length alone isn't the defect; unearned length is. Never shorten at the cost of information.

The trap: "carries a real why" and "is worded minimally" are separate judgments. Passing the first does not exempt a comment from the second. A five-line block almost never survives intact.

**5. Stale.** Describes code or behavior that no longer exists. → Delete, or correct it if the point still holds. A wrong comment is worse than none.

**6. Otherwise, keep.** Non-obvious constraint, surprising-but-necessary line, a contract the signature can't carry (units, ranges, side effects, failure modes), an edge case, the source of a copied algorithm. Don't reword comments that are already tight — churn on good comments is its own diff noise. But "already fine" means already minimal, not merely correct; a correct-but-bloated comment is a rule-4 target, not a keep.

## Keep these — they look deletable and aren't

- **Sync obligations.** "Keep in sync with the router config", "mirrors the overview page". The link *is* the why: it's the only thing stopping the next editor from drifting one copy.
- **Literal semantics.** `// (width, height), portrait`, `// pence not pounds`. A literal can't state its own convention.
- **Format contracts.** "Two decimals, as the invoice PDF expects." Pins output to an external expectation.
- **Section banners.** `// --- Auth ---` is navigation, not narration. House style; keep unless asked.

## Asymmetry

Wrongly deleting a real warning costs far more than leaving one mediocre comment behind. When unsure about a *why*, keep it and flag it. When unsure about a *how*, delete it.

## TODOs

Keep them; no issue ID required. Two exceptions: a TODO for work that's visibly been done is stale (rule 5), and a TODO that's deferral in disguise (`// TODO: handle errors` on a path that should already handle them) stays but gets flagged — deleting it would hide real incompleteness.

## Docstrings

All six rules apply inside docstrings, including rule 3. A docstring that re-emits the function name and parameter types is narration. One that documents preconditions, boundary ownership or failure behavior is a contract — trimming it to a summary line deletes the contract. A one-line summary on a public function, endpoint or exported API is legitimate even when short.

## Report

Keep it to a few lines:

1. Counts per file: deleted / rewritten / kept.
2. Flags: comments papering over unclear code, deferral TODOs, comments you couldn't verify and kept conservatively.
3. Borderline calls, one line each, so the user can overrule.

Don't enumerate the deleted narration. That's the job, not news.

## Examples

Delete — narration over clean code, code untouched:

    // Parse the JSON body into an object
    const body = JSON.parse(req.body)
    // Get the email, returns undefined if missing
    const email = body.email

Rewrite — substance kept, moved to the line it governs:

    // Before, one header block:
    // This handles rounding. Stripe rounds half-to-even but our ledger rounds
    // half-up, which caused reconciliation breaks in the past. Amounts must be
    // converted to cents before arithmetic. The result is then compared to the
    // original to detect drift.

    // After:
    const cents = toCents(amountEur)  // float euros drift under arithmetic
    // Stripe rounds half-to-even, ledger half-up — integer cents or you get
    // 1c reconciliation breaks (FIN-2231)
    const rounded = roundHalfUp(cents)

Keep — exactly the comment that must survive:

    // Stripe sends `null` and the string "null" for a cleared field.
    // Both checks are required — do not simplify.
    if (value == null || value === 'null') return undefined
