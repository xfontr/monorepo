# 🔎 Audits

Where a static read of one project goes once it's done. An audit lists what was found wrong at one
commit, numbered finding by finding, and is worked down over time rather than fixed in one sitting.
One file per audit, named `<YYYY-MM-DD>-<scope-slug>.md` — `2026-09-25-developer-portal.md` is the
developer portal as it read that day.

An audit exists so the findings survive the session that produced them. A plan in chat is gone the
moment the conversation ends, and an audit of thirty findings is never the next PR. It is the
backlog one project owes. The GitHub board holds work someone has picked up.

## 🧭 Audit, decision or review

| | [Decision](../decisions/README.md) | [Review](../reviews/README.md) | Audit |
| --- | --- | --- | --- |
| Answers | Which way do we go? | How good is the whole repo, scored? | What is wrong with *this project* right now? |
| Scope | One architectural fork | The whole tree, seven cards | One project or directory |
| Anchored to | The issue that raised it | A commit | A commit |
| Body | Context, Result, Options, Consequences, Confirmation | A scores table and its evidence | Numbered findings tables |
| What changes after filing | `status:` for the whole file | Nothing | The `Status` cell of each finding |

A finding that turns out to be a real fork — two designs, and a reason one loses — graduates into a
decision report, and its row reads `wont-fix` with the report as its reference.
[`0019`](../decisions/0019-scripts-quality-audit.md) predates this directory: it is an audit filed
as a decision because there was nowhere else to put it, and it stays where it is.

## 🗂 Structure

Copy [`TEMPLATE.md`](./TEMPLATE.md). A frontmatter block, then:

| Section | Holds |
| --- | --- |
| Context | What was read and how a finding was confirmed — the audit's method, so a reader knows what "confirmed" means here |
| One section per category | A findings table. `Bugs` (`B`), `Duplication` (`D`), `Quality` (`Q`), `Security` (`S`), whichever apply |
| Order | The sequence the findings should be worked in, and which fix makes another one free |

Every findings table has an `ID` column and a `Status` column; the columns between them are the
finding's own — typically `Where`, `What goes wrong`, `Fix`. A table without both headers is prose
as far as the portal is concerned, which is how a Context table stays out of the counts.

```
---
scope: "@monorepo/developer-portal"
commit: "61b6f7f"
---
```

Quote `commit:` — a short sha of digits alone parses as a number in YAML, and loses its leading
zeros.

## 🚦 Status

The one thing in an audit expected to change after it is filed, and it changes per finding, not per
file. **Whoever lands the fix flips its cell in the same PR.**

| Value | Means |
| --- | --- |
| `open` | Still true of the code |
| `fixed` | The fix has landed — optionally followed by where, `fixed #152` |
| `wont-fix` | Decided against, deliberately — followed by the reason or the decision report that settled it |

An audit's own state is derived, never written: **open** while no finding has moved, **in progress**
once one has, **closed** once none is `open`. A status outside the vocabulary counts as `open`, so a
typo keeps an audit on the list instead of quietly closing it.

**IDs are permanent.** A finding is never renumbered or deleted, only closed — the ID is what an
issue, a commit message or the Order section refers to. A finding missed the first time goes at the
end of its table with the next free number. A second pass over the same project much later is a new
audit with a new date.

[`apps/developer-portal`](../../apps/developer-portal/README.md) parses every findings table into its
Audits section: a progress bar per audit, counts per status, and a filter by scope and state. Its
collector also flags an audit whose filename, frontmatter or statuses break the rules above.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| One GitHub issue per finding | The portal would read progress from GitHub instead of from the file, and an audit of thirty findings would be thirty issues. File one when a finding is actually picked up, and reference its ID |
| A check that a `fixed` finding really is fixed | Each finding would need a machine-checkable claim, the way a decision report's Confirmation does. Rereading the `Where` column against the code is the check today |
| Severity per finding | The categories and the Order section already say what goes first. A severity column earns its place once audits are compared against each other rather than worked one at a time |
