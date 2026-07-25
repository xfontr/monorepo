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

Responses are CORS-open (`Access-Control-Allow-Origin: *`). Unknown locales
return `404`; unsafe `:project`/`:locale` path segments return `400`.

## Run

```bash
pnpm --filter @budget-forecast/translations serve   # or: dev (watch)
# defaults to http://localhost:4000 — override with PORT
```
