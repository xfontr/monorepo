# 🤖 agents-sync

`pnpm agents:sync` materializes Claude's ignored compatibility files from the repository's canonical
`AGENTS.md` files and `.agents/skills/`. It keeps one editable copy of every instruction while both
agents receive the filenames and skill locations they discover natively.

```sh
pnpm agents:sync
pnpm agents:sync --check
```

## 🗂 Structure

```text
index.ts            hands main to run()
main.ts             builds the output set, checks it or writes it
adapters/files.ts   discovers sources and reads, writes or removes generated files
domain/generate.ts  maps paths, inserts source notices and identifies safe stale outputs
```

The generated manifest at `.claude/generated.json` is ignored with the files it records. Removal is
limited to paths previously written into that manifest and recognised as a `CLAUDE.md` or a file
under `.claude/skills/`; native settings, hooks and subagent definitions are outside its reach.

## 🚀 Workflow

Edit only `AGENTS.md` or `.agents/skills/`, then run `pnpm agents:sync`. Every generated Markdown
file names its source, so a Claude session that opens the adapter is pointed back to the canonical
file before it can create a second source of truth.

This is an explicit setup command rather than a lifecycle script. A fresh clone intended for Claude
needs one run after install; Codex reads the canonical sources directly and needs none.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A third agent with genuinely different metadata | Add another target adapter beside the Claude mapping; keep shared prose canonical rather than teaching the renderer semantic rewrites |
| Claude and Codex require different instructions for the same task | Put the difference in a small native appendix or configuration file; do not add conditional prose to every shared skill |
| Generated adapters become release inputs | Track them and run `agents:sync --check` in CI; while they are local compatibility files, requiring them in CI would fail every clean checkout |
