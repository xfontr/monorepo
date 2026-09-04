# 🗺 `pnpm docs:map`

Renders [`docs/FEATURES.md`](../../../../docs/FEATURES.md): every command, git hook, workflow and
agent skill in the repo, each with the doc that explains it. It exists because this repo's docs are
all *reference* — a README answers "how does X work" for an X you already know about, and nothing
answered "what is in here". See
[`0037-feature-discoverability.md`](../../../../docs/spikes/0037-feature-discoverability.md).

| Command | What it does |
| --- | --- |
| `pnpm docs:map` | Re-render the map |
| `pnpm docs:map --check` | Exit 1 if the checked-in map differs from the render — the CI step |

## 🗂 Structure

```
capabilities.ts   what counts as a capability, and which doc explains one — pure
render.ts         capabilities + docs → the markdown — pure
read.ts           the filesystem and git side
index.ts          entry point, and --check
```

## 🔍 What it finds

Four kinds, each read from the file that already declares it. Nothing is registered by hand, which
is the point: a hand-kept list is what let the `commit-msg` subject rewriting and `packages/ui`'s
Storybook stay undocumented for as long as they did.

| Kind | Read from | Skipped |
| --- | --- | --- |
| Command | root `package.json`, then each project's | `lint`, `typecheck`, `test`, `test:dev`, `test:coverage`, `build` — every project has them and the root README covers them once. A project script the root already wraps is skipped too, so one capability never gets two invocations |
| Hook | `.husky/*` | `_/`, which is husky's own generated shim |
| Workflow | `.github/workflows/*.yml` | — |
| Skill | `.claude/skills/*/SKILL.md`, plus each project's | — |

A skill's name comes from its frontmatter rather than its directory, because the frontmatter is
what the Skill tool dispatches on. Project skills are addressed `content:new-vendor`, which is also
the only thing telling `content`'s `new-vendor` apart from `i18n`'s.

## 📄 Picking the doc

Every markdown file in the tree is a candidate except three kinds, each of which would produce a
match that isn't an answer: a generated `CHANGELOG.md`, anything under `docs/reviews/` (a review
names a capability to score it, not to explain it), and the map itself. A capability's own source
file is excluded as well — otherwise every skill would cite its own `SKILL.md` and the column would
be uniformly full and worthless.

Candidates are ranked by **audience** first, then nearness: `README.md`, then anything else, then
`CLAUDE.md`, then `SKILL.md`. Audience has to win, and that ordering is the one real bug this had —
ranking by nearness first made every skill cite whichever *other* skill mentioned it, because two
shared segments under `.claude/skills/` beat the root `CLAUDE.md` table that actually indexes them.
Within one audience, nearness keeps a `packages/ui` command pointing at `packages/ui/README.md`
rather than at the root README.

A token has to stand alone to count, so a doc covering `release:dry` does not answer for
`release`, and one covering `test:coverage` does not answer for `test`.

## ✅ What `--check` does not do

It asserts only that the checked-in file matches the render. It deliberately **does not** fail on a
`—` row, because some capabilities are undocumented on purpose — `pnpm release` runs from the
Release workflow and never locally, so a gate demanding a doc for it would be demanding the wrong
thing, and a check that cries wolf gets switched off within a week. The `—` stays visible in the
map, which is where a human can judge it.

The forcing function comes from the exact-match half regardless: a new script, hook, workflow or
skill changes the render, so it fails CI until the map is regenerated.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Env vars in the map | They're the one part of the surface with a real per-project doc already (each README's `🔑 Environment` table), and `.env.example` names them without explaining them — add a fifth kind only if a var ever goes undocumented |
| A capability nothing declares | The renderer can only index what a `package.json`, hook, workflow or skill file states. A convention living purely in prose has no source to read, and would need the hand-written row this avoids — that is the signal to reconsider the whole approach, not to add an exception |
| Nx targets that aren't package scripts | Every target today is inferred from a script or a plugin default; a `project.json` would change that, and this repo has none by design |
