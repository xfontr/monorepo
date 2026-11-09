---
name: project-workflow
description: Run a multi-ticket effort (a site rebuild, a launch) through docs/workflows — start a project from a template, file a stage's tickets with milestone and cap: labels once the previous gate is approved, place unsorted tickets, sync, and answer "where are we". Use when asked to start, plan, ticket, organise or report on a project tracked on the portal's Workflows page, or to redesign or rebuild an existing website.
---

# Running a project through a workflow

The shape, the status rules and the file format are in
[`docs/workflows/README.md`](../../../docs/workflows/README.md). Read it first. This file is the order
to do things in and the traps.

## 0. Answering "where are we"

Run `pnpm workflow:sync <id>` and read the snapshot together with the project file. Don't answer from
memory or from git log. Report it in three lines: the %, the current stage (the first one whose gate
isn't approved) with what's left, and the To organise count. Point the user at `/workflows/<id>` in
the portal for the picture.

## 1. Starting a project

1. Ask for what the code can't tell you: the audience, the page readers land on first, and which
   optional capabilities are wanted. Each optional capability's `summary` and `lessons` in the
   template is the question to ask, in plain words.
2. Write `docs/workflows/projects/<id>.yaml` by copying [`huella-legal.yaml`](../../../docs/workflows/projects/huella-legal.yaml).
   Set `switches` only where the answer differs from the template's default; a group's id switches
   every capability in it, so a site with no blog is `blog: false`. Put features only this project
   has under `extras`.
3. GitHub side, after the user confirms. Each step writes to GitHub:
   - create the milestone, `gh api repos/{owner}/{repo}/milestones -f title=<Milestone>`;
   - create the area label if the app is new;
   - create the `cap:<id>` label for every capability that is on, unless it already exists. List
     them with `gh label list --limit 300 --json name -q '.[].name' | grep '^cap:'`; `--search` is
     fuzzy and has missed one.

## 2. Filing a stage's tickets

**Only the current stage, and only once the gate before it is approved** in the project file.
Huella's tickets for its first design direction were filed the night before the final one existed
(#208).

For each capability in the stage that is on and shows *No tickets*:

- Start from its `tickets` in the template. With none, draft one from `summary` and `doneWhen`.
- Use the `github-issue` skill's body shapes: a spike for discovery, a task otherwise.
- Every issue gets the milestone, its `cap:<capability>` label and the project's area label.
  Example: `gh issue create --milestone "<Milestone>" --label "cap:comments" --label "app:<name>" …`.
- `reuse.plan: copy` is the template's default for Huella's app code, because the next site may not
  share its runtime. When the copied code would come out identical, ask the user at kickoff whether
  to extract it into a package instead; if they say yes, that is the capability's first ticket.
- Show the user the list of titles before filing. Filing is outward-facing.

Then run `pnpm workflow:sync <id>`.

## 3. Placing unsorted tickets

To organise lists milestone issues with no usable `cap:` label, and open issues with the project's
area label but no milestone — `pnpm issue:add` sets none, so that's where the user's own tickets land.
Propose a capability for each in a table (issue, title, proposed `cap:`, why). After the user
confirms, add them with `gh issue edit <n> --milestone "<Milestone>" --add-label cap:<id>` and sync
again.

A ticket that fits no capability is either an `extra` for this project, or a lesson for the
template. Say which.

## 4. Gates and settling

- A gate is the user's call, never yours. They approve it on the portal under `pnpm dev`, or you set
  `gates.<stage>: YYYY-MM-DD` when they say so.
- Use `settled` with a one-line note when a capability was done or deliberately skipped without a
  ticket of its own. Never settle something only to raise the %.

## 5. Feeding the template

When a project finds something the template didn't ask for (a late feature, a provider swap, a
redo), add it to the template as a capability or a `lessons` entry with the issue numbers. The next
project learns it up front. That is the template's whole point.

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
pnpm exec nx collect @monorepo/developer-portal   # invariants include every workflow file's rules
```
