# 🤖 The agent setup as one inspectable system

The repository's agent guidance is Claude Code's native layout: `CLAUDE.md` files for always-on
guidance, fifteen skills under [`.claude/skills/`](../../.claude/skills/) for task-specific
procedures, and settings, hooks and subagents beside them under `.claude/`. Every one of them is
tracked and edited in place.

## 📄 Why `CLAUDE.md` reads the way it does

The root file says outright what it is for: what the READMEs do not say, or what gets done wrong
anyway. It is not project documentation restated for a machine — the actual documentation is the
READMEs, which a human and an agent both read. `CLAUDE.md` exists where a plain reading of the code
has produced a wrong edit before: style rules, the "looks reasonable and is wrong here" list and
the pairs of files that must agree.

Every project's `CLAUDE.md` follows the same shape: a short pointer to its README, then the
invariants worth losing a build over. Claude loads the root file on every turn and a project's file
once it reads something in that project.

## 🪝 The hooks

Claude's two `PostToolUse` hooks fire after every edit.

| Hook | Enforces |
| --- | --- |
| [`eslint-fix.sh`](../../.claude/hooks/eslint-fix.sh) | Runs `eslint --fix` on the touched file, so style is corrected mechanically |
| [`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) | Catches known cross-file and generated-file mistakes immediately after an edit |

The same invariant checks run independently in scripts and CI where practical. Claude's hook is
earlier feedback, not the only authority, so an edit made by hand reaches the same repository
gate.

## 🚫 What the deny list forecloses

[`.claude/settings.json`](../../.claude/settings.json) denies editing generated changelogs and the
feature map, running a release and reading real `.env` files. These are guardrails over rules
stated in [`CLAUDE.md`](../../CLAUDE.md): generated artifacts have a named renderer, and real
environment values are outside the repository's documentation surface.

## 🛠 What the skills are collectively

A skill loads for a matching task rather than on every turn. The split keeps always-applicable
invariants in `CLAUDE.md` while detailed procedures such as adding a package, writing a spec or
filing an issue stay out of unrelated context. [`docs/FEATURES.md`](../FEATURES.md) lists every
skill and its source; the map is rendered by `pnpm docs:map`, never maintained by hand.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A second agent with a different discovery convention | Pick one editable tree and generate the other from it; two hand-kept copies drift |
| A runtime hook another tool can run too | Move the check into a script both call; until then scripts and CI remain the shared authority |
