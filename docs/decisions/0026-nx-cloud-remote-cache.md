---
issue: 170
status: implemented
decision: accepted
---

# 🧭 Nx Cloud is adopted, for CI remote caching only

## Context

[`0005`](./0005-nx-generators-and-ai-agent-setup.md) rejected Nx Cloud: a hosted vendor account
and token for one CI runner, with a 22.6s cold workspace and no CI pain to spend it on. `4631088`
(`feat(nx-cloud): setup nx cloud workspace`, written by `nx connect`) connected the workspace anyway,
and CI has run through it since. No issue raised the adoption. The docs audit behind #170 found 0005
still reading as current, and this report records the state the repo is actually in.

## Result

**Nx Cloud serves as a remote cache for CI, and nothing more.**

| Piece | Where |
| --- | --- |
| Workspace link | `nxCloudId` in [`nx.json`](../../nx.json). It identifies the workspace and isn't a credential |
| CI credential | `NX_CLOUD_ACCESS_TOKEN`, passed only to the `nx affected` step of [`ci.yml`](../../.github/workflows/ci.yml). Provisioning is in [`repo-secrets.md`](../guides/repo-secrets.md) |
| Distributed task execution | Not used. No workflow calls `nx start-ci-run` |
| Self-healing CI | Not configured in any workflow |

A missing token fails silently: `nx affected` runs every task locally with no remote cache. A local
run by anyone without access to the workspace prints an Nx Cloud 401 and runs uncached. Neither
fails a task.

## Options considered

| Option | Why not |
| --- | --- |
| Hold to 0005 and disconnect | The workspace was connected by choice in `4631088`, and CI has cached through it since; this report records that choice rather than reversing it |
| Adopt distributed task execution as well | One CI job on one runner has nothing to distribute |

## Consequences

0005 is marked superseded by this report. Only its Nx Cloud row is reversed. Its outcome on
generators, `nx:set-up-ai-agents` and `.mcp.json` stands.

[`0015`](./0015-nuxt-prepare-wiring.md) asked to be revisited if Nx Cloud was adopted, because Cloud
runs the atomized `test-ci--*` targets directly. CI runs `-t test`, not `test-ci`, so those targets
are still latent, and the Vitest self-heal covers them if that changes.

`nxCloudId` is an instance ID written into the repo, which `AGENTS.md` otherwise forbids. The docs
audit tracks that exception separately.

Revisit if CI grows past one job, which is when distributed task execution starts to pay; or if the
cache hit rate on PRs drops to nothing, which would leave only the vendor dependency.

## Confirmation

| Claim | Check |
| --- | --- |
| CI uses Nx Cloud | `grep -n NX_CLOUD_ACCESS_TOKEN .github/workflows/ci.yml` shows it on the `nx affected` step |
| Remote cache only | `git grep -n start-ci-run -- .github` returns nothing |
