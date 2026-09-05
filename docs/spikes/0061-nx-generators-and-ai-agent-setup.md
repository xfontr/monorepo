# 🧭 Nx generators, the MCP server and `nx migrate`

Spike: #61

## Context

The question was whether any of the Nx platform features this repo doesn't use yet — code
generators, sync generators, Nx Cloud orchestration, `nx migrate`, and the AI-coding-agent
integration — were worth adopting, given what this repo actually already leverages: `nx affected`
plus local caching, the project graph and tag-based boundaries
([`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts)), `nx release`, and inferred
targets from `@nx/nuxt` / `@nx/eslint` / `@nx/vitest` / `@nx/vite`. Two candidates looked like a
concrete fit against real, already-documented pain: [`CLAUDE.md`](../../CLAUDE.md)'s own "two places
that must agree" section names the `boundaries.ts` ↔ README tag table as "the standing failure mode
in this repo," and the `new-package` skill exists specifically because six files have to agree
across directories when scaffolding a project.

## Result

Both generator candidates were built far enough to prove they work, and both were reverted. Two
much smaller things were adopted instead.

**Local Nx generators.** A new `infrastructure/nx-plugin` package was scaffolded with two
generators: `new-package` (mechanizes steps 2-4 of the `new-package` skill — `package.json`, the
three wrapper configs, a README skeleton) and `sync-boundaries` (a global sync generator, wired into
`nx.json`'s `sync.globalGenerators` and CI via `nx sync:check`, that dynamically imports
`boundaries.ts` and regenerates the README's tag table from it, failing loudly on a `type:` tag with
no `depConstraints` entry or a project missing from the workspace-layout block). Both were fully
wired — CI step, root `pnpm sync` script, skill and CLAUDE.md updates — and verified end to end:
`nx sync` correctly caught the plugin's own project missing from the README on first run, regenerated
the table to match `boundaries.ts` byte for byte, and `lint`/`typecheck`/`test`/`nx sync:check`/
`docs:map --check` all passed clean.

It was reverted anyway. The problem being solved — a six-file scaffold done occasionally, and a
two-file drift `check-invariants.sh` already nudges about on every agent edit — didn't need a
devkit-based plugin package, dynamic TypeScript importing of `boundaries.ts`, and its own test suite
to fix. That's permanent maintenance surface sized for a team monorepo, not this one.

**`nx g nx:set-up-ai-agents`** (Nx's own "enhance coding agents" generator) was read at the source
level inside the installed `nx` package rather than run. For the Claude Code path specifically, it
does not add a plain MCP server entry: it installs a third-party Claude plugin from an external
marketplace (`enabledPlugins: {"nx@nx-claude-plugins": true}`, sourced from
`github:nrwl/nx-ai-agents-config`), and it widens `.claude/settings.json`'s sandbox
`network.allowedDomains` to let Nx's analytics domain through — directly against this repo's own
`"analytics": false` in [`nx.json`](../../nx.json). Left at its default `agents` option, it also
writes Cursor/Gemini/Codex/Copilot/opencode config nobody here uses, cloning an external config repo
to do it. Not run. The narrower thing actually wanted — Nx's project graph and generators reachable
over MCP — doesn't need any of that: a plain project-scoped `.mcp.json` with a `stdio` entry
(`npx nx mcp`) gets there in one small, fully reversible file. That minimal version is what was
adopted, with one correction that only testing found.

**[`.mcp.json`](../../.mcp.json), adopted.** Eight lines, no plugin, no marketplace grant, no
sandbox change. The obvious entry is useless, though: `nx-mcp` 0.25.0 defaults `--minimal` to
`true`, which hides every workspace-analysis tool, so a server registered the plain way exposes
exactly one tool — `nx_docs`, a documentation fetcher. Nothing reports that as an error; it
surfaced by driving the server over stdio and reading its CLI parser. `--minimal=false` registers
seven. `--disableTelemetry` is passed because the server's own default is to send telemetry, which
`analytics: false` in [`nx.json`](../../nx.json) already answers.

Roughly half of what it registers actually works against Nx 23:

| Tool | Against this workspace |
| --- | --- |
| `nx_workspace`, `nx_workspace_path` | Annotated `nx.json` and the project graph — the reason the file exists |
| `nx_generators`, `nx_generator_schema` | Work, but list the `@nx/*` generators this repo deliberately doesn't use |
| `nx_project_details` | **Broken** — hardcodes `nx/src/utils/find-matching-projects`, and Nx 23 moved its internals under `nx/dist/` |
| `nx_docs`, `nx_available_plugins` | Work; both fetch from `raw.githubusercontent.com` at call time |

Two things to know before trusting it. `nx mcp` fetches `nx-mcp` **unpinned** on every cold start
(0.25.0 today), so the table above can change without anything in this repo changing. And the
server loads `.env`, `.env.local` and `.local.env` from the workspace root into its own process
environment, which sits oddly beside the `Read(**/.env)` deny rule in
[`.claude/settings.json`](../../.claude/settings.json).

**`nx migrate`, used for the pending 23.0.1 → 23.2.0 bump.** Nine migrations: seven applied, two
deferred as AI prompts, and both deferred ones are no-ops here — all eight ESLint configs are
already flat and `ban-types` appears nowhere in source. The workspace passes cold afterwards: 24
tasks of lint, typecheck, test and build in 22.6s, `docs:map --check` clean.

It also changed four things nobody asked for, all reverted:

| What it did | Why it was reverted |
| --- | --- |
| Injected `"ignoreDeprecations": "6.0"` into all eight `tsconfig.json` files | Typecheck passes cold on all eight without it. Suppressing a TS 6 deprecation nobody has hit hides the breakage the warning exists to announce |
| Reformatted those eight files and the root `package.json` to 2-space | 4-space is house style everywhere but `package.json`; it turned a six-line bump into a hundred-line diff |
| Left `migrations.json` at the root | Spent the moment the migrations ran |
| Created `tools/ai-migrations/` at the root | A directory outside the documented workspace layout, holding two prompts that are no-ops here |

The habit is still worth keeping — a plain version bump would have skipped seven codemods — but a
migrate run has to be read afterwards, not trusted.

## Options considered

| Option | Why not |
| --- | --- |
| Local Nx generators in `infrastructure/nx-plugin` (built, verified, reverted) | Worked correctly, but the plugin package + dynamic TS parsing + test suite it took to get there is disproportionate to a six-file scaffold and a two-file drift a hook already nudges about |
| `nx g nx:set-up-ai-agents`, default options | Installs a third-party plugin marketplace grant and loosens the sandbox network allowlist against `analytics: false`; also configures five agents unused here |
| Nx Cloud (remote caching, distributed task execution, self-healing CI) | A hosted vendor account and token for one CI runner, against CLAUDE.md's posture of no vendor endpoints — and the whole workspace now measures at 22.6s cold, so there is no CI pain to spend it on |
| An Nx sync generator for the `boundaries.ts` ↔ README table | A sync generator is only a delivery mechanism: the renderer still has to be written by hand, and `docs:map` already delivers one the same way with no plugin package behind it |
| Caching `.nx/cache` in CI | Would help a PR that gets several pushes, but [`ci.yml`](../../.github/workflows/ci.yml) restores no cache today and a 22.6s cold workspace isn't worth a cache key to maintain |

## Consequences

The Nx surface itself is unchanged — `affected` + cache, the project graph and boundaries,
`nx release`, inferred targets. `infrastructure/nx-plugin`, the `nx.json` `sync` block, the CI
`sync:check` step and every doc edit that referenced them were reverted in the same session they
were built. What landed is [`.mcp.json`](../../.mcp.json) and the 23.2.0 bump in
[`package.json`](../../package.json) with its lockfile: no new project, no new CI step, no new
target.

One loose end from the migrate half. [`renovate.json`](../../renovate.json) will bump `nx` and
`@nx/*` as ordinary version bumps and skip their migrations entirely, which is the exact failure
`nx migrate` exists to prevent. A `packageRule` handing those packages to `nx migrate` instead
would make the habit stick; it isn't written yet.

The generator idea is worth revisiting only if either half of the "two places that must agree"
problem starts drifting in practice rather than in theory, more often than `check-invariants.sh`'s
prose nudge catches. The right-sized fix then is a `--check` script in
[`infrastructure/scripts`](../../infrastructure/scripts) rendering the README table from
`boundaries.ts`, the way `docs:map` already renders [`docs/FEATURES.md`](../FEATURES.md) — not a
plugin package, and not a sync generator.

That framing matters for a second reason. Only one of `check-invariants.sh`'s six checks concerns
derived content at all; the other five are policy assertions with no Nx equivalent to move them to.
All six share the same real gap, which is not about Nx: the hook fires only when an *agent* edits a
file, so the same violation made by hand and pushed passes every gate the repo has — the pre-push
hook runs lint, test and typecheck, and CI never runs the invariants at all.
