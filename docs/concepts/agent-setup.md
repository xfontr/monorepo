# 🤖 The agent setup as one inspectable system

The repository has one editable instruction surface for both Codex and Claude: `AGENTS.md` files
for always-on guidance and fourteen root-scoped skills under [`.agents/skills/`](../../.agents/skills/)
for task-specific procedures. Claude's equivalent files are generated adapters, so an instruction
is maintained once even when both agents work in different checkouts.

## 📄 Why `AGENTS.md` reads the way it does

The root file says outright what it is for: what the READMEs do not say, or what gets done wrong
anyway. It is not project documentation restated for a machine — the actual documentation is the
READMEs, which a human and an agent both read. `AGENTS.md` exists where a plain reading of the code
has produced a wrong edit before: style rules, the "looks reasonable and is wrong here" list and
the pairs of files that must agree.

Every project's `AGENTS.md` follows the same shape: a short pointer to its README, then the
invariants worth losing a build over. Codex only loads files between the repository root and the
directory where its session started, so an agent working from the root must read the nearest
project file before changing that project.

## 🔄 One source, two discovery surfaces

[`agents-sync`](../../infrastructure/scripts/src/agents-sync/README.md) converts the canonical
sources into the names and locations Claude discovers. The generated files are gitignored; a clean
checkout can recreate all of them with `pnpm agents:sync`.

| Editable source | Codex reads | Claude reads |
| --- | --- | --- |
| Root and project `AGENTS.md` files | The source directly | A sibling generated `CLAUDE.md` |
| `.agents/skills/<name>/` | The source directly | A generated `.claude/skills/<name>/` mirror |
| `.claude/settings.json`, `.claude/hooks/`, `.claude/agents/` | — | The native files directly |

The renderer records its output in `.claude/generated.json`. That manifest lets it remove stale
adapters without treating native Claude settings, hooks or subagent definitions as generated. The
`--check` mode reports a missing or stale adapter without writing it.

All skills live at the root and project-specific names carry their scope, such as
`content-new-vendor` and `i18n-new-vendor`. This is not just tidiness: a Codex session started at
the repository root does not discover a skill hidden under a package directory.

## 🪝 Native Claude controls stay native

Claude's two `PostToolUse` hooks fire after every edit; they are runtime integration rather than
shared guidance and therefore remain under `.claude/`.

| Hook | Enforces |
| --- | --- |
| [`eslint-fix.sh`](../../.claude/hooks/eslint-fix.sh) | Runs `eslint --fix` on the touched file, so style is corrected mechanically |
| [`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) | Catches known cross-file and generated-file mistakes immediately after an edit |

The same invariant checks run independently in scripts and CI where practical. Claude's hook is
earlier feedback, not the only authority, so an edit made by Codex or a human reaches the same
repository gate.

## 🚫 What the deny list forecloses

[`.claude/settings.json`](../../.claude/settings.json) denies editing generated changelogs and the
feature map, running a release and reading real `.env` files. These are Claude-specific guardrails
over shared rules in [`AGENTS.md`](../../AGENTS.md): generated artifacts have a named renderer, and
real environment values are outside the repository's documentation surface.

## 🛠 What the skills are collectively

A skill loads for a matching task rather than on every turn. The split keeps always-applicable
invariants in `AGENTS.md` while detailed procedures such as adding a package, writing a spec or
filing an issue stay out of unrelated context. [`docs/FEATURES.md`](../FEATURES.md) lists every
skill and its source; the map is rendered by `pnpm docs:map`, never maintained by hand.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Another agent with a different discovery convention | Add an output adapter to `agents-sync`; do not add another editable guidance tree |
| Bidirectional edits to generated files | Keep them out — accepting two writable sources recreates the drift this system removes |
| A shared runtime hook standard | Move a check only when both agents can execute the same integration; until then scripts and CI remain the shared authority |
