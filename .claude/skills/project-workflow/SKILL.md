---
name: project-workflow
description: Run a multi-ticket effort (a site rebuild, a launch) through docs/workflows — start a project from a template, file a block of the map as GitHub tickets with blocked-by links once nothing it needs is undecided, place unsorted tickets, sync, and answer "where are we" or "what can I take". Use when asked to start, plan, ticket, organise or report on a project tracked on the portal's Workflows page, or to redesign or rebuild an existing website.
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

1. Ask for what the code can't tell you: the audience, the page readers land on first, and which
   features are wanted. Ask about every feature the same way, the blog no differently from
   storybook; each one's `summary` and `lessons` in the template is the question, in plain words.
2. Write `docs/workflows/projects/<id>.yaml` by copying [`huella-legal.yaml`](../../../docs/workflows/projects/huella-legal.yaml).
   Set `switches` only where the answer differs from the template's default; a site with no blog is
   `blog: false`. Features are set once; the portal's Features modal is for the rare change after.
   Put features only this project has under `extras`, each with its `dependsOn`.
3. GitHub side, after the user confirms. Each step writes to GitHub:
   - create the milestone, `gh api repos/{owner}/{repo}/milestones -f title=<Milestone>`;
   - create the area label if the app is new;
   - create the `owner` label once if `gh label list` lacks it;
   - create the `cap:<id>` label for every block that is on, unless it already exists. List
     them with `gh label list --limit 300 --json name -q '.[].name' | grep '^cap:'`; `--search` is
     fuzzy and has missed one.

## 2. Filing a block

File what the map says can be filed, not a stage. In the portal a block that can be filed reads
*Can file now*; one that can't reads *Waits* and names what it waits on.

1. `pnpm workflow:file <id> <block>` prints the tickets, their labels and their blocked-by links
   without writing anything. It refuses a block still waiting on an open `spike` or `owner` block,
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
