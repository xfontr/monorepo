# 🤖 @monorepo/translations

See [README.md](./README.md) for the endpoints, the Docker scripts and the two ways to run it.

- **This is a service, not a library.** Nothing in the workspace imports it — apps reach it over
  HTTP, which is what makes it `infrastructure/` rather than `packages/`. It backs the `internal`
  vendor in [`@monorepo/i18n`](../../packages/i18n); that package's provider is the only thing that
  knows this API's shape, and it should stay that way.
- `private: true` and outside `nx release`'s `packages/*`, so it has **no `CHANGELOG.md` and no
  version to bump**. It is deployed, not published.
- Adding a locale means adding a file under `projects/<project>/`. There is no registry, no index
  and nothing to import — the route resolves the path from `:project` and `:locale` directly, which
  is also why unsafe segments have to keep returning `400`.
- `projects/**/*.json` is bind-mounted read-only and re-read on every request, so an edit is live
  without a restart. Anything under `server/` is baked into the image and needs `pnpm docker:up`
  again — if you are working on the server, run it directly instead.
- Tests call `app.request()` on the Hono app and never bind a port, so they pass with the container
  running. Keep it that way; a test that listens on 4000 collides with `pnpm docker:up`.
- Tagged `type:infra`, so it may depend only on `@monorepo/configs`. `hono` and `@hono/node-server`
  come from the catalog.
