# 🗂 Docs

Everything here spans more than one project. Anything that doesn't — a project's own reference,
its setup, its invariants — stays in that project's `README.md` and `AGENTS.md` instead, from
[decision 0001](./decisions/0001-feature-discoverability.md):

> A subject enters `docs/` only if no single project owns it.

READMEs are excellent at one genre: per-project reference, colocated with the code so it changes in
the same diff. They structurally cannot hold a subject spanning projects, because there is no
project whose README owns it — that's the gap this tree fills, not a volume problem better READMEs
would fix.

These files are read on GitHub first. [`@monorepo/tech-docs`](../apps/tech-docs/README.md) also
renders them — in place under `pnpm dev tech-docs`, and as a snapshot on the site it publishes from
`master` — so a link here has to stay correct in both places, which is
[`resolveDocLink`](../apps/tech-docs/shared/docLinks.ts)'s whole job rather than something to write
around.

## 🗂 Structure

| Folder | Holds |
| --- | --- |
| [`FEATURES.md`](./FEATURES.md) | Generated index: every command, hook, workflow and skill, with the doc that explains it |
| [`concepts/`](./concepts/README.md) | The models that span projects — the *why*, no procedure |
| [`guides/`](./guides/README.md) | Task-shaped, cross-project, procedural walkthroughs |
| [`decisions/`](./decisions/README.md) | The answer once an architectural spike issue gets one |
| [`reviews/`](./reviews/README.md) | A dated, scored read of the whole repo against a fixed rubric |

`FEATURES.md` is the only generated file — it stays a pure index (what invokes a capability, where
it's declared, which doc explains it) so there's no hand-written column for the next render to
clobber. The *why* behind any capability it lists lives in the doc that row points at, often one
under `concepts/` or `guides/`.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Consolidating project READMEs into this tree | Forecloses on purpose — the ownership rule cuts both ways, so a project's own docs stay in the project forever, subdividing in place as they grow rather than migrating here |
