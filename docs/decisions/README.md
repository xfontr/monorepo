# 🧭 Decisions

Where a spike's answer goes once it's answered. One file per decision, named
`<issue-number>-<slug>.md` — `0026-ui-headless.md` for the outcome of issue #26.

A decision record is neither a design doc nor meeting minutes: it exists so the choice survives
after the issue closes and the thread that led to it is forgotten. Write one when a spike (or any
real architectural fork) gets resolved, not when the investigation starts — the issue holds the
question, the file holds the answer. An issue comment can't do this job: it's unsearchable outside
`gh`, unreviewed, and gone from context the moment the issue itself is closed and forgotten.

## 🗂 Structure

Copy [`TEMPLATE.md`](./TEMPLATE.md). Four sections, all of them short:

| Section | Answers |
| --- | --- |
| Context | What was in tension — reuse the spike issue's own framing, don't re-derive it |
| Decision | The outcome, stated as a fact that was chosen, not a recommendation |
| Options considered | Table: option, why it lost |
| Consequences | What this unlocks, what it forecloses, what would have to change to revisit it |

Filename is `<issue-number>-<slug>.md`, zero-padded to four digits — sortable in a directory
listing and traceable back to the issue that raised the question.

## 🔗 Linking back

The decision record is the artifact; the issue is the pointer. The spike issue gets a closing
comment linking to the file, so anyone landing on the issue finds the answer without needing to
know this directory exists. The `decision-record` skill does both ends — the write and the link —
in one pass.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| More than a handful of these | add an index table to this README, once scanning the directory listing stops being enough |
| A decision that reverses another | new file, don't edit the old one — add a one-line "Superseded by `NNNN-slug.md`" at the top of the old record instead of deleting the history |
