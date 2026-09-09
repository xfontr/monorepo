# 🧭 Comment discipline: policy and skill, not a per-edit LLM gate

Spike: #82
Status: To implement

## Context

Issue #82 is titled "Improve Claude comments" with no body beyond "As title says" — the framing
came from a separately drafted proposal, not the issue thread. That proposal asks for three
artifacts: a `## Comments` section appended to CLAUDE.md, a new `.claude/skills/comment-cleanup/`
skill, and a `PostToolUse` hook on every `Edit|Write|MultiEdit` that sends newly added comment
lines to an LLM judge and blocks with a reason when it finds narration or diff-narration.
CLAUDE.md already carries one line on this ("Comments state the why, never the what") that is
prose-only — nothing in `packages/configs/src/eslint/` enforces it, so the gap the proposal is
responding to is real. What's in tension is whether the proposed *shape* — one more paragraph, one
more skill, one more always-on hook — is how this repo actually enforces things, or over-builds it.

## Result

Two of the three artifacts hold up with small adjustments; the third does not work as specified.

1. **CLAUDE.md section — adopt with changes.** The proposed content is right-sized for this file's
   existing terseness, but `## Comments` breaks `house-docs`' rule that every `##` heading carries
   an emoji, and it duplicates the "Comments state the why, never the what" bullet already under
   `## ✍️ Style` rather than replacing it — landing both invites the same "two places must agree"
   drift CLAUDE.md itself names as the repo's standing failure mode. Fold the new section in under
   an emoji heading and cut the existing bullet down to a pointer at it.
2. **`comment-cleanup` skill — adopt close to as specified.** Its scope (comment-only edits,
   byte-identical code diff, a report instead of enumerating deletions) matches how the other
   skills in `.claude/skills/` are written, and at roughly the same length as `nuxt-module-route`
   (151 lines) it isn't outsized for the directory. It doesn't overlap the harness-level `simplify`
   or `code-review --fix` skills, which mix code and comment changes — this one's guarantee is that
   it never touches code, which those don't offer. The only gap: CLAUDE.md's `## 🛠️ Skills` table
   lists every skill under `.claude/skills/` today; add a row so it isn't the one exception.
3. **`PostToolUse` prompt hook — reject as specified.** `type: "prompt"` hooks return
   `{"ok": true|false, "reason": ...}` — `"decision": "block"` is the *command*-hook and
   `ConfigChange`/`Stop` output shape, a different contract the docs cover in a separate section
   (`code.claude.com/docs/en/hooks-guide.md`, "Prompt-based hooks"). The hook prompt as drafted
   asks the judge model to return `{"decision": "block", ...}`, a field Claude Code's prompt-hook
   handler doesn't read — the hook would run, cost a Haiku call, and never flag anything. Fixing
   the field name doesn't make it do what the proposal wants either: `PostToolUse` fires after the
   edit lands, so it can't block the write, and without `continueOnBlock: true` an `ok: false`
   ends the turn with a warning line rather than sending the reason back to Claude to fix. Past the
   schema bug, it also changes the shape of every edit in the repo: the two hooks that exist today
   (`eslint-fix.sh`, `check-invariants.sh`) are both deterministic shell, exit fast, and match
   CLAUDE.md's own "enforced where it can be" framing; this would be the first LLM-judged hook in
   the chain, adding a third per-edit call and a real false-positive risk to something that
   currently costs nothing but CPU.

## Options considered

| Option | Why not |
| --- | --- |
| Hook exactly as drafted | Returns `decision: block`, a field `type: "prompt"` hooks don't read — it would never fire |
| Hook with the field fixed to `ok`/`reason` | Still can't block on `PostToolUse` (edit already landed) and, without `continueOnBlock: true`, ends the turn on a warning instead of routing the reason back to Claude — doesn't achieve the "auto-correct in the same turn" the proposal wants |
| A custom ESLint rule for comment quality | "Why vs. what" is a judgment call no static rule can make; the repo has no bespoke-plugin infrastructure today and other unenforceable CLAUDE.md prose (the git rules, the dependency check-in reasoning) is left as prose without one |
| Rely on the existing `simplify` / `code-review --fix` skills instead of a new one | Both mix code and comment edits; this proposal's value is the comment-only, byte-identical-diff guarantee neither offers |
| `## Comments` heading verbatim | Breaks `house-docs`' "every `##` heading carries an emoji" rule |

## Consequences

Unlocks a deliberate, on-demand comment-quality pass (the skill) backed by a policy CLAUDE.md can
now point to instead of stating in one line — closing the actual gap #82 names, since nothing
today enforces "why not what" beyond prose. Forecloses, for now, a real-time gate on every edit:
artifact 3 doesn't ship until the hook is rewritten against the documented `ok`/`reason` contract,
`continueOnBlock: true` is set if the intent is to redirect Claude rather than end the turn, and
it's piloted long enough to know its false-positive rate before joining an otherwise fully
deterministic hook chain. Revisit once that pilot data exists, or if the manual skill turns out to
catch violations too late to be useful on its own.
