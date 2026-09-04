# 🌱 First hour in this repo

An ordered way in, for a clone with nothing read yet. Every step links to where the real content
lives — this file sequences, it doesn't repeat.

## 1. Set up before touching anything

```sh
pnpm install
git config core.hooksPath .husky
```

The second line is easy to skip and nothing catches you if you do — [lifecycle scripts are banned
here](../../CLAUDE.md), so there's no `prepare` script to install Husky for you. Skipping it means
the commit and push gates below simply never fire, which looks like a repo with no rules rather
than an unfinished setup. Full sequence, including the app's own dev server, is in the
[root README's Getting started](../../README.md#-getting-started).

## 2. Read the shape before the code

In this order:

1. [Root README](../../README.md) — the workspace layout table and the
   [architecture & boundaries](../../README.md#-architecture--boundaries) table. Skim, don't
   memorize; you'll come back to both.
2. [Root `CLAUDE.md`](../../CLAUDE.md) — even though it's written for an agent, it's the fastest
   list of "things that look reasonable and are wrong here", and every one of them is a mistake
   that already happened once.
3. [`docs/concepts/boundaries.md`](../concepts/boundaries.md) — the *why* behind the table you just
   skimmed. Read this before touching a second project; it's what stops "just import it" from
   being a live option.

## 3. Find the project you actually came for

The workspace layout table in the root README names all eight projects in one place. Once you know
which one you're here for, its own `README.md` and `CLAUDE.md` are the source of truth — this repo
deliberately keeps per-project reference there rather than duplicating it into `docs/`, so from
here the project's own docs take over.

## 4. Make your first change the way the repo expects

`pnpm issue:pick` is the shortest path to a branch: pick an open issue off a project board and it
creates `<type>/<issue number>-<slug>`, assigns you, and checks it out. From there,
[`docs/guides/change-lifecycle.md`](./change-lifecycle.md) walks what happens between that first
commit and a released version — worth reading once before your first push, since several of its
steps (the commit message rewrite, the push gates) act on you silently and are easy to mistake for
a broken tool the first time you see them.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A project-specific onboarding step (env vars, local services) | Stays in that project's own README — this guide only sequences the cross-project parts |
