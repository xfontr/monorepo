# 🧭 Workflows

What a kind of project needs from start to launch, which part needs which, and how far each project
of that kind has got. A **template** is a map of blocks learned from the projects already shipped. A
**project** picks a template, switches its optional blocks on or off, and files them as GitHub
tickets. From then on GitHub is the record and the developer portal's **Workflows** page draws it:
what is waiting on you, what is ready, what is in flight, and the map behind it.

The map replaces a linear stage-gate plan. Huella Legal never moved stage by stage. The build gate
passed while discovery items were still arriving (#324, #328, #392), hardening ran alongside the
build, and rendering, a foundations item, landed a week before launch (#302). Its real ordering
lived in `Blocked by:` lines in issue bodies, which no tool read. Here the order is links between
blocks, and once filed, links between tickets that GitHub itself holds.

## 🗂 Structure

```
docs/workflows/
  templates/<id>.yaml              the blocks, what each needs, its lessons and reuse plan
  projects/<id>.yaml               which template, which milestone, switches, settled blocks, extras
  projects/<id>.snapshot.json      written by `pnpm workflow:sync`, never by hand
```

| Noun | Is | Lives in |
| --- | --- | --- |
| Block | One thing the project needs — a content audit, comments, a cutover, a sign-off. Required, or optional with a default. The code calls it a capability | The template, or a project's `extras` for something only it has |
| Need | A `dependsOn` link from one block to another it can't start without | The block |
| Stage | A colour and a label for a family of blocks — discovery, design, launch. It orders nothing | The template |
| Group | A switchable bundle of blocks, such as a blog. Switching it off switches off everything in it, and blocks that needed one of them simply stop waiting on it | The template |
| Ticket | A GitHub issue in the project's milestone with a `cap:<block>` label | GitHub |

## 🧱 Three kinds of block

| `kind` | What it is | Huella examples |
| --- | --- | --- |
| `spike` | Answers a question; its answer changes the shape of later tickets | Content probe #185, hosting #186 |
| `owner` | Only the project's owner can close it: approve a direction, pick a provider, hand over a credential, point DNS | Design choice #208, cutover DNS #251, Grafana provisioning #212, which waited 39 days |
| `build` (the default) | Agent-sized code work with criteria a check can verify | Everything else |

A gate is an `owner` block. `scope-signoff`, `design-approval` and `go-live` hold back only the
blocks that need them, and closing the ticket is the approval. Nothing else waits.

## 🤝 The contract with GitHub

The map seeds the plan, and filing writes it to GitHub. **After that, GitHub wins**: change a
dependency on the issue, never in the file.

| In the map | On GitHub |
| --- | --- |
| Project | Milestone, plus the area label ([`0035`](../decisions/0035-one-board-area-labels.md)) |
| Block | A `cap:<id>` label on each of its tickets |
| A block's needs | GitHub's own blocked-by link, from each new ticket to every open ticket of each `build` block it needs |
| `owner` block | Its tickets carry the `owner` label |
| `spike` block | Its tickets carry the `spike` label |
| Someone is on it | A branch linked on the issue, which `pnpm issue:pick` makes through `gh issue develop` |
| Done or dropped | Closed as completed, or closed as not planned |

## 📏 The rules

Each rule is there because of something Huella paid for.

| Rule | What it prevents |
| --- | --- |
| **Links decide the order, not stages.** A ticket is ready when every ticket it is blocked by is closed | Build waiting on a gate that hardening and late discovery ignored anyway |
| **Decide before you file.** A block's tickets are filed only once every `spike` and `owner` block it needs is closed. A block that only needs `build` blocks can be filed as soon as those have tickets, linked to them | Build tickets filed the night before the final design (#208); providers swapped after they were wired — Mailchimp to Kit (#242 → #299), a mailto to a form (#243 → #301), a search page to a dialog (#248 → #316) |
| **Unknowns and waits first.** Ready tickets are listed by how many open tickets wait behind them, and `owner` tickets sit in their own column at the top | Hosting decided on paper and changed five times (#186, #244, #302, #377); the feature inventory skipped, so comments, the about page and hidden categories turned up late |
| **A host or provider change is its own spike and sign-off**, never part of another ticket | Cloudflare going in under the lint ticket #231 inside PR #370, then reverted two days later (#377, #378) |
| **Deploy work is done on a real preview deploy**, not on a green local check | #382, #387, #388 and #395, all found only by the real deploy |
| **A blocked ticket can't be picked.** `pnpm issue:pick` reads the links live and refuses while one is open, unless given `--force` | An agent starting on a snapshot that went stale an hour ago |

None of it depends on how many agents run at once. One ticket at a time or a hundred, the ready list
is the same list.

## 🚦 Status

A ticket's status comes from GitHub alone, so it never needs updating by hand.

| Ticket status | When |
| --- | --- |
| In flight | Open, with a branch linked on the issue |
| Blocked | Open, with an open ticket in its blocked-by links |
| Waiting on you | Open, unblocked, and labelled `owner` |
| Ready | Open, unblocked, and not the owner's |
| Done / Dropped | Closed as completed / as not planned |

A block's state comes from its switch, the project file and its tickets.

| Block state | When |
| --- | --- |
| Off | Switched off, or in a group switched off |
| Skipped | Settled in the project file as skipped, with a note |
| Waits | On, nothing filed, and a need still holds it back under the rule above |
| Can file now | On, nothing filed, and nothing it needs holds it back |
| Planned | Tickets filed, none delivered |
| In progress | Some delivered, some open |
| Done | Every live ticket delivered, or settled as done with a note |

**Progress** is done blocks over blocks that are on and not skipped, so opting out of a feature
never drags the number. The **map** puts each block in a wave, one column right of the latest block
it needs, so a column is what can run side by side.

## 🏷️ How a ticket finds its place

| The issue has | It shows |
| --- | --- |
| The milestone and `cap:comments` | Under the Comments block |
| The milestone and no `cap:` label | Under **To organise** |
| A `cap:` label naming no block, naming a group, or, while open, one switched off | Under **To organise**, with the reason |
| The area label, no milestone, and open | Under **To organise** while any block that is on is unfinished, then nowhere: from there on it is maintenance |
| Neither the milestone nor the area label | Nowhere: it isn't part of the effort |

`pnpm issue:add` sets no milestone, which is why the sync also reads the area label. Placing such a
ticket means adding the milestone and the `cap:` label on GitHub.

## 📈 Activity

The sync also reads `git log`. Every commit whose subject names a ticket as `[#N]` adds its author
date to that ticket, and the page draws one timeline from the project's first such commit to its
last.

| Where | Shows |
| --- | --- |
| The strip under the map | Blocks with a commit, per day, coloured by stage |
| The line on a card | Days with a commit, per week, on one scale shared by every card |

It says when work happened, not how long it took: five minutes and a whole day are both one day with
a commit. A commit without `[#N]` counts nowhere, and neither does work that left no commit.

## ✍️ Commands

| Need | How |
| --- | --- |
| Refresh the snapshot the portal draws | `pnpm workflow:sync [<id>]` |
| What can be taken now, live from GitHub | `pnpm workflow:next <id>` |
| See what filing a block would create | `pnpm workflow:file <id> <block>` |
| File it | `pnpm workflow:file <id> <block> --yes` |
| Switch a block or a group, create a project | The Workflows page under `pnpm dev developer-portal`, which writes the project file keeping its comments. The deployed portal is read-only |
| Settle a block without a ticket, add an extra | Edit `projects/<id>.yaml` |
| Change the generic map | Edit the template. Every block names the issues its lessons came from |

`workflow:file` uses the block's suggested `tickets`, or one ticket from its title and `doneWhen`
when it has none. The [sync's README](../../infrastructure/scripts/src/workflow/README.md) has the
details. The portal's invariant checks validate every file. Each `reuse.from` path has to exist,
every id, stage and switch has to resolve, and `dependsOn` may not loop.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A template other than `website-rebuild` | A new file under `templates/`; nothing in the code knows any template by name |
| Board Status (Todo / In Progress) | Reading `projectItems` needs a token with the `read:project` scope; a linked branch already says a ticket is taken |
| Sub-issues per block | Most blocks hold one or two tickets, so a parent issue each is noise; the `cap:` label already groups them |
| `/ship-issue` taking the top of the ready list itself | The workflow's Pick phase would call `workflow:next` before `issue:pick` |
| Backfilling Huella's links on GitHub | Huella shows its order from the template's links, plus the nine native ones it had (#192–#201) |
| Weighting blocks by size | Progress counts each block once, since weighting by ticket count would reward splitting tickets |
