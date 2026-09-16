---
issue: 102
status: wont-implement
decision: accepted
---

# 🧭 Commit scope stays out of the convention

## Context

Proposed: fold the GitHub Project name already carried by the branch (e.g.
`feature/technical-docs/102-...`) into the commit as a conventional-commit scope —
`feat(technical-docs): [113] include doc checks in pipelines` — instead of the current
`feat: [113] include doc checks in pipelines`.

## Result

**Nothing in the repo reads commit scope, so the change buys readability only, at the cost of
drift.** [`commitlint.config.mjs`](../../commitlint.config.mjs) extends
`@commitlint/config-conventional` with no overrides, so there is no `scope-enum` — a free-text
scope is accepted but nothing keeps `technical-docs`, `tech-docs` and `docs` from all showing up for
the same project across contributors. And [`nx.json`](../../nx.json)'s `release.projects` is
`packages/*` only, `projectsRelationship: "independent"`: Nx attributes a commit to a project by the
files it touched, not by parsing the commit's scope, so scope is invisible to versioning either way
— doubly so for `technical-docs`, which is an app and outside `release.projects` regardless.

## Options considered

| Option | Why not |
| --- | --- |
| Add scope = GH Project name, no enum | Free-text with nothing enforcing it drifts across contributors, and no tooling here consumes it anyway |
| Add scope = GH Project name + a `scope-enum` | Buys consistency, but only for a cosmetic benefit — `nx release` doesn't key off commit scope, and the projects most likely to want this (`apps/*`) aren't even in `release.projects` |

## Consequences

The convention stays `type: [issue] subject`, no scope. Revisit if `nx release` ever grows
scope-based commit attribution, or if `release.projects` is widened to include `apps/*` such that a
scope could carry real information some tool consumes.

## Confirmation

`grep scope commitlint.config.mjs` stays empty — no `scope-enum` added. `git log --oneline` keeps
reading `type: [issue] subject`, with no `(scope)` appearing between them.
