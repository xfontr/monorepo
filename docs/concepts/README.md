# 🧠 Concepts

The models that span projects — the *why*, with no procedure in it. One file per subject, named
for the subject rather than numbered: there's no order to read these in, unlike
[`docs/spikes/`](../spikes/README.md).

A subject belongs here under one rule, from
[spike 0037](../spikes/0037-feature-discoverability.md):

> A subject enters `docs/` only if no single project owns it.

Boundaries, versioning and the agent setup all span every project in the tree, so no README can
hold them without becoming the accidental owner of something that isn't its own. That's the whole
test before adding a file here — if a project's own README could hold this and just doesn't yet,
the fix is to write it there, not here.

## 🗂 Structure

| File | Explains |
| --- | --- |
| [`boundaries.md`](./boundaries.md) | Why the Nx tag system is layered the way it is |
| [`versioning.md`](./versioning.md) | How a version gets derived from a commit |
| [`agent-setup.md`](./agent-setup.md) | The agent setup as one inspectable system |

Procedure lives in [`docs/guides/`](../guides/README.md) instead — a concept doc explains a
constraint, a guide walks a task. A file that starts accumulating numbered steps has drifted into
the wrong folder.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A concept doc that mostly restates one project's README | Delete it and link to that README instead — restating is the drift class [0040](../spikes/0040-docs-drift-detection.md) exists to catch, and this tree is not exempt from it |
| A subject that one project mostly owns but not entirely | Revisit the ownership rule per [spike 0037](../spikes/0037-feature-discoverability.md#consequences) rather than inventing a tie-breaker here — the spike is explicit that a per-document exception is how this tree starts absorbing prose that belongs next to the code |
