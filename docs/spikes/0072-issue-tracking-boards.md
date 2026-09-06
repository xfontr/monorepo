# 🧭 One board per app, not one board with labels

Spike: #72
Status: Won't implement

## Context

The repo runs 4 GitHub Project boards — Huella Legal, Technical Docs, Infrastructure, Monorepo —
and it's easy to read that as four projects that don't belong together, rather than four views into
one. The alternative on the table was collapsing to a single board and separating concerns with
labels and/or milestones instead.

`pnpm issue:pick` and `pnpm issue:add` ([infrastructure/scripts/src/issue](../../infrastructure/scripts/src/issue/README.md))
already assume the four-board shape: `pick`'s first prompt is a project select, and `listIssues`
filters an issue list down to the ones sitting on that project before showing any of them.

## Result

Keep the four boards. They aren't an accident of how the projects were created — they mirror the
same split the Nx tags already enforce in code: two apps (`huella-legal`, `tech-docs`), the tooling
layer (`infrastructure`), and repo-level work that belongs to neither. A board answers "what's left
in this app", and that question is cleaner with a board per app than with one board and a field you
have to read on every card to get the same answer.

Collapsing to one board also isn't a simplification of the tooling: `pick`'s project-select prompt
would become a label-select prompt, same number of steps, same information, just moved from board
identity to a label value. There's no ceremony being removed, only relocated.

## Options considered

| Option | Why not |
| --- | --- |
| One board, a label per app/area | Doesn't reduce a single prompt in `issue:pick` — the project select becomes a label select. Each board also loses its own status columns and custom fields unless a "which app" field is added back on the shared board, which is the same partition the four boards already give for free |
| One board, milestones per app/area | Milestones are meant to group toward a release, not to stand in for a permanent product boundary — `huella-legal` isn't a milestone of `monorepo`, it's a separate deliverable that never "completes" |
| One board with a custom field, filtered saved views per app | Closest functional match to today's four boards, but recreates them inside one board rather than removing anything — the four-board split already gives that per-app view natively, without a field to maintain |

## Consequences

Nothing changes: the four boards stay, and `issue:pick`/`issue:add` keep assuming one project =
one scope. What this forecloses is a single "everything, prioritized together" glance across apps —
if that view turns out to matter, it's a fifth thing to add (a saved cross-repo search, or a
lightweight "now" board), not a reason to revisit this file. Revisit only if a fifth genuinely
cross-cutting board keeps wanting to exist, or if the four ever stop mapping to the Nx tags they
mirror today.
