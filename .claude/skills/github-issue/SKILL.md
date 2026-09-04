---
name: github-issue
description: Draft and file a GitHub issue with the shape that fits its kind — task (user story + acceptance criteria), bug (repro steps + expected/actual), or spike (decision + question). Use when asked to open, file, or create a GitHub issue.
---

# Creating a GitHub issue

Three kinds, three body shapes. `gh issue create` does the actual filing once the body and label
are drafted.

## 0. Don't read the repo

The user's request is almost always enough on its own — as much context as a ticket would need
from a human. Draft straight from what they said; don't `Read`, `Grep`, or spawn an agent to go
looking through the codebase first. If you genuinely can't draft without seeing something specific
(a file, a script, a config), ask the user before reading it rather than reading on your own
judgment. Reading is the exception here, not the default.

## 1. Pick the kind

Ask if it isn't obvious from the request — the wrong pick produces a body with dead sections
(acceptance criteria on a bug, repro steps on a task).

| Kind | When | Label |
| --- | --- | --- |
| Task | A regular unit of work — no bug, no open question | `enhancement` |
| Bug | Something that works today works incorrectly | `bug` |
| Spike | A decision has to get made before work can start | `spike` (+ `question` if it's a genuinely open call, e.g. #26) |

Check `gh label list` if a label looks stale — the mapping above is what this repo's tracker uses
today, not a guarantee it always will.

## 2. Pick the project

Every issue goes on a project board — ask if the user didn't say which one. `gh project list`
lists the repo's open projects if you need the exact title. Once you have it, it's not optional:
pass it through to `gh issue create` (step 4) so the issue actually lands on that board instead of
just existing in the repo.

## 3. The templates

### Task

Title: short imperative, sentence case, no trailing period — "Develop contact view", not
"Developing the contact view.".

```markdown
**User story:** As a <role>, I want <capability>, so that <benefit>.

**Acceptance criteria:**
- [ ] <criterion>
- [ ] <criterion>

**Blocked by:** #<n>
```

Drop the `Blocked by` line entirely if nothing blocks it — don't leave it empty.

### Bug

Title: the symptom, not the fix — "Contact form submits twice", not "Fix double form submit".

```markdown
**Description:** <what's broken and where, one or two sentences>

**Steps to reproduce:**
1. <step>
2. <step>

**Expected behaviour:** <what should happen>

**Actual behaviour:** <what happens instead>
```

### Spike

Modeled on the one spike already in this tracker (#26) — a decision, framed as a real choice, plus
what's waiting on it:

```markdown
**Decision needed.** <context: what's planned or assumed, and what it's in tension with>

**Question:** <the actual question, framed as a choice between named options>

**Blocks:** <the work waiting on this decision, or "nothing yet">
```

## 4. File it

Show the drafted title, body, label and project to the user before running this — filing an issue
is outward-facing (it notifies watchers) even though it's easy to edit or close after the fact:

```sh
gh issue create --title "<title>" --body "<body>" --label "<label>" --project "<project>"
```

Drop `--project` if the user genuinely wants no project (they said so, or there's none to pick from).
Add `--milestone "<name>"` only if the user names one — don't invent a milestone. Report back the
issue number and URL `gh issue create` prints, not just "done".

## 5. Offer to pick it

Once it's filed, ask whether the user also wants to pick it up now. If yes, this is the manual
equivalent of `pnpm issue:pick` for the issue you just created — you can't run that script, so do
what it does by hand:

1. Ask the branch type (`feature`, `fix`, `hotfix`, `release`) if it isn't obvious from the kind —
   `feature` for a task, `fix` for a bug; a spike is usually `feature` too, but ask if unsure.
2. Build the branch name the same way the script does: `<type>/<issue number>-<slug>`, where
   `<slug>` is a short, hyphenated summary of the title (lowercase, letters/digits/hyphens only).
3. Create and link the branch in one call — this both creates the branch on the issue's Development
   panel and checks it out, same as the script:

   ```sh
   gh issue develop <issue number> --name <type>/<issue number>-<slug> --checkout
   ```

4. Assign the issue to the user: `gh issue edit <issue number> --add-assignee @me`. If it fails
   (no write access), warn and move on — the branch is still theirs.
