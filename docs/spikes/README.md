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
