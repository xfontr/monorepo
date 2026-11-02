# 🤖 @monorepo/wp-editor

See [README.md](./README.md) for the store layout, the rules and the CLI.

- **Never run `pnpm editor new` or `probe` unasked.** Both reach live WordPress; `new` pulls every
  published article and `probe` writes and deletes a draft.
- **Try changes with `pnpm dev` and `pnpm editor:dev`.** Both run on [`mocks/`](./mocks) and can't
  reach WordPress; `dev:api` and `editor` are the real thing.
- **`shared/` is pure and `server/adapters` + `server/services` are plain Node.** The CLI imports
  both, so neither may use a Nitro auto-import; those belong in `server/api` and `server/utils`.
- **Edit `raw`, never `rendered`.** Writing rendered HTML back strips the `<!-- wp:… -->` markers.
