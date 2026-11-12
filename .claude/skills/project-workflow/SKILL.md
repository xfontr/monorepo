---
name: project-workflow
description: Run a multi-ticket effort (a site rebuild, a new site, a launch) through docs/workflows — start a project from a template, file a block of the map as GitHub tickets with blocked-by links once nothing it needs is undecided, place unsorted tickets, sync, and answer "where are we" or "what can I take". Use when asked to start, plan, ticket, organise or report on a project tracked on the portal's Workflows page, or to build a new website or redesign or rebuild an existing one.
---

# Running a project through a workflow

The shape, the status rules and the file format are in
[`docs/workflows/README.md`](../../../docs/workflows/README.md). Read it first. This file is the order
to do things in and the traps.

## 0. Answering "where are we" and "what can I take"

Run `pnpm workflow:next <id>`. It reads GitHub live and prints *Waiting on you*, *Ready* (most
unblocking first), *In flight* and *Blocked*. Don't answer from memory, git log or an old snapshot.
Report it in three lines: what waits on the user, the top of the ready list, and the blocked count.
For the picture, run `pnpm workflow:sync <id>` and point the user at `/workflows/<id>` in the portal.

Never tune anything to how many agents are running. The ready list is the same for one agent or a
hundred.

## 1. Starting a project

1. Pick the template: `new-website` for a site started from nothing, `website-rebuild` when an
   old site's content and URLs come along, `custom` for anything else — a developer tool, a
   package, an internal feature — and then draft its map under
   [Drafting a map](#15-drafting-a-map-for-a-custom-project). Then ask for what the code can't tell you: the
   audience, the page readers land on first, which features are wanted, and the ticket size —
   `block` for agents in parallel, `stage` or `lean` for someone who wants few, big tickets. Ask about every feature the same way, the blog no differently from
   storybook; each one's `summary` and `lessons` in the template is the question, in plain words.
2. Write `data/workflows/projects/<id>.yaml` by copying [`huella-legal.yaml`](../../../data/workflows/projects/huella-legal.yaml).
   Set `switches` only where the answer differs from the template's default; a site with no blog is
   `blog: false`. Features are set once; the project's Settings page in the portal is for the rare change after. Under `pnpm dev` the
   portal's new-project wizard, behind the plus card on the Workflows page, writes this same file, if the user would rather click through it.
   Put features only this project has under `extras`, each with its `dependsOn`. Set
   `ticketSize` unless it is `block`.
3. GitHub side: `pnpm workflow:setup <id>` prints the milestone and labels it would create. Show
   the user, and only on their go run it with `--yes`, since it writes to GitHub. Run it again after
   a feature is switched on, for the new blocks' `cap:` labels.

## 1.5 Drafting a map for a custom project

A `custom` project starts with no blocks; its map is the project file's `extras`, which you draft and
the user checks. Read the repo first, then ask only what the code can't tell you: what it is for,
who uses it, what done looks like, and what is still undecided.

1. **One block per thing an agent can finish and a check can verify**, at most 13 points on the
   [complexity scale](../../../docs/workflows/README.md#-complexity). Anything bigger gets suggested
   `tickets` or becomes two blocks.
2. **Every open question is a `spike`, and every call only the user can make is an `owner` block**,
   such as scope, a provider or an API shape. Build blocks that depend on the answer go in
   `dependsOn`, so filing waits for them.
3. **Every block has `doneWhen`**, written as checks rather than tasks, and a `reuse` naming the
   precedent to copy — a package, a script folder, a layer — with a path that exists.
4. **Write lessons only from issues that happened**, with their numbers. Leave them out rather than
   inventing any.
5. **Stages are `plan`, `build` and `ship`.** End with an `owner` block in `ship` that needs every
   other block, so the release is a decision too.

Show the user the map in the portal at `/workflows/<id>` before running `workflow:setup`, and
change the file until they agree with it. If a second project of the same kind turns up, its map
becomes a template.

## 2. Filing a block

File what the map says can be filed, not a stage. In the portal a block that can be filed reads
*Can file now*; one that can't reads *Waits* and names what it waits on.

1. `pnpm workflow:file <id> <block>` prints the tickets, their labels and their blocked-by links
   without writing anything. Under a `ticketSize` other than `block` it is one ticket for the
   block and the others its size bundles it with, and it names any member left for later. It refuses a block still waiting on an open `spike` or `owner` block,
   because that decision can still change what the tickets say (#208, #242 → #299).
2. When a block has no suggested `tickets` in the template, the command drafts one from its title
   and `doneWhen`. If that would be too thin for an agent to act on, add `tickets` to the template
   first; the next project inherits them.
3. Show the user the dry run. Filing is outward-facing.
4. `pnpm workflow:file <id> <block> --yes`, then `pnpm workflow:sync <id>`.

A dependency that turns up later is added on GitHub, on the issue's *Relationships* panel or with
`gh issue edit <n> --add-blocked-by <m>`, not in the project file. After filing, GitHub wins.

## 3. Placing unsorted tickets

To organise lists milestone issues with no usable `cap:` label, and open issues with the project's
area label but no milestone — `pnpm issue:add` sets none, so that's where the user's own tickets land.
Propose a capability for each in a table (issue, title, proposed `cap:`, why). After the user
confirms, add them with `gh issue edit <n> --milestone "<Milestone>" --add-label cap:<id>` and sync
again.

A ticket that fits no capability is either an `extra` for this project, or a lesson for the
template. Say which.

## 4. Sign-offs and settling

- An `owner` block is the user's call, never yours. It is approved by closing its ticket on GitHub.
  Never close one yourself.
- Use `settled` with a one-line note and an `on:` date when a block was done or deliberately
  skipped without a ticket of its own, so the replay counts it from that day. Never settle
  something only to raise the %.

## 5. Feeding the template

When a project finds something the template didn't ask for (a late feature, a provider swap, a
redo, a dependency nobody drew), add it to the template as a block, a `dependsOn` link or a
`lessons` entry with the issue numbers. The next project learns it up front. That is the template's
whole point.

## 6. Abandoning a project

When the user drops a project, run `pnpm workflow:drop <id>` and show them what closes and what
stays. Only on their go, add `--yes`, then delete the project from its Settings page. In that order,
because `drop` reads the milestone from the project file. It closes as not planned and never deletes;
anything started or closed stays.

## 🎨 The design stage of a website rebuild

What the `website-rebuild` design capabilities expect, learned on Huella:

- **Data before taste.** The content audit and feature inventory close before any direction is
  drawn. Every element on an approved page should trace to an audit row.
- **Design in code** with dev-only `/lab` pages on real content, two or three directions under
  `/lab/attempts/`, reviewed as screenshots at 390, 768 and 1280 px. No Figma or Penpot.
- **Brand from the live site's computed styles**, then semantic tokens with a contrast table, and
  the raw-palette lint ban from day one. Copy
  [`apps/huella-legal/layers/design`](../../../apps/huella-legal/layers/design) and its
  `eslint.config.ts` rule.
- **The lab is a design, not code.** Production components are rebuilt on Nuxt UI from it, never
  copied.

## Verify

```sh
pnpm workflow:sync <id>
pnpm workflow:next <id>
pnpm exec nx collect @monorepo/developer-portal   # invariants include every workflow file's rules
```
