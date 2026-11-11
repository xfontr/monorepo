# 🧭 workflow

The GitHub side of each project under
[`data/workflows/projects/`](../../../../docs/workflows/README.md): snapshot it for the portal, list
what can be taken now, file a block of the map as tickets, and drop the untouched ones when a project
is abandoned. GitHub is the record once a block is
filed, so all three read it rather than trusting the project file.

```sh
pnpm workflow:sync                       # every project
pnpm workflow:sync harbour-notes         # one or more by id
pnpm workflow:next huella-legal          # waiting on you, ready, in flight, blocked — live
pnpm workflow:file huella-legal search   # dry run: the tickets, labels and blocked-by links
pnpm workflow:file huella-legal search --yes
pnpm workflow:file my-blog article-page home-page   # these blocks in one ticket
pnpm workflow:drop harbour-notes         # dry run: what closes, what stays
pnpm workflow:drop harbour-notes --yes
```

| Command | Reads | Writes |
| --- | --- | --- |
| `sync` | Every milestone issue with its labels, open and close dates, blocked-by links with each blocker's close date, linked branches, and its `Complexity` on the `Monorepo` board, in one paginated GraphQL query; open area-label issues with no milestone; the local `git log`. The dates are what let the portal replay any past day | `<project>.snapshot.json`, only when the issues or commits changed, so running it costs no diff |
| `next` | The same milestone query and `git log`, live; a ticket a commit names counts as in flight, as on the portal | Nothing |
| `file` | The template, the project file and the milestone | With `--yes`, one GitHub issue per suggested ticket, or one for the whole bundle, put on the `Monorepo` board with its `Complexity` set |
| `drop` | The same milestone query and `git log`, live | With `--yes`, closes as not planned every open ticket that is ready, blocked or waiting on you, and the milestone once nothing in it is left open |

`drop` keeps anything in flight, done or already dropped, so abandoning a project never throws away
started work. It closes rather than deletes: closing can be undone, needs no admin rights, and leaves
the kept tickets' blocked-by links intact. It reads the milestone from the project file, so run it
before deleting the project on the portal; that page's delete dialog counts what it would close.

`file` refuses a block that is off, settled, already filed, or still waiting. A block waits while a
`spike` or `owner` block it needs is open, or while a `build` block it needs has no ticket to link
to. Otherwise every open ticket of each `build` block it needs becomes a blocked-by link on the new
ticket. Each ticket gets the milestone, `cap:<block>`, the area label, and the label for its kind:
`enhancement`, `spike` or `owner`. The body is the block's summary and the ticket's criteria as a
checklist.

A project with a `ticketSize` other than `block` files a block together with the others its size
bundles it with; [the workflows README](../../../../docs/workflows/README.md#-ticket-size) has the
grouping. Members that still wait are left out and printed, and the one ticket carries every
member's `cap:` label, with one section per block in its body. Naming several blocks merges exactly
those instead. The portal's
[`shared/ticketSize.ts`](../../../../apps/developer-portal/layers/workflows/shared/ticketSize.ts)
groups the same way for its counts, written twice for the same reason as the ticket status below.

## 🗂 Structure

```
index.ts               hands { sync, next, file } to run(), which dispatches on the first argument
sync.ts                the per-project loop: read the milestone and area, list their issues, write the snapshot
next.ts                one project's open tickets, grouped by what can happen to them next
file.ts                one block's tickets, printed or created
drop.ts                an abandoned project's untouched tickets, printed or closed
adapters/gh.ts         the milestone GraphQL query, the area-label list, issue creation and closing
adapters/git.ts        every non-merge commit's author date and subject
adapters/files.ts      project and template YAML, the snapshot read and write, the one-project argument
domain/snapshot.ts     GitHub's issue shape to the snapshot, commits to issues, the unchanged check
domain/queue.ts        a ticket's status, how many tickets wait behind each one, the printed lists, what a drop closes
domain/filing.ts       the map read from a template and project, the ticket-size bundles, and what filing them would create
```

`domain/queue.ts` and the derived view in the portal's
[`shared/workflows.ts`](../../../../apps/developer-portal/layers/workflows/shared/workflows.ts) compute a ticket's
status the same way, and the portal's settings page counts a drop by the same rule. The portal can't import this package and this package can't import an app, so
the rule is written twice and both specs pin it.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Board Status (Todo / In Progress) instead of a linked branch | The query already reads `projectItems` for `Complexity`; the branch `pnpm issue:pick` links already says a ticket is taken |
| `Complexity` on area issues outside the milestone | `gh issue list --json` can't read a custom board field; they show as unestimated until placed |
| Running `sync` on a schedule | A workflow that syncs and commits would need write access to `master`, which only moves through a PR |
| Creating the `cap:` and `owner` labels | `gh label create` by hand or through the `project-workflow` skill; `file` fails on a label that doesn't exist |
| Filing a whole wave at once | `file` takes one bundle so each dry run stays readable; a loop over `workflow:next`'s *Can file now* blocks would do it |
