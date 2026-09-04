# 🧭 Making the repo's feature surface discoverable

Spike: #37

## Context

The repo keeps growing and nothing says what it contains. Land in
`infrastructure/scripts/src/drift/` cold and there was no way to have known "drift" was a concept
here; the same holds for the other six projects and for the automation scattered across hooks and
workflows. The proposal was to grow a repo-scoped docs collection, with an internal app to render it
later.

What made it a decision rather than a ticket is that the tree already holds forty-three hand-written
markdown files, with every one of the eight projects carrying both a README and a `CLAUDE.md` and
[`house-docs`](../../.claude/skills/house-docs/SKILL.md) setting their voice. So the question was
what a new collection holds that those don't — because anything that re-tells them is a second copy
of content [`0040-docs-drift-detection.md`](./0040-docs-drift-detection.md) had just named as this
repo's standing failure mode.

## Result

**READMEs are not enough, and they already aren't.** They are excellent at one genre — per-project
reference, colocated with the code so it changes in the same diff — and structurally cannot hold a
subject that spans projects, because there is no project whose README owns it. That is not a volume
problem that better READMEs fix; it is a genre missing from the repo. Three subjects prove it:

| Subject nothing owns | Scattered across |
| --- | --- |
| The lifecycle of a change, end to end | `issue:pick` → branch regex → the `[50]` subject injection in [`commit-msg`](../../.husky/commit-msg) → four [`pre-push`](../../.husky/pre-push) gates → [`pr-metadata.yml`](../../.github/workflows/pr-metadata.yml) and its PAT → CI → `nx release`. The root README carries fragments in two sections; the injection appears nowhere |
| Why the boundary system exists at all | The tag table is in the root README and [`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts), and each project states its own tag — but nothing says why layering by tag rather than by folder, why `type:feature` and `type:domain` are reserved unused, or how to choose a tag for a new project |
| Adding a locale | `nuxt.config.ts`'s `i18n` block, the JSON in [`infrastructure/translations`](../../infrastructure/translations/README.md), and `Locale` in `@monorepo/i18n`. Each README covers its own half of it; the task has no home |
| The agent setup as a thing a human can inspect | Twelve skills, two `PostToolUse` hooks, the `deny` list and four `CLAUDE.md` files, indexed only from the root `CLAUDE.md` — which is written for agents |

So the collection is worth growing, and it earns its existence from one rule:

> A subject enters `docs/` only if no single project owns it.

That rule is the whole design. It makes overlap with the READMEs impossible by construction rather
than by discipline, so the drift class 0040 is about cannot arise here: there is never a second copy
because there was never a first one. Its corollary answers the growth worry directly — when one
project's docs outgrow a single file, they subdivide *inside that project* (`apps/huella-legal/docs/`,
sub-READMEs beside the code), they do not migrate to the root tree. The root tree grows only when a
genuinely new cross-project subject appears, which is a much slower rate than the app grows.

Three homes, split by what a reader wants rather than by topic:

| Home | Holds | On day one |
| --- | --- | --- |
| `docs/concepts/` | The models that span projects — the *why*, no procedure | The boundary model; how a version gets derived from a commit |
| `docs/guides/` | Task-shaped, cross-project, procedural | First hour in this repo; adding a locale; what happens between `issue:pick` and a merged PR |
| `docs/FEATURES.md` | Generated index: every command, hook, workflow and skill, with the doc that explains it | Rendered by `pnpm docs:map`, checked in CI |

`docs/FEATURES.md` is the only generated one, and it stays a pure index — what invokes a capability,
where it lives, which doc explains it, and nothing else. The *why* stays in the doc it points at, so
the map has no hand-written column to clobber on the next render. It enumerates what already
declares the surface: each `package.json`'s `scripts` and `nx.tags`, `.github/workflows/`,
`.husky/*` and `.claude/skills/*`, from a new folder under
[`infrastructure/scripts/src/`](../../infrastructure/scripts/README.md#-adding-a-script). Wired into
the `docs:check` gate 0040 adopted, its second assertion — every capability resolves to a doc that
mentions it — fails today on the `commit-msg` injection, on `pnpm test:coverage`, on Storybook in
`packages/ui` and on the skills corpus, none of which the root README mentions at all.

AI carries the extraction and the audit on all three: enumerating the surface, diffing a render
against what is checked in, and reporting which cross-project subject has no doc.
[`drift/detect.ts`](../../infrastructure/scripts/src/drift/detect.ts) already does the hard part of
the diff. What it does not do is author a concept doc unreviewed — `house-docs` names that as the
anti-pattern because it yields text restating a signature where the constraint was the only thing
worth reading, and the concepts tree is *entirely* constraint.

## Options considered

| Option | Why not |
| --- | --- |
| Per-project READMEs only | The status quo. No README can own a subject that spans projects, so the four rows above stay unwritten however good the READMEs get |
| A generated `FEATURES.md` and nothing else | A table of contents is not documentation: it answers "what exists" and never "how does this fit together". It is necessary and it was too thin as the whole answer |
| Consolidate prose into `docs/`, READMEs reduced to stubs | Moves canonical text away from the code, so a doc stops changing in the diff that changes its subject, and buys a drift pair per project to police what colocation was already preventing |
| A folder per Diátaxis genre, all four | Reference is the genre the READMEs already are; a fourth folder for it would be the duplication this avoids. Three earn their existence, one doesn't |
| A hand-written index | Cheapest to start, fastest to rot — nothing forces a row for the next script, which is how three of the four index gaps happened |
| GitHub wiki | Outside the repo: no review, no `docs:check`, and no way for a doc to land in the same PR as the code it describes — already rejected in #37 |

## Consequences

Unlocks the two things a README cannot be: an ordered way in for someone who has never seen the
repo, and a home for the cross-project subjects that currently live only in whoever wrote them.
Both arrive with a gate rather than a good intention — once `docs:map` runs inside `docs:check`,
adding a capability without a doc becomes a CI failure.

Forecloses the option of ever consolidating the READMEs into `docs/`. The ownership rule cuts both
ways: it keeps the new tree free of duplicates, and it means a project's own docs stay in the
project forever, subdividing in place as they grow.

The internal app to render all of this is **deferred out of this spike** — it is a view over the
same sources and changes nothing about where they live. When it comes back it needs a boundary
decision before any scaffolding, and that is the reusable finding: it fits nowhere in the tag table
today, since the [root README](../../README.md#-architecture--boundaries) defines `infrastructure/`
as what is neither released nor user-facing — a docs site exactly — while `type:infra` may depend
only on `type:config` and so could not import `@monorepo/ui`. Filing it under `apps/` contradicts
that same paragraph. Either `type:infra` widens or a `type:docs` tag lands in both copies of the
table.

Revisit the ownership rule if a subject arrives that one project mostly owns but not entirely. The
rule has no tie-breaker by design, and inventing one per document is how a `docs/` tree starts
absorbing prose that belonged next to the code.

#38 is a duplicate of #37 and closes with it. The map, the concepts tree and the guides tree are
three implementation issues; none has been filed.
