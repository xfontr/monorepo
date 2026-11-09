# 🧭 Workflows

What a kind of project needs from start to launch, and how far each project of that kind has got.
A **template** is the generic route, learned from the projects already shipped. A **project** picks
a template, switches its optional parts on or off, and is tracked through its GitHub milestone. The
developer portal's **Workflows** page draws both as a map of stages, a list of what's left, a strip
of commit activity and a grid of capability cards, each opening its details.

This replaces a hand-kept implementation plan. The plan drifted from GitHub, missed whole features
and answered "what's left?" only when someone asked Claude. Here GitHub holds the state, the files
hold the shape, and a sync copies the one onto the other.

## 🗂 Structure

```
docs/workflows/
  templates/<id>.yaml              stages, then capabilities, each with its lessons and reuse plan
  projects/<id>.yaml               which template, which milestone, switches, gates, settled items
  projects/<id>.snapshot.json      written by `pnpm workflow:sync`, never by hand
```

| Noun | Is | Lives in |
| --- | --- | --- |
| Stage | An ordered phase with a **gate**: what must be true to leave it | The template |
| Capability | One thing the project needs — a content audit, comments, a cutover. Required, or optional with a default | The template, or a project's `extras` for something only it has |
| Group | A switchable bundle of capabilities, such as a blog, that can span stages. It has no tickets and no progress of its own; switching it off switches off everything in it | The template |
| Ticket | A GitHub issue in the project's milestone with a `cap:<capability id>` label | GitHub |

## 🏷️ How a ticket finds its place

| The issue has | It shows |
| --- | --- |
| The milestone and `cap:comments` | Under the Comments capability |
| The milestone and no `cap:` label | Under **To organise** |
| A `cap:` label naming no capability, naming a group, or, while open, one switched off | Under **To organise**, with the reason |
| The project's `area` label, no milestone, and open | Under **To organise** until every gate is approved, then nowhere: from there on it is maintenance |
| Neither the milestone nor the area label | Nowhere: it isn't part of the effort ([`0035`](../decisions/0035-one-board-area-labels.md)) |

Filing by hand is the milestone plus one `cap:` label. `pnpm issue:add` sets no milestone, which is
why the sync also reads the area label: a ticket filed that way still surfaces, and placing it means
adding the milestone and the `cap:` label on GitHub. The `project-workflow` skill files a stage's
tickets from each capability's suggested ones, once the stage before it has passed its gate.

## 🚦 Status and progress

| Capability state | When |
| --- | --- |
| Off | An optional capability switched off, or one in a group switched off |
| Skipped | Settled in the project file as skipped, with a note |
| No tickets | On, with nothing filed (tickets closed as not planned don't count) |
| Planned | Tickets filed, none delivered |
| In progress | Some delivered, some open |
| Done | Every live ticket delivered, or settled as done with a note |

**Progress** is done capabilities over capabilities that are on and not skipped, so opting out of a
feature never drags the number. **Stages move on gates, not counts:** a stage is done once its gate
is approved, and the current one is the first whose gate isn't. A count can't say a launch happened
— Huella went live with three tickets still open — so a stage whose capabilities are all done
only shows *Ready for its gate*, and an approved one with work left keeps it under **What's left**.

## 📈 Activity

The sync also reads `git log`. Every commit whose subject names a ticket as `[#N]` adds its author
date to that ticket, and the page draws one timeline from the project's first such commit to its
last.

| Where | Shows |
| --- | --- |
| The strip under the skyline | Capabilities with a commit, per day, coloured by stage |
| The line on a card | Days with a commit, per week, on one scale shared by every card |
| *Quiet since* on a card | An open capability whose last commit is 21 days behind the project's latest |

It says when work happened, not how long it took: five minutes and a whole day are both one day with
a commit. A commit without `[#N]` counts nowhere, and neither does work that left no commit, such as
design done in Penpot, which is why such a card says *No commits* instead of drawing a flat line.

## ✍️ Editing

| What | How |
| --- | --- |
| Switch a capability, approve or reopen a gate, create a project | The Workflows page under `pnpm dev developer-portal`, which writes the project file keeping its comments. The deployed portal is read-only |
| Settle a capability without a ticket, add an extra | Edit `projects/<id>.yaml` |
| Refresh the tickets and the commit activity | `pnpm workflow:sync [<id>]` |
| Change the generic route | Edit the template. Every capability names the issues its lessons came from |

The portal's invariant checks validate every file. Each `reuse.from` path has to exist, and every id,
stage and switch has to resolve.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A template other than `website-rebuild` | A new file under `templates/`; nothing in the code knows any template by name |
| Weighting capabilities by size | Progress counts each capability once, since weighting by ticket count would reward splitting tickets |
| A milestone prompt in `pnpm issue:add` | One more optional pick beside the board; until then the area-label read above catches what it files |
| Board Status instead of open and closed | It needs a token the static portal doesn't have; see the [sync's README](../../infrastructure/scripts/src/workflow/README.md) |
