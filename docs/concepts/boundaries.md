# 🧱 Why the boundary system exists

Every project declares an `nx.tags` array in its `package.json`, and
[`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts) turns those tags into
`@nx/enforce-module-boundaries` lint rules — the same table appears, readable, in the
[root README](../../README.md#-architecture--boundaries). What neither copy says is why the layers
are tags rather than folders, why two of them sit unused, or how to pick one for a new project.
That's what this file is for.

## 📐 Why tags, not folders

`packages/`, `apps/` and `infrastructure/` already look like layers, and it would be tempting to
enforce boundaries on that split directly. It doesn't hold up: `infrastructure/translations` and
`infrastructure/scripts` have nothing in common architecturally — one is a service an app talks to
over HTTP, the other is a leaf nothing imports at all — and folding them into one `type:infra` tag
that both may use would let `scripts` (personal dev tooling) end up importable from `translations`
(a served TMS) just because they share a parent directory. The tag table treats "what may this
depend on" as the only question that matters, and a folder answers a different one — "where does
this live for a human browsing the tree". Tags let those two answers diverge on purpose: `ui`,
`i18n`, `content` and `observability` all sit under `packages/`, are versioned the same way, and
still can't import each other, because none of them has any reason to.

## 🌱 `type:feature` and `type:domain`, reserved and empty

Two tags exist in the table with no project wearing them yet:

| Tag | May depend on | Why it's there already |
| --- | --- | --- |
| `type:feature` | `type:domain`, `type:ui`, `type:i18n`, `type:content`, `type:config` | The layer a feature package would compose from — UI plus domain logic, no direct app dependency |
| `type:domain` | `type:domain`, `type:config` | Pure business logic, shared between features without depending on how any of them render |

`huella-legal` currently imports `ui`, `i18n`, `content` and `observability` directly, because
there's exactly one app and splitting business logic out from it has no second consumer yet to
justify it. The rule of thumb the root README states — apps compose, everything else stays a leaf
— already anticipates a second app or a feature big enough to need its own package. Reserving the
tags now means that day doesn't also require a `boundaries.ts` migration: the constraint is already
written, waiting for a project to claim it.

## 🏷 Choosing a tag for a new project

`type:app` composes everything; every other tag is a leaf that may depend on `type:config` and, at
most, projects that share its own tag. So the question for a new project is never "what layer does
this feel like" — it's "what may this legitimately import, and what would break if something else
imported it back". A service reached over HTTP rather than imported (`type:infra`, today
`translations`) and dev tooling nothing imports at all (`type:tooling`, today `scripts`) both
happen to sit under `infrastructure/`, but they got different tags because the actual question —
what may depend on this — has a different answer for each. [`new-package`](../../.claude/skills/new-package/SKILL.md)
walks the mechanical steps; this is the judgment call that precedes them.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A second app | `type:feature` and `type:domain` stop being reserved — this is the scenario they're already sized for |
| A tag that doesn't fit "what may this depend on" | Don't force it into the table — that's the signal the tag model itself needs revisiting, not just this file |
