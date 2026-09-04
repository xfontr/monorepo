---
name: start-issue
description: Get oriented on a GitHub issue and start developing it — from the branch you're already on, or from a number, link, or description you give directly. Reads the issue and its comments, follows any spike/decision it references, and makes sure you're on a linked branch before work begins. Use when asked to start, pick up, work on, or dev a specific GitHub issue.
---

# Starting work on a GitHub issue

Two ways in, one job either way: land on the right branch, then read enough to actually implement
the thing instead of guessing at it.

## 1. Find the issue

**Already on a branch for it.** Branch names from `pnpm issue:pick` (or step 2 below) look like
`feature/46-offline-issue-picker` — `<type>/<number>-<slug>`. Read the number off
`git branch --show-current` and confirm it with `gh issue view <number>` rather than trusting the
slug; slugs get hand-edited, numbers don't.

**Given a number, link, or description instead.** `gh issue view` takes either a bare number or a
full issue URL directly, so a `#46` or a pasted link needs no parsing. A plain description doesn't:

```sh
gh issue list --search "<the terms they gave you>"
```

Show the candidates and confirm the match before moving on — search is fuzzy, and starting work on
the wrong issue is expensive to notice later. Don't guess past one weak match.

## 2. Get on its branch

Skip this if step 1 already found you standing on the issue's branch.

Otherwise this is `pnpm issue:pick` for an issue you already picked out, so do what it does by
hand — same procedure as the `github-issue` skill's "Offer to pick it" step:

1. Pick the branch type from the issue's label (`enhancement` → `feature`, `bug` → `fix`) or ask if
   it's a `spike` or the label doesn't map cleanly.
2. Build `<type>/<issue number>-<slug>`, slug lowercased and hyphenated from the title.
3. `gh issue develop <number> --name <type>/<number>-<slug> --checkout` — links the branch on the
   issue's Development panel and checks it out in one call.
4. `gh issue edit <number> --add-assignee @me`. A failure here (no write access) only costs the
   assignment — warn and keep going, the branch is still checked out.

Check `git status --porcelain` first if you're not sure the tree is clean: the checkout above
carries uncommitted changes over silently, which is usually fine but worth flagging before it
happens rather than after.

If a branch for this issue already exists (you're resuming, not starting), `gh issue develop` fails
on the name collision — check for one first (branch names embed the issue number, so
`git branch --list "*/<number>-*"` finds it) and check it out instead of creating a second one.

## 3. Read the full context

One call gets the whole thread:

```sh
gh issue view <number> --comments
```

Read past the body — the decision often lives in a comment, not the description. Then follow what
it points at:

- **`Blocked by #<n>`** (the `github-issue` skill's task template) — `gh issue view <n>` for that
  issue too. You need to know what it settled, not just that it's closed.
- **A spike or a past decision mentioned in the text** — a resolved spike lives in
  `docs/decisions/`, filed as `<issue number, zero-padded to 4 digits>-<slug>.md`
  (see the `decision-record` skill). If the issue references one, find it:

  ```sh
  ls docs/decisions/ | grep <padded number>
  ```

  Read the file's Decision and Consequences sections before writing any code that touches the same
  ground — that's the whole reason the record exists instead of a comment.

## 4. Confirm before diving in

Summarize back in a few lines: what the issue is asking for, anything a blocking issue or decision
record changes about the approach, and what you're about to do first. This is the cheap check that
you read the right thread before spending a session on it — not a full plan, just enough for the
user to redirect you if you picked up the wrong end of it.
