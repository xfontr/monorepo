# 💾 data

Files the repo's own tooling reads and writes, committed so every clone, every CI run and the
deployed portal see the same thing. `docs/` is prose for people. Anything a program parses goes here,
and its rules stay in the doc for whatever owns it.

## 🗂 Structure

| Folder | Written by | Read by | By hand |
| --- | --- | --- | --- |
| `telemetry/<log>/<branch>.csv` | [`pnpm usage:flush`](../infrastructure/scripts/src/usage/README.md), from the pre-commit hook | The portal's Tooling usage page, at `collect` | Never |
| `workflows/templates/<id>.yaml` | People, when a shipped project teaches the map something | `pnpm workflow:*`, the portal's Workflows page | Yes, against [the workflow rules](../docs/workflows/README.md) |
| `workflows/projects/<id>.yaml` | The `project-workflow` skill, the portal's wizard and Settings page under `pnpm dev` | `pnpm workflow:*`, the portal's Workflows page | Yes, for settlements and extras |
| `workflows/projects/<id>.snapshot.json` | [`pnpm workflow:sync`](../infrastructure/scripts/src/workflow/README.md) | The portal's Workflows page | Never |

## 📐 Rules

- **Not `.data/`.** That name is gitignored at any depth, because Nuxt and wp-editor keep throwaway
  local state there. Committing one would mix kept files with files that get wiped.
- **Outside every Nx project.** A flushed telemetry row makes nothing affected. The portal opts into
  `workflows/` through a `namedInputs` line in its own `package.json`, so a change there rebuilds the
  portal and nothing else.
- **Each folder belongs to one owner.** Its format, columns and rules are documented by that owner,
  linked in the table above, never restated here.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A third owner, such as committed wp-editor history | A new top-level folder here, a row in the table, and its path constant in the owner's adapter |
| A shared helper that resolves `data/<owner>` | Today each reader holds its own path constant. Worth adding once a third reader appears |
