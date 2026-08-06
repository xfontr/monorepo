# 🌐 @budget-forecast/translations

Translations **infrastructure** — a self-contained internal tooling app that
emulates a TMS (Translation Management System). It owns the source-of-truth
locale files and serves them over HTTP, so the product apps consume translations
from a network TMS from day one, while you still just hand-edit JSON locally.

When a real TMS is adopted (Phrase, Lokalise, Crowdin, …), keep these endpoints
and point the app's `TMS_BASE_URL` at the provider (via an adapter) — no consumer
changes.

```
infrastructure/translations/
  projects/<project>/<locale>.json   ← source of truth (hand-editable)
  server/                            ← the mock TMS HTTP API over that JSON
```

`infrastructure/` is the home for internal tooling apps; `translations/` is the
first. Other tooling apps sit alongside it.

## Endpoints

| Method | Path | Returns |
| ------ | ---- | ------- |
| `GET` | `/:locale/:project` | full message tree (all namespaces) |
| `GET` | `/:locale/:project?namespaces=shared,user` | only those namespaces |
| `GET` | `/health` | `{"status":"ok"}` — liveness probe for the container |

Responses are CORS-open (`Access-Control-Allow-Origin: *`). Unknown locales
return `404`; unsafe `:project`/`:locale` path segments return `400`.

## Run in Docker (recommended)

Start it once and forget it — it comes back after a crash or a reboot, so you
never need a second terminal for translations again.

```bash
pnpm tms:up        # build + start in the background
pnpm tms:logs      # tail
pnpm tms:down      # stop and remove
```

**Editing `projects/**/*.json` needs no restart and no rebuild.** That directory is
bind-mounted read-only and `readLocale()` re-reads from disk on every request, so a
saved edit is served by the very next request.

Editing anything under `server/` *does* need a rebuild (`pnpm tms:rebuild`), because
the image bakes the source. If you're actively working on the server, use the overlay
instead — it mounts `server/` and restarts on change:

```bash
pnpm tms:dev
docker compose -f compose.yaml -f compose.dev.yaml watch   # optional auto-restart
```

## Run directly

Still supported, and what the tests use:

```bash
pnpm --filter @budget-forecast/translations serve   # or: dev (watch)
# defaults to http://localhost:4000 — override with PORT
```

Note this collides with the container: if `pnpm tms:up` is running, port 4000 is
already taken and you'll get `EADDRINUSE`. Run one or the other, not both.
