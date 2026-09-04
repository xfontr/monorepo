# 🧭 Guides

Task-shaped walkthroughs that cross project boundaries. Where [`docs/concepts/`](../concepts/README.md)
explains a constraint, a guide here walks a procedure — numbered steps are the right shape in this
folder, and a sign a file belongs in `concepts/` instead.

Same ownership rule as the rest of `docs/`, from
[spike 0037](../spikes/0037-feature-discoverability.md):

> A subject enters `docs/` only if no single project owns it.

A task that lives entirely inside one project's README — running its dev server, adding a
component to `@monorepo/ui` — has an owner already and doesn't belong here even if it's tempting to
collect it for convenience. What earns a spot is a task whose steps genuinely span more than one
project's README, the way [`change-lifecycle.md`](./change-lifecycle.md) spans `.husky/`, a GitHub
workflow and the root README's versioning section with no single one of them telling the whole
story.

## 🗂 Structure

| File | Walks |
| --- | --- |
| [`first-hour.md`](./first-hour.md) | An ordered way in for someone who's never seen the repo |
| [`change-lifecycle.md`](./change-lifecycle.md) | An issue, end to end, from `issue:pick` to a released version |
| [`adding-a-locale.md`](./adding-a-locale.md) | Adding a locale across the app and the translations service |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A guide that's really just one project's README restated | Delete it and link to that README — this folder existing doesn't change the ownership rule |
| Enough of these that scanning the directory stops being enough | Add an index table here, same fix `docs/spikes/README.md` names for itself |
