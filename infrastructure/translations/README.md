# 🌐 @monorepo/translations

A TMS (Translation Management System). It holds locale files as plain JSON and
serves them over HTTP, so an app talks to it exactly as it would talk to a hosted
provider — no vendor account, no API key, and the messages stay in the repo.

```
infrastructure/translations/
  projects/<project>/<locale>.json   ← the messages (hand-editable)
  server/                            ← the HTTP API over that JSON
  docker/                            ← image + compose for running it, locally or deployed
```

The first of the services under `infrastructure/` — see the
[root README](../../README.md#-workspace-layout) for what belongs there.

## 🔌 Who uses it

It backs the `internal` vendor in [`@monorepo/i18n`](../../packages/i18n). Any app
can point at it by naming that vendor and setting `baseURL`; it takes no API key.

[`@monorepo/huella-legal`](../../apps/huella-legal) is currently configured against Tolgee.
Which vendor it ends up on isn't settled — swapping is a vendor name and a base
URL, and the app never learns which one it got. See the
[app README](../../apps/huella-legal/README.md#-i18n).

## 📡 Endpoints

| Method | Path | Returns |
| ------ | ---- | ------- |
| `GET` | `/:locale/:project` | the locale's full message tree |
| `GET` | `/health` | `{"status":"ok"}` — liveness probe for the container |

```bash
curl http://localhost:4000/en-GB/huella-legal
```

`:locale` and `:project` are the JSON file and its directory, so the route above
serves `projects/huella-legal/en-GB.json`. Adding a locale means adding a file —
there is nothing to register.

Responses are CORS-open (`Access-Control-Allow-Origin: *`). Unknown locales
return `404`; unsafe `:project`/`:locale` path segments return `400`; a locale
file that exists but fails to read (bad JSON, permissions) returns `500`.

## 🐳 Run in Docker (recommended)

The image is the deployable artifact: multi-stage, production dependencies only,
non-root, `restart: unless-stopped`. The same build runs locally, where you start
it once and forget it — it comes back after a crash or a reboot. "Production
dependencies only" is `pnpm --filter=@monorepo/translations deploy --legacy
--prod --frozen-lockfile /out` in the [`Dockerfile`](./docker/Dockerfile) —
`deploy` writes a self-contained `node_modules` for just this package,
`--legacy` because the workspace isn't set up as `deploy`'s non-legacy mode
expects. The build context itself is trimmed by
[`Dockerfile.dockerignore`](./docker/Dockerfile.dockerignore) (no `.git`,
`node_modules`, build outputs, or markdown). Run from this package
(`pnpm --filter @monorepo/translations <script>`, or `cd` here):

```bash
pnpm docker:up      # build + start in the background
pnpm docker:logs    # tail
pnpm docker:down    # stop and remove
```

**Editing `projects/**/*.json` needs no restart and no rebuild.** That directory is
bind-mounted read-only and `readLocale()` re-reads from disk on every request, so a
saved edit is served by the very next request.

Editing anything under `server/` *does* need `pnpm docker:up` again, because the
image bakes the source — that script always rebuilds. If you're actively working on
the server, don't use Docker at all; run it directly instead.

## 💻 Run directly

What you want while working on the server, and what the tests use:

```bash
pnpm dev     # node --watch
pnpm serve   # no watch
# defaults to http://localhost:4000 — override with PORT
```

Note this collides with the container: if `pnpm docker:up` is running, port 4000 is
already taken and you'll get `EADDRINUSE`. Run one or the other, not both.

## ✅ Checks

`pnpm test`, `pnpm lint` and `pnpm typecheck`, same as everywhere else. The server
is Hono, so the tests call `app.request()` directly and never bind a port — they
run fine with the container up.

Tagged `type:infra`, so it may only depend on `@monorepo/configs`. Like `apps/*`, it
sits outside `packages/*` and therefore outside `nx release` — it is deployed, not
published, so it has no consumer that needs a version to resolve against.
