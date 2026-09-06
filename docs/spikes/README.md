# 🧭 Spikes

Where a spike's answer goes once it's answered. One file per spike, named
`<issue-number>-<slug>.md` — `0026-ui-headless.md` for the outcome of issue #26.

A spike report is neither a design doc nor meeting minutes: it exists so the result of the
investigation survives after the issue closes and the thread that led to it is forgotten. Write one
when a spike (or any real architectural fork) gets resolved, not when the investigation starts —
the issue holds the question, the file holds the answer. An issue comment can't do this job: it's
unsearchable outside `gh`, unreviewed, and gone from context the moment the issue itself is closed
and forgotten.

## 🗂 Structure

Copy [`TEMPLATE.md`](./TEMPLATE.md). Four sections, all of them short:

| Section | Answers |
| --- | --- |
| Context | What was in tension — reuse the spike issue's own framing, don't re-derive it |
| Result | The outcome, stated as a fact that was found, not a recommendation |
| Options considered | Table: option, why it lost |
| Consequences | What this unlocks, what it forecloses, what would have to change to revisit it |

Filename is `<issue-number>-<slug>.md`, zero-padded to four digits — sortable in a directory
listing and traceable back to the issue that raised the question.

## 🚦 Status

A `Status:` line sits right under `Spike: #<issue number>`, and it is the one line in the file
expected to change after the report is written — every other section is a record of what was found,
this is what happened since:

| Value | Means |
| --- | --- |
| `To implement` | The decision is made; the work it calls for hasn't landed in the repo yet |
| `Implemented` | That work is done, in the repo today |
| `Won't implement` | Decided against, deliberately — not a report waiting on follow-up |

Whoever lands the follow-up work flips the line in the same PR, the way `CHANGELOG.md` gets touched
by the change it describes rather than by a separate bookkeeping pass. A spike whose status never
moves off `To implement` is either still waiting or forgotten, and there is no third option this
line can express — that ambiguity is deliberate, the same read a stale changelog gets.

This is why the value lives in the file rather than in the file's own location: a folder per status
would make every one of those flips a `git mv`, and nothing here enforces that the move happens.
[`apps/dashboard`](../../apps/dashboard/README.md) parses the line the same way it already parses
`## 🧭 Deliberately deferred`, and shows it next to every spike in its wiki nav — so this is the one
field in a spike report with a reader other than a human on GitHub.

## 🔗 Linking back

The spike report is the artifact; the issue number in its filename is the link. Nothing gets
commented on the issue — the PR that lands the report references it, and that trail is enough. A
comment would be a second copy of the answer, free to drift from the file and notifying watchers
to say so.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| More than a handful of these | add an index table to this README, once scanning the directory listing stops being enough |
| A report that reverses another | new file, don't edit the old one — add a one-line "Superseded by `NNNN-slug.md`" at the top of the old report instead of deleting the history |
