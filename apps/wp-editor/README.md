# 🤖 @monorepo/wp-editor

A local review-and-apply tool for bulk edits to WordPress posts and pages. Claude proposes a copy of
each article through the `pnpm editor` CLI. The user reviews each one as a git-style diff in the
app, applies it, and can restore it later in changeset order. WordPress itself has no review step
and its REST API can't restore a revision, so this tool keeps its own backup of every article it
touches.

It runs on `127.0.0.1` only and **never deploys**. Nothing in it is specific to one blog except the
base URL in [`shared/site.ts`](./shared/site.ts), which points at huellalegal.com today and moves to
the WordPress subdomain at the cutover in
[ADR 0028](../../docs/decisions/0028-huella-legal-urls-and-cutover.md).

## 🗂 Structure

| Path | Holds |
| --- | --- |
| [`shared/`](./shared) | The pure rules, types and the HTML diff, imported by `app/`, `server/` and `tools/` alike |
| [`server/adapters/`](./server/adapters) | The fs store and the WordPress REST client, plain Node with no Nitro globals |
| [`server/services/operations.ts`](./server/services/operations.ts) | Open, apply, bulk apply, restore, restore all, re-pull: the rules run against both adapters |
| [`server/plugins/storeLock.ts`](./server/plugins/storeLock.ts) | Claims the store at server start, so only one server writes to it |
| [`server/api/`](./server/api) | Thin routes over the operations; a broken rule comes back as a 409 with its reason |
| [`tools/cli/`](./tools/cli) | `pnpm editor`, which imports the same adapters and operations |
| [`app/`](./app) | Registry, review screen and settings, on Nuxt UI |

The CLI reaches into `server/` and not the reverse, because the shared ESLint layer rule forbids
`app/` and `server/` from importing `tools/`.

## 🚀 Development

| Command | What it does |
| --- | --- |
| `pnpm dev` | The review app on `http://127.0.0.1:3100`, against the [fake WordPress and store](#-dev-mocks) |
| `pnpm dev:api` | The same against the real WordPress and `NUXT_EDITOR_STORE` from `.env` |
| `pnpm mocks:reset` | Drops the mock state, so the next start begins from the fixtures again; `pnpm dev` runs it first |
| `pnpm editor new "<title>" [--instructions=…] [--override] [--ids=posts-12,…]` | Opens a changeset and pulls `base` for every published post and page, or only `--ids` (drafts allowed) |
| `pnpm editor todo [--limit=15]` | The next unscanned base files of the open changeset |
| `pnpm editor scanned <keys…>` | Marks keys processed, with or without a proposal |
| `pnpm editor validate` | Deletes no-op proposals and warns where the `<!-- wp:… -->` marker sequence changed |
| `pnpm editor status` | Counts per state, per changeset |
| `pnpm editor probe` | Step 0 below; creates and force-deletes one draft |
| `pnpm editor:dev <command>` | Any of the above against the mocks, never the live site |
| `pnpm exec nx nuxt-prepare @monorepo/wp-editor` | Generates `.nuxt/`, which `tsconfig.json` points into; `lint`, `typecheck` and `test` depend on it |

### 🧪 Dev mocks

The `serve` target preloads [`mocks/server.ts`](./mocks/server.ts) into `nuxt dev`, and
`editor:dev` preloads it into the CLI. It overwrites the three env vars and the base URL, so a real
`.env` is never read in dev, and answers WordPress's REST routes with MSW. A request to
huellalegal.com or to an unmocked route fails in the dev log instead of reaching the network.

| Fixture | Holds |
| --- | --- |
| [`mocks/wordpress.json`](./mocks/wordpress.json) | Six posts and one page, in the state the two changesets left them |
| [`mocks/store/`](./mocks/store) | `0001-ortografia`, closed: two applied, one rejected. `0002-limpiar-encabezados`, open: a confirmed, a seen and two unreviewed proposals, one with a dropped block for `validate`, and `posts-105`, which drifts on apply because WordPress moved after the pull |

Both are copied to the gitignored `.data/mocks/` on the first start, and every write goes to that
copy, so state survives a server restart and the fixtures never change. The two must agree:
`base` in the open changeset and `wordpress.json` hold the same content and `modified_gmt` for
every article except the one meant to drift, so edit them together.

Claude's batch loop over these commands is in the
[`wp-bulk-edit` skill](../../.claude/skills/wp-bulk-edit/SKILL.md). Claude never drives the UI.

## 🔑 Environment

| Var | Why |
| --- | --- |
| `NUXT_WORDPRESS_USERNAME` | The account the Application Password belongs to |
| `NUXT_WORDPRESS_APPLICATION_PASSWORD` | A **new** one, never the comments password; the account needs `edit_others_posts`, `edit_published_posts`, `edit_pages` and `unfiltered_html` |
| `NUXT_EDITOR_STORE` | Absolute path to the store, outside the repo |

All three are checked when a command or route needs them, never at build time, because CI builds
the app with no env. The CLI loads `.env` itself through `--env-file-if-exists`. Claude needs
read/write access to the store, granted through `additionalDirectories` in the gitignored
`.claude/settings.local.json`, since the path differs per machine.

## 💾 The store

```
settings.json                   reviewGate, bulkApplyMinLevel, requireDryRun, dryRun, pauseMs
.server.lock                    pid and start time of the server using the store
changesets/0001-ortografia/
    changeset.json              id, title, instructions, createdAt, status, keys, scanned
    base/posts-123.html         content.raw at pull time
    base/posts-123.json         title, excerpt, modifiedGmt, date, author, image, link, status
    proposed/posts-123.html     absent means no change
    proposed/posts-123.json     optional { title?, excerpt?, reviewRequested? }
    state/posts-123.json        level, rejected, drift, applied { at, modifiedGmt }, restored
    runs/<at>-apply.json        one per bulk run: ok, refused, failed, warnings, stopped, incomplete
    runs/<at>-restore.json      the same, for Restore all
    runs/<at>-dry-run.json      the same, plus the fingerprint of every article it cleared
```

JSON is written with sorted keys, 2-space indent and a trailing newline, so the folder can be a
`git init`'d directory or a private submodule and diff cleanly. The tool never runs git.

Only `title.raw`, `excerpt.raw` and `content.raw` are edited, from `?context=edit`. Writing
`rendered` back would strip the block markers and break the posts in wp-admin.

## 📏 Rules

All of them live in [`shared/rules.ts`](./shared/rules.ts) and are pinned by its spec.

| Rule | Consequence |
| --- | --- |
| One open changeset | `new` is refused while one is open; `--override` marks it `abandoned`, keeping its applied items restorable |
| Open until done | A changeset closes once every key is scanned and every proposal is applied or rejected |
| Review levels | `unreviewed` → `seen` on open → `confirmed`; a hand edit or Unconfirm drops back to `seen`, and a reject can be undone unless it would leave two changesets open |
| Bulk apply gate | `reviewGate` picks who must reach `bulkApplyMinLevel` first: `all` pending articles, only the `requested` ones, or `none`. The screen says how many fall short |
| Review requested | The change-maker sets `reviewRequested` in `proposed/<key>.json` with the reason; the UI flags it and can't remove it |
| Dry-run mode | `dryRun` refuses every WordPress write; Apply checks drift and block markers instead, and Restore is disabled |
| Mandatory dry run | `requireDryRun` keeps bulk apply shut until the last dry run finished and cleared every pending article; an edit, re-pull or restore after it invalidates that article |
| Bulk reports | Every bulk run saves its report as it goes, shows its progress and opens the report at the end; a WordPress error marks that article `failed` and the run carries on, and a run that stops partway leaves its report marked `incomplete` |
| Repeated failures | Three WordPress failures in a row stop the run and say so in the report; the articles after them stay pending for the next run |
| Pause | `pauseMs`, 0–2000 and 500 by default, is the wait between articles in a bulk run; raise it if the host rate-limits us |
| Drift | Every write compares live `modified_gmt` with `base`; a mismatch refuses the item and flags it for re-pull |
| Restore | Writes N's `base` back; blocked while a later changeset still has the article applied, naming it. The article goes back to `seen`, so it can be edited, confirmed, rejected and applied again; a restore never reopens a closed changeset |
| Restore all | Restores every applied article of the changeset, one at a time with the same pause, failure stop and report as bulk apply. Articles never applied get no request, so a run stopped partway resumes with only the ones still applied |
| Lost response | When the host drops the connection after WordPress saved a write, the next apply or restore finds WordPress already holding that text and records it without writing again, instead of refusing it as drift. Otherwise the only way out would be a re-pull, which overwrites `base`, the backup restore needs |
| One server | The first server to start writes `.server.lock` into the store, and a second one on the same store, `dev:api` or a built `.output`, serves nothing but an error naming the first. A lock whose pid is dead is taken over, since Nuxt dev never releases it. The mocks use their own store, so `pnpm dev` never blocks the real one. The CLI takes no lock, so Claude can keep writing proposals while you review |

Restore also refuses when WordPress moved since the tool's last write to that article. That last
write is the apply in N **or a later changeset's restore**. Comparing only against N's own apply
would refuse restore in changeset 1 right after a restore in changeset 2.

## 🔬 Step 0

`pnpm editor probe` runs the checks the build depends on: whether `content.raw` is block markup or
classic, whether revisions are on, and whether a draft keeps a custom class and a `<style>` block
and moves `modified_gmt` on `PUT`.

**Not run yet.** It needs the credentials, which Claude has no access to. Record the output here.
A classic result without `<p>` means the preview needs `@wordpress/autop`.

## ⚠️ Known caveats

- **Custom CSS may not survive.** WordPress strips `<style>` unless the account has
  `unfiltered_html`. The Huella Legal site's sanitizer also strips `<style>` and every class
  outside its `CLASS_MAP`, so custom HTML added here disappears after the cutover.
- **LiteSpeed** is expected to purge its cache on save. Verify it once on the first real apply.

## 📐 Boundaries

Tagged `type:app` and `scope:internal`. It depends on `@monorepo/configs` only, and nothing may
depend on it. `@monorepo/content` stays read-only and anonymous; this app has its own client
because it is the only thing in the workspace that writes post content.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Preview through Huella Legal's sanitizer | Extract `articleBody.ts` into a package and run the proposed side through it |
| A styled preview | Inject the site's stylesheet into the preview `srcdoc`; today it is default browser styles plus the `ins`/`del` highlight |
| An MCP server instead of the CLI | Wrap the same operations as tools; the store layout stays |
| Other WordPress fields (slug, categories, meta) | Widen `Snapshot` and `Proposal`, and the block guard if the field holds markup |
| Another blog | Make `WORDPRESS_BASE_URL` a runtime value and namespace the store per site |
