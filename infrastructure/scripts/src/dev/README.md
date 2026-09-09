# 🚀 dev

The front door of the repo. `pnpm dev` on its own used to be a dead end — there is no single thing
to start in a monorepo with three apps and a Storybook — so this asks which one, and installs the
workspace first if this is a fresh clone. It never starts more than one project.

```sh
pnpm dev                 # search or browse every project that declares a dev script
pnpm dev tech-docs       # skip the picker
pnpm dev "Huella Legal"  # the label the picker shows works too
pnpm dev huella          # not a name — opens the picker with "huella" already typed
```

## 🗂 Structure

```
index.ts             installs if needed, then imports the rest — the one entry point that isn't the five-line copy
main.ts              the list, the picker, and handing the terminal to the child
adapters/nx.ts       which projects declare a dev target, and which layer each lives in
adapters/pnpm.ts     the install check, the install, and the dev run itself
domain/projects.ts   names → rows, the order they're offered in, and matching a typed one
```

## 📋 Where the list comes from

`nx show projects --with-target dev`, the same question
[`coverage-report`](../coverage-report/README.md) asks about `test:coverage`. Nx already knows what
exists and what each project declares, so an app added next month shows up here on its own, and
nothing in this folder holds a list of project names to fall out of date. A project appears in the
picker by adding a `dev` script to its `package.json` and nowhere else.

It runs once per project root — `--projects "apps/*"`, then `infrastructure`, then `packages` —
rather than once for the lot, because `--projects` matches on directory, so **which query answered
is the project's layer**. That's three subprocesses however large the workspace gets (about a second
for all three against a warm daemon), where `nx show project <name>` costs one per row and grows
with the list. Nothing has to map a package name back to a directory either, which is the assumption
that breaks the day a package isn't named after the folder it sits in.

Two entries never appear. `@monorepo/scripts` declares a `dev` script — that is how `pnpm dev`
reaches this file at all — and picking it would just re-open the picker, so `SELF` in
[`projects.ts`](./domain/projects.ts) drops it. The root `package.json` isn't an Nx project, so it
never enters the list to begin with.

## 🔎 The picker at fifteen projects

It's clack's `autocomplete`: the plain list until you type, a search box after that. The newcomer
who doesn't know what's in here still just reads a list, and nobody has to scroll it once this repo
has more dev servers than fit on a screen. Four decisions are what make it hold at that size:

| Decision | Why |
| --- | --- |
| Apps first, then `infrastructure`, then `packages` | The list has to answer "which one is the app" before anything else. `ROOT_ORDER` in [`projects.ts`](./domain/projects.ts), deliberately not `PROJECT_ROOTS`' order — a spec pins that every declared root is ranked, so a fourth one can't quietly sort last |
| The layer rides in the row: `Huella Legal · apps` | clack renders a hint only for the row you're on, so a layer left in the hint is invisible on every row you haven't arrowed to — which is all of them, while you're deciding |
| The search matches the layer too | Typing `apps` narrows to the apps. At fifteen rows, "which of the apps" is the other question being asked |
| The hint is the `--filter` name | On the active row the picker shows the exact thing you could have typed instead, before printing it again on the way out |

Alphabetical inside a layer, so rows don't move between runs. Labels are the scope stripped and
kebab-case turned to Title Case, with `ACRONYMS` holding the words that ruins — `@monorepo/ui` reads
`UI`, not `Ui`.

A typed argument matches the scoped name, the bare name or the label, case-insensitively, and
nothing else — a half-typed `huella` never resolves to a project this script chose on your behalf.
It opens the picker with `huella` already in the search box instead, which narrows to the same
answer while leaving the choosing to you.

## 📦 The fresh-clone case

[`index.ts`](./index.ts) breaks the layout rule every other script follows, and the comment there
says why: `../shared/cli.ts` reaches `@clack/prompts` through `io.ts`, so on a clone with no
`node_modules` a static import kills the process with `ERR_MODULE_NOT_FOUND` before a single line of
this can run — the exact first-run experience the script exists to fix. So `ensureInstalled` runs
first against nothing but Node builtins, and `cli.ts` and `main.ts` are imported dynamically after
it.

For the same reason `ensureInstalled` writes plain `process.stdout` lines instead of going through
`out`: at that point in the process there is no clack to print with. It is the only place in this
package allowed to do that.

It installs rather than asking, because asking needs the prompt library that isn't there yet, and
`pnpm install` is what the person was going to type next anyway. `-C <repo root>` pins it to the
workspace — `pnpm --filter` leaves cwd inside this package, and installing from here would leave
every other project's dependencies missing.

## 🖥 Handing over the terminal

`inherit` in [`shared/adapters/exec.ts`](../shared/adapters/exec.ts) is the door out, not `run`: a
dev server's output *is* the point, and `run` pipes stdout to capture it as a string. It returns the
child's exit status, and `null` when a signal ended it — Ctrl+C, which is how you stop a dev server
and so is deliberately not turned into a non-zero exit.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Running two projects at once (an app plus its BFF) | `main.ts` picks exactly one and `dev()` blocks on it. Multi-select means owning two children's output and shutdown, which is what `nx run-many -t dev` already does — reach for that until the ceremony is worth wrapping |
| Remembering the last pick | No cache read at all, though [`shared/adapters/cache.ts`](../shared/adapters/cache.ts) is right there. `initialValue` on the prompt is the whole change. Deferred because a four-row picker doesn't cost enough to be worth being wrong about, and typing the name already beats both |
| Group headings in the list (`— apps —`) | clack has no non-selectable row, and `groupMultiselect` is multi-select only. The layer in each row is the cheap version of the same thing; a real heading means either a fake disabled option or a different prompt |
| An acronym the labels don't know | `ACRONYMS` in [`projects.ts`](./domain/projects.ts) is a hand-kept list, so a new `@monorepo/cdn-edge` reads `Cdn Edge` until someone adds it. A wrong label is cosmetic and the fix is one word, which is why it isn't derived from anything cleverer |
| Asking before installing | Can't be done where it matters: the prompt library is the thing that's missing. A `--no-install` flag through `flag()` is the cheap version if the auto-install ever surprises someone |
| A project whose dev server needs env vars or a docker compose up first | Nothing here reads `.env` or checks a container — `translations` documents its own `docker:up` in [its README](../../../translations/README.md). A preflight per project belongs in that project's `dev` script, not in this picker |
