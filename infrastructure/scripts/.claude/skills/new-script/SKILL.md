---
name: new-script
description: Add a script to @monorepo/scripts — the index.ts/main.ts/adapters/domain folder, the package.json line, the README row and the docs:map re-render. Use when adding a new repo-local CLI under infrastructure/scripts, or when splitting an existing one.
---

# Adding a script

The layout rule and the import direction are in the [package README](../../../README.md#-structure).
Follow them; this file is what the prose can't enforce. Read [`drift/`](../../../src/drift) first —
it is the smallest complete example of all four layers.

## The folder

Five things, and the last two are the ones that get forgotten:

```
src/<name>/index.ts      five lines, copied verbatim from any other script
src/<name>/main.ts       the command
src/<name>/adapters/     one file per boundary out
src/<name>/domain/       the pure part
src/<name>/README.md     what it's for, a 🗂 Structure block, 🧭 Deliberately deferred
```

plus a line in [`package.json`](../../../package.json)'s `scripts`, a row in the package README's
command table, and — if a human types it rather than a hook or another script calling it — a
forwarding line in the **root** `package.json`. `coverage` deliberately has no forward, because it
rides on the root `test:coverage`.

**Create `adapters/` and `domain/` even when one holds a single file.** The point of the layout is
that `ls` answers "what runs, what talks to the outside, what's pure" before anyone opens anything;
a folder that skips a layer because it only needed one file breaks exactly that.

## The five things that go wrong

1. **`pnpm docs:map` is not optional.** A script is a capability, so
   [`ci.yml`](../../../../../.github/workflows/ci.yml) fails on `docs:map --check` until
   `docs/FEATURES.md` is re-rendered. Never hand-edit that file. If the new row shows `—` in the
   *Explained in* column, the fix is the missing `README.md`, not the cell.

2. **Never name a directory `coverage` or `types`.** Both are in
   [`baseIgnores`](../../../../../packages/configs/src/eslint/lib/ignores.ts), so ESLint silently
   skips them. `src/coverage/` went unlinted long enough to drift to `interface` and semicolon
   delimiters while the rest of the package used `type`; it is `coverage-report/` now for that
   reason alone, and the pure layer is `domain/` and not `types/` for the same one.

3. **No side effects at module scope, and `process.exit` never.** Read `process.env` inside `main`,
   read flags through `flag()` from [`shared/cli.ts`](../../../src/shared/cli.ts), and let `run`
   decide the exit code — throw `ExpectedError` when the message *is* the whole answer, or
   `CancelledError` from a cancelled prompt. `run` sets `process.exitCode` rather than exiting,
   because a write to a pipe is asynchronous and exiting on the next line truncates it. Two
   modules here used to resolve the repo root at import time and could not be imported outside a
   git checkout, which is why neither had a spec.

4. **cwd is this package's directory, not the repo root.** `pnpm --filter` changes into it first, so
   a relative path like `packages/ui` resolves against `infrastructure/scripts/packages/ui` and
   matches nothing. Build every path with `at()` from
   [`shared/adapters/git.ts`](../../../src/shared/adapters/git.ts).

5. **Any value you didn't author goes through `assertNotFlagLike`** before it reaches a `git` or
   `gh` argument — an issue title, a picked label, a ref out of the environment. A leading `-` is
   read as a flag rather than as the value of the one before it. `run` in
   [`shared/adapters/exec.ts`](../../../src/shared/adapters/exec.ts) can't do this for you: it also
   carries the flags themselves.

## Output goes through `out`

Never `console.log`, and never `@clack/prompts`' `log`/`intro`/`outro`/`spinner` directly —
[`shared/adapters/io.ts`](../../../src/shared/adapters/io.ts) picks clack or plain lines from
`isTTY && !CI`, and sends `warn`/`error` to stderr in both. Import `confirm`, `select` and `text`
from clack directly, since a prompt needs a terminal by definition; wrap every one in `orExit`.

That split is not cosmetic: `map/` runs in CI and `drift/` runs from a pre-push hook a GUI git
client can invoke with no terminal attached.

## Reuse, and when to promote

A helper stays in the script that needs it until a **second** script needs it, then it moves to
[`shared/`](../../../src/shared/README.md) — which is laid out the same way, so it lands in
`shared/adapters/` or `shared/domain/`, not at the root. The root of `shared/` is only `cli.ts` and
`errors.ts`. Don't pre-emptively share, and don't reach for a validation or utility dependency: the
package has four, all of them load-bearing.

Two script folders never import each other.

## Verify

```sh
pnpm exec nx run-many -t lint typecheck test --projects @monorepo/scripts
pnpm docs:map            # then commit docs/FEATURES.md
node src/<name>/index.ts # and once more with CI=1, if a hook or CI will run it
```

A spec is only owed by real logic — a parser, a diff, a mapping — and that logic lives in `domain/`,
which is what lets the spec call it with no mock. Don't write one that asserts a mock of `gh`
against itself.
