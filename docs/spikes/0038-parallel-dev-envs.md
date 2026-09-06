# 🧭 Parallel dev environments across worktrees

Spike: #38
Status: To implement

## Context

Running multiple git worktrees at once (multiple branches, or multiple agents) means running this
repo's dev servers side by side. Four projects can be run locally: `tech-docs` (Nuxt dev),
`huella-legal` (Nuxt dev, plus `preview` after a build), `translations` (`pnpm dev`/`serve`, plus
`docker:up`), and `@monorepo/ui`'s Storybook — up to 7 ports per worktree, one of them
(`translations`) also reachable by `huella-legal` over HTTP rather than run standalone. None of the
Nuxt or Storybook ports are configurable today, so running the same project from two worktrees
collides on whichever default port it picks. The question: is a one-line-per-app `PORT` fallback
enough, or does the cross-service case (`huella-legal` → `translations`) need a per-worktree
coordination script.

## Result

The problem splits into two independent parts that the two options solve unevenly:

- **Collision-avoidance** — the same dev server bound twice by two worktrees. This applies to all 4
  projects and has nothing to do with worktrees specifically; it's just two processes on one port.
- **Sibling discovery** — one project's dev instance needing to find *its own worktree's* copy of
  another project, not some other worktree's. Today this applies to exactly one pair:
  `huella-legal` reading `NUXT_TRANSLATIONS_VENDOR_BASE_URL` to reach `translations`, and only when
  the `internal` i18n vendor is selected instead of Tolgee.

`translations` already half-solves its own piece: the Node process
(`server/src/configs/constants.ts`) reads `PORT` from the environment, so `pnpm dev`/`serve` in two
worktrees can already be pointed at different ports by hand. Its Docker path can't —
`docker/compose.yaml` hardcodes `127.0.0.1:4000:4000` — and nothing anywhere generates
`NUXT_TRANSLATIONS_VENDOR_BASE_URL` to match, so today that value is set once by hand and silently
goes stale for whichever worktree didn't set it last.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| **A — per-app `PORT` env fallback.** Each of the 4 dev commands reads `PORT` (or Nuxt's own `devServer.port`) with its current default as fallback; `docker compose` maps `${PORT:-4000}:${PORT:-4000}`. No new files. | One line per project; no new script or infra to maintain; solves collision-avoidance for all 4 projects immediately; nothing to keep in sync with `git worktree` internals. | Solves nothing about sibling discovery — `NUXT_TRANSLATIONS_VENDOR_BASE_URL` still has to be set by hand per worktree and still goes stale silently; running N worktrees still means a person picking N different port numbers themselves, just with the mechanism to accept them now in place. |
| **B — per-worktree base-port derivation script.** A script under `infrastructure/scripts` derives a base port from the worktree (path or branch) and writes each project's port plus `NUXT_TRANSLATIONS_VENDOR_BASE_URL` for that worktree. | Solves both halves — collision-avoidance and sibling discovery — and removes the manual, silently-stale env value entirely; matches the pattern in the article that prompted this spike. | New script plus its own tests/README under `infrastructure/scripts`, one more thing to keep working as projects are added or removed; needs its own decision about *how* a "worktree" is identified (path hash? branch name?) that option A never has to make; over-solves the 3 projects that have no sibling to discover. |

## Consequences

Adopting A unblocks running any of the 4 projects from two worktrees without a collision, today,
with no new code to maintain — but leaves `huella-legal`↔`translations` coordination manual, which
is fine as long as that pairing stays rare (Tolgee is the current default vendor) and gets
revisited if the `internal` vendor becomes the norm. Adopting B removes that manual step but commits
to a new script with its own maintenance surface and a "what identifies a worktree" decision this
spike didn't need to make. The two options aren't mutually exclusive: nothing here forecloses
starting with A and adding B's script later purely for the sibling-discovery half, once or if the
`internal` i18n vendor becomes the default.
