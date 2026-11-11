# 🧭 Workflows

What a kind of project needs from start to launch, which part needs which, and how far each project
of that kind has got. A **template** is a map of blocks learned from the projects already shipped. A
**project** picks a template, chooses its features once, and files the blocks as GitHub tickets.
From then on GitHub is the record and the developer portal's **Workflows** page draws it: what is
left, each stage's blocks, and the map of what blocks what, on any day since the first commit.

The map replaces a linear stage-gate plan. Huella Legal never moved stage by stage. The build gate
passed while discovery items were still arriving (#324, #328, #392), hardening ran alongside the
build, and rendering, a foundations item, landed a week before launch (#302). Its real ordering
lived in `Blocked by:` lines in issue bodies, which no tool read. Here the order is links between
blocks, and once filed, links between tickets that GitHub itself holds.

## 🗂 Structure

This page is the rules; the files live in [`data/workflows/`](../../data/README.md), which the
scripts and the portal read.

```
data/workflows/
  templates/<id>.yaml              the blocks, what each needs, its lessons and reuse plan
  projects/<id>.yaml               which template, which milestone, switches, ticket size, settled blocks, extras
  projects/<id>.snapshot.json      written by `pnpm workflow:sync`, never by hand
```

| Noun | Is | Lives in |
| --- | --- | --- |
| Block | One thing the project needs — a content audit, comments, a cutover, a sign-off. Required, or optional with a default. The code calls it a capability | The template, or a project's `extras` for something only it has |
| Need | A `dependsOn` link from one block to another it can't start without | The block |
| Stage | A colour and a label for a family of blocks — discovery, design, launch. It orders nothing | The template |
| Feature | One switch in the plan: an optional block such as storybook, or a `groups` entry bundling several, such as the blog. None is special; switching one off takes its blocks out of the map, and whatever needed them waits on what they needed instead | The template's `optional` blocks and `groups`; the project's `switches` |
| Ticket | A GitHub issue in the project's milestone with a `cap:<block>` label, or several when blocks share it | GitHub |
| Ticket size | How many blocks share a ticket when filed: `block`, `stage` or `lean` | The project's `ticketSize` |
| Complexity | A Fibonacci estimate of how much a person has to understand, decide and check, whoever writes the code | The template's `complexity` per block; the board's `Complexity` field per ticket |

## 🧩 Templates

| Template | For | Blocks with defaults on |
| --- | --- | --- |
| [`website-rebuild`](../../data/workflows/templates/website-rebuild.yaml) | An existing site, usually WordPress, rebuilt on the same brand: discovery spikes, migration, redirects and a domain cutover | 41 |
| [`new-website`](../../data/workflows/templates/new-website.yaml) | A site started from nothing: the same map with everything only an old site needs taken out, and a few blocks folded together | 17 |

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

## 🎟 Ticket size

A small site still has 17 blocks, and a rebuild 41. Filing one ticket each is the right grain for
agents working in parallel, and too fine for one person who would rather ship six blocks in a PR.
The project's `ticketSize` changes how many tickets filing creates, never the map: a ticket with
several `cap:` labels counts under each of those blocks, and closing it finishes all of them.
The size is fixed once the milestone holds one ticket with a `cap:` label, so every block filed
later, a feature switched on midway included, is grouped the same way; a ticket added by hand
doesn't count.

| `ticketSize` | One ticket per | `new-website` | `website-rebuild` |
| --- | --- | --- | --- |
| `block` (the default) | Block, or each of its suggested tickets | 17 | 41 |
| `stage` | Stage, for its build blocks; each spike and owner block stays its own | 8 | 16 |
| `lean` | The same, with every spike in one ticket | 8 | 12 |

Counts are with each template's defaults switched on. Merging never breaks a rule below:

- **Only build blocks share a ticket**, and spikes only with spikes. A spike's answer reshapes later
  tickets, and an owner block is closed by the owner, so neither hides inside build work.
- **A stage splits where an owner or spike block inside it sits between its build blocks.** In
  `website-rebuild`, the design lab and the component inventory are two tickets, because design
  approval comes between them.
- **A block still waiting is left out** and files later in a ticket of its own stage. That is why
  the portal's counts say *about*.
- **Needs inside the ticket are dropped; needs outside it become its blocked-by links.**

`pnpm workflow:file <id> <a> <b> <c>` merges exactly the blocks named, under the same rules, for a
one-off without changing the project's size.

## 🧮 Complexity

Points measure the problem, not the typing. A block a few prompts produced can still be an 8 if
it carries many decisions; how much of it AI wrote changes how fast points close, never the points.

| Points | Looks like |
| --- | --- |
| 1–2 | Copies a pattern in one project; nothing to decide |
| 3 | One project, a known library, a decision or two |
| 5 | Several projects or a boundary to check, or a spike with real research |
| 8 | A new vendor, shared packages or live content at risk, review that finds things |
| 13–21 | A new system with no precedent, or a block that should become several tickets |

| Where | Figure |
| --- | --- |
| A block not filed yet | The template's `complexity`, from what Huella's tickets for it added up to |
| A filed ticket | The `Complexity` field on the `Monorepo` board; filing sets it from the template, a bundle to the sum of its blocks, and a block with several suggested tickets leaves it blank |
| A ticket under several blocks | Split evenly between them, so a project total counts it once |
| A settled or switched-off block | Nothing |

The page shows points done over points in total, and how much of that total is still the
template's guess.

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

A ticket also counts as in flight once a commit names it as `[#N]`, which is the only way to tell
on a day before the sync, since GitHub keeps no history of linked branches.

A block's state comes from its switch, the project file and its tickets, in this order.

| Block state | When |
| --- | --- |
| Off | Its feature is switched off |
| Skipped / Done | Settled in the project file, with a note; from its `on:` date when it has one |
| Done | Every live ticket delivered |
| Waits on a decision | Nothing filed, and a need still holds it back under the rule above |
| Can file now | Nothing filed, and nothing it needs holds it back |
| Waiting on you | An `owner` block with nothing in its way, or an open ticket labelled `owner` |
| In flight | An open ticket is in flight |
| Blocked | Open tickets, while a block it needs is unfinished or every ticket's GitHub blockers are open |
| Ready | Open tickets and nothing in the way |

A block is blocked by the map as well as by GitHub's links, so a project filed before its tickets
had links, as Huella was, still shows its real order.

**Progress** is done blocks over blocks that are on and not skipped, so opting out of a feature
never drags the number. **What's left** lists unfinished blocks with the owner's first, then by how
many unfinished blocks wait behind each one. The **longest chain left** is the run of unfinished
blocks that decides when the project can finish.

## 🗺️ The page

| Part | Does |
| --- | --- |
| Replay | A slider over every day from the first commit on a ticket to the last sync. Each day is rebuilt from the snapshot: tickets not yet filed, closes and blocker closes not yet happened, and settlements before their `on:` date are left out |
| What's left, the skyline, the stage cards | Pick one block anywhere and the rest of the page follows it. Stages group the blocks; they order nothing |
| What blocks what | Every block in the project on one graph laid out by dagre. The selected block's whole path, before and after it, stays lit and the rest greys out, and the view fits that path. Drag to move, pinch or ctrl-scroll to zoom; a plain scroll still scrolls the page |
| Settings | Its own page, since the plan is set once and almost never changed: the details, the features as cards, the ticket size priced in tickets and locked once one is filed, and deleting at the very bottom. It writes under `pnpm dev` and only reads on the deployed site |

## 🏷️ How a ticket finds its place

| The issue has | It shows |
| --- | --- |
| The milestone and `cap:comments` | Under the Comments block |
| The milestone and no `cap:` label | Under **To organise** |
| A `cap:` label naming no block, naming a feature that bundles blocks, or, while open, one switched off | Under **To organise**, with the reason |
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
| The strip under the skyline | Blocks with a commit, per day, coloured by stage |
| The line on a card | Days with a commit, per week, on one scale shared by every card |

It says when work happened, not how long it took: five minutes and a whole day are both one day with
a commit. A commit without `[#N]` counts nowhere, and neither does work that left no commit.

## ✍️ Commands

| Need | How |
| --- | --- |
| Refresh the snapshot the portal draws | `pnpm workflow:sync [<id>]` |
| What can be taken now, live from GitHub | `pnpm workflow:next <id>` |
| See what filing a block would create, with the blocks its ticket size bundles it with | `pnpm workflow:file <id> <block>` |
| File it | `pnpm workflow:file <id> <block> --yes` |
| Put exactly these blocks in one ticket | `pnpm workflow:file <id> <a> <b> <c> --yes` |
| Abandon a project's tickets: close every untouched one as not planned, keep anything started or closed | `pnpm workflow:drop <id>` to see it, `--yes` to do it, then delete the project |
| Create a project | The plus card after the projects on the Workflows page under `pnpm dev developer-portal`, or after the workflows on the dashboard: a wizard through the template, the details and the features, with the blocks every project gets listed beside them and the ticket size in a side panel that prices each size as you switch. It writes the project file and nothing else; on the deployed portal Create is locked and the same file comes as a download to add in a PR. Tickets are filed with `workflow:file` |
| Switch a feature, set the ticket size, edit or delete a project | The project's **Settings** page under `pnpm dev`, which writes the project file keeping its comments. Deleting sits at the bottom behind typing the id, and removes the project file and its snapshot; nothing on GitHub changes, so run `workflow:drop` first when the tickets should go too. The template can't change, since the switches and settled blocks belong to it. The deployed portal shows Settings read-only |
| Settle a block without a ticket, add an extra | Edit `projects/<id>.yaml`; give a settlement `on: YYYY-MM-DD` so the replay counts it from that day |
| Change the generic map | Edit the template. Every block names the issues its lessons came from |

`workflow:file` uses the block's suggested `tickets`, or one ticket from its title and `doneWhen`
when it has none. The [sync's README](../../infrastructure/scripts/src/workflow/README.md) has the
details. The portal's invariant checks validate every file. Each `reuse.from` path has to exist,
every id, stage and switch has to resolve, and `dependsOn` may not loop.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A third template, such as a landing page or a docs site | A new file under `templates/`; nothing in the code knows any template by name |
| A ticket size between `block` and `stage`, or set per block | A `bundle:` key on template blocks naming the ticket each joins; the stage split already covers the cases met so far |
| Board Status (Todo / In Progress) | The sync already reads the board for `Complexity`; a linked branch already says a ticket is taken |
| Sub-issues per block | Most blocks hold one or two tickets, so a parent issue each is noise; the `cap:` label already groups them |
| `/ship-issue` taking the top of the ready list itself | The workflow's Pick phase would call `workflow:next` before `issue:pick` |
| Backfilling Huella's links on GitHub | Huella shows its order from the template's links, plus the nine native ones it had (#192–#201) |
| Weighting blocks by size | Progress counts each block once, since weighting by ticket count would reward splitting tickets |
| Replaying a linked branch | GitHub keeps no history of them, so a past day knows a ticket was started only from a commit naming it |
| Showing switched-off blocks on the graph | They aren't part of the project; its Settings page is where they are |
