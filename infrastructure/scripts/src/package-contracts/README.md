# 🤖 `pnpm package:check`

Checks the direct packages in `packages/` against the metadata and raw-source export contracts this
workspace relies on. It is a read-only local check: it reads manifests and package files without
packing, publishing or building anything.

| Command | What it does |
| --- | --- |
| `pnpm package:check` | Validate package metadata, conditional export targets and peer metadata |

## 🗂 Structure

```
index.ts       hands main to run()
main.ts        reports every package and collects failures
adapters/      discovers package manifests and files
domain/        validates manifest and export contracts
```

## ✅ Validation

Every package must declare its expected `@monorepo/<directory>` name, a non-empty version, ESM
module type and a non-empty export map whose literal and wildcard targets resolve to real files.
Peer metadata is checked when present; packages without it are reported as skipped for that check.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Validate a published artifact | Add a separate packaging experiment that defines tarball and consumer semantics; this command stays about the raw-source workspace contract |
| Enforce contracts in CI | Add an explicit CI policy after local output has been evaluated, rather than making this exploratory command a gate immediately |
