# 🗂 Docs

Everything here spans more than one project. Anything that doesn't — a project's own reference,
its setup, its invariants — stays in that project's `README.md` and `CLAUDE.md` instead, from
[spike 0037](./spikes/0037-feature-discoverability.md):

> A subject enters `docs/` only if no single project owns it.

READMEs are excellent at one genre: per-project reference, colocated with the code so it changes in
the same diff. They structurally cannot hold a subject spanning projects, because there is no
project whose README owns it — that's the gap this tree fills, not a volume problem better READMEs
would fix.

## 🗂 Structure

| Folder | Holds |
| --- | --- |
| [`FEATURES.md`](./FEATURES.md) | Generated index: every command, hook, workflow and skill, with the doc that explains it |
| [`concepts/`](./concepts/README.md) | The models that span projects — the *why*, no procedure |
| [`guides/`](./guides/README.md) | Task-shaped, cross-project, procedural walkthroughs |
| [`spikes/`](./spikes/README.md) | The answer once an architectural spike issue gets one |
| [`reviews/`](./reviews/README.md) | A dated, scored read of the whole repo against a fixed rubric |

`FEATURES.md` is the only generated file — it stays a pure index (what invokes a capability, where
it's declared, which doc explains it) so there's no hand-written column for the next render to
clobber. The *why* behind any capability it lists lives in the doc that row points at, often one
under `concepts/` or `guides/`.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Rendering this tree as a browsable site | Deferred out of spike 0037 on purpose — it's a view over these same sources and needs its own boundary decision (`type:infra` widening, or a new `type:docs` tag) before any scaffolding starts |
| Consolidating project READMEs into this tree | Forecloses on purpose — the ownership rule cuts both ways, so a project's own docs stay in the project forever, subdividing in place as they grow rather than migrating here |
