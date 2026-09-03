---
name: github-issue
description: Draft and file a GitHub issue with the shape that fits its kind — task (user story + acceptance criteria), bug (repro steps + expected/actual), or spike (decision + question). Use when asked to open, file, or create a GitHub issue.
---

# Creating a GitHub issue

Three kinds, three body shapes. `gh issue create` does the actual filing once the body and label
are drafted.

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

## 2. The templates

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

## 3. File it

Show the drafted title, body and label to the user before running this — filing an issue is
outward-facing (it notifies watchers) even though it's easy to edit or close after the fact:

```sh
gh issue create --title "<title>" --body "<body>" --label "<label>"
```

Add `--milestone "<name>"` only if the user names one — don't invent a milestone. Report back the
issue number and URL `gh issue create` prints, not just "done".
