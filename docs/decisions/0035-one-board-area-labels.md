---
issue: 72
status: implemented
decision: accepted
---

# 🧭 One permanent board, with area labels and milestones

## Context

[`0008`](./0008-issue-tracking-boards.md) kept one GitHub Project board per app, on the grounds that
the boards mirrored the Nx tags and that an app "never completes". Both stopped being true:

- Huella Legal reached launch, and a board per app turned into a board that dies with the app.
- `Infrastructure` collected deployment and pipeline work that belonged to the app being deployed.
- `DX` collected repo-wide work that had no folder at all.

## Result

Three questions, three GitHub features, none of them a board per thing:

| Question | Carried by | Lifetime |
| --- | --- | --- |
| What state is it in? | The `Monorepo` board, default Status field (Todo / In Progress / Done) | The repo's |
| Where does the code live? | One area label: `app:<name>`, `package:<name>`, `infra:<name>`, or `repo` for cross-cutting work | The folder's |
| Which finite effort is it part of? | A milestone, e.g. `Huella Legal`, closed when the effort ships | The effort's |

Deployment and pipeline work takes the deployed app's label. The old Huella Legal, DX and
Infrastructure boards are closed, not deleted; every item they held, closed ones included, is on
`Monorepo` with its Status carried over.

The tooling reads the area label instead of the board title:

| Where | What changed |
| --- | --- |
| `infrastructure/scripts/src/issue/domain/branch.ts` `areaFor` | The branch's middle segment is the first `app:` > `package:` > `infra:` label minus its prefix, else `repo` |
| `infrastructure/scripts/src/issue/pick.ts` | Builds the branch from `areaFor`; skips the board prompt, and its *back* row, when one board is open |
| `infrastructure/scripts/src/issue/add.ts` `pickProject` | Files onto the only open board without asking |
| `infrastructure/scripts/src/issue/domain/brief.ts` `LABEL_ROOTS` | `infra:` maps to `infrastructure/`, and the branch area matches folders as the board slug did |

## Options considered

| Option | Why not |
| --- | --- |
| Keep a board per app ([`0008`](./0008-issue-tracking-boards.md)) | Every finished app leaves a dead board, and work that spans apps has no right board |
| One board, a custom "Area" single-select field | A second copy of what the labels already say, and `issue:brief` already reads labels to find folders |
| Keep the board slug as the branch's middle segment | With one board it reads `monorepo` on every branch and carries nothing |
| Make an area label mandatory in `issue:add` | Cross-cutting work has no folder to pick; `repo` as the fallback costs no prompt |

## Consequences

A new app or package needs a label, not a board. A launch or a redesign is a milestone. A second
board comes back only if a genuinely separate tracker is needed, such as for another repo, and
`issue:add`/`issue:pick` will prompt for it again on their own.

The two "Item closed" and "Pull request merged" → Done workflows on the board are set in GitHub's UI.
`gh` has no command for them, so they are not in the repo.

## Confirmation

| Claim | Check |
| --- | --- |
| One open board | `gh project list --owner xfontr` lists only `Monorepo` |
| Branches carry the area | `src/issue/domain/branch.spec.ts` pins `areaFor`, and `src/issue/pick.spec.ts` pins `feature/huella-legal/…` and `fix/repo/…` |
| A single board asks nothing | `pick.spec.ts` and `add.spec.ts` assert no board `select` with one open board |
