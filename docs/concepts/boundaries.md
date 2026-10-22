# 🧱 Why the boundary system exists

Every project declares an `nx.tags` array in its `package.json`, and
[`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts) turns those tags into
`@nx/enforce-module-boundaries` lint rules — the same table appears, readable, in the
[root README](../../README.md#-architecture--boundaries). What neither copy says is why the layers
are tags rather than folders, why there is no row waiting for a project, or how to pick one for a
new project. That's what this file is for.

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

## 🌱 No reserved rows

The table used to carry `type:feature` and `type:domain`, written for feature packages that never
arrived. They were deleted rather than kept waiting, because a rule written before its first user
encodes a guess. The first feature package this repo is likely to see is one of `huella-legal`'s
Nuxt layers moved into a package, and that package would need an edge to a shared capability like
the `forms` layer, which the reserved `type:feature` row had no room for. So a tag gets its row
with its first project: the decision report that plans a feature package writes that row, against
the package it actually describes.

## 🔌 `type:integration` and `type:observability`

`content` and `i18n` share `type:integration`: each wraps one kind of vendor behind a port and a
Nuxt module, and an app composes them. One tag for the pair means the next vendor package needs no
new row. They still can't import each other, since `type:integration` may depend on `type:config`
only, and a tag that doesn't list itself is a leaf even to its own kind.

`observability` keeps its own tag although it has the same shape. Folded in, it would sit wherever
integrations are allowed, and the day feature packages exist they will need integrations but must
not import telemetry: instrumentation stays the app's job, as the
[`content` README](../../packages/content/README.md) explains for its upstream calls.

## 🗺 Scopes

Every project carries exactly one `scope:*` tag beside its `type:*` tag, and both rules apply to
every import. `scope:shared` may depend only on itself, so a shared package can never reach into an
app. Every other scope may depend on itself and `scope:shared`, so an app-specific package can't be
imported by another app, nor `scripts` by the TMS. The rules cost five rows and pass today, since
every edge in the graph is an app or a tool importing a shared package; they exist so the first
`scope:huella-legal` package is bound by them the moment it is tagged, with no one remembering to
add a rule.

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
| A feature package, such as a `huella-legal` layer moved out | The decision report that plans it adds its `type:` row and the capability edge it needs, and tags it with its app's scope. A second app alone isn't the trigger: `developer-portal` shares nothing with `huella-legal` |
| A tag that doesn't fit "what may this depend on" | Don't force it into the table — that's the signal the tag model itself needs revisiting, not just this file |
