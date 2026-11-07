# 🔑 Provisioning the repo secrets

Four GitHub Actions secrets that nothing in the repo provisions. Each one is set once per repository,
and a repo without it fails in a way that doesn't name the missing secret, so the symptom column is
the part worth reading first.

## 🗂 The secrets

| Secret | Used by | Token | Symptom when missing |
| --- | --- | --- | --- |
| `PROJECTS_TOKEN` | [`pr-metadata.yml`](../../.github/workflows/pr-metadata.yml) | Classic PAT, `repo` + `project` | The workflow fails on the first PR with `gh`'s "set the GH_TOKEN environment variable" error |
| `NX_CLOUD_ACCESS_TOKEN` | [`ci.yml`](../../.github/workflows/ci.yml) `nx affected` step | Nx Cloud access token, **Read & Write** | Nothing fails: `nx affected` runs everything locally with no remote cache |
| `RELEASE_TOKEN` | [`release.yml`](../../.github/workflows/release.yml) push of the release commit and tags | Classic PAT, `repo`, on an account in the `master` ruleset's bypass list | The release commit and tags build, then `nx release`'s push is rejected with "Changes must be made through a pull request" and no GitHub Release is created |
| `NETLIFY_AUTH_TOKEN` | [`netlify-deployment.yml`](../../.github/workflows/netlify-deployment.yml) | Netlify personal access token, on an account with deploy rights on the Huella Legal project | A push to `master` fails at the Netlify CLI steps without deploying, and every PR passes with a "no Netlify token" notice instead of a preview |
| `COPILOT_GITHUB_TOKEN` | [`docs-review.yml`](../../.github/workflows/docs-review.yml) | Fine-grained PAT, account permission **Copilot Requests** | The advisory review is skipped; it is not a required check |

Every one is added the same way. The command reads the value from standard input, so it never
lands in shell history:

```sh
gh secret set <NAME> --repo <owner>/<repo>
```

Settings → Secrets and variables → Actions in the browser works too. After setting one, re-run the
failed workflow run; no new PR or release is needed.

## 🧾 Why each token is shaped that way

- **`PROJECTS_TOKEN`** — moving a PR onto a Projects (v2) board needs the `project` scope, which
  `GITHUB_TOKEN` never has. Generate it under [token settings](https://github.com/settings/tokens) →
  **Generate new token (classic)**. The same PAT also edits the title and assignees.
- **`NX_CLOUD_ACCESS_TOKEN`** — `nxCloudId` in [`nx.json`](../../nx.json) only identifies the
  workspace and isn't a credential. Generate the token from the workspace's page on Nx Cloud (the
  link `nx connect` printed). Read & Write because the same token authenticates both `master` pushes
  and PR runs; a read-only one would let CI pull from the cache but never populate it.
- **`RELEASE_TOKEN`** — the workflow's `GITHUB_TOKEN` pushes as `github-actions[bot]`, which the
  `master` ruleset's PR and required-check rules don't exempt. The PAT must belong to an account the
  bypass list covers (an admin, today).
- **`NETLIFY_AUTH_TOKEN`** — it deploys production, and Netlify scopes a personal access token to
  every team its account belongs to, not to one project. Generate it under **User settings →
  Applications → Personal access tokens** with an expiry, and rotate it before that date, since an
  expired one fails the next deploy. `NETLIFY_SITE_ID` beside it is a repo *variable*, not a secret.
- **`COPILOT_GITHUB_TOKEN`** — inference runs on the repository owner's Copilot allowance. Create a
  fine-grained token at [token settings](https://github.com/settings/personal-access-tokens/new)
  with the owner's personal account as **Resource owner** (not an organization) and access limited
  to this repository or public repositories, then add **Copilot Requests** under **Account
  permissions**. It is used only for Copilot CLI inference; `GITHUB_TOKEN` still posts the sticky PR
  comment. It spends the owner's Copilot AI credits and does not use GitHub Models,
  `models: read` or `copilot-requests: write`.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Secrets that fail loudly | A preflight step per workflow that exits with the secret's name when it is empty. Not done because each workflow already has a recognisable symptom above; `nx affected` without `NX_CLOUD_ACCESS_TOKEN` simply runs uncached |
| A GitHub App instead of PATs | Replaces `PROJECTS_TOKEN` and `RELEASE_TOKEN` with short-lived installation tokens. Worth it once a second maintainer means a personal PAT stops being a reasonable owner |
