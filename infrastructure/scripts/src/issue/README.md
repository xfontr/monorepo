# 📝 issue

Two subcommands over `gh`, either side of the same tracker: `add` files an issue from the terminal,
`pick` takes one off a project board and puts you on a branch for it — and, once `add` succeeds from
`master`, calls `pick` directly instead of telling you to run it separately. They live in one folder
because they share the project prompt, the cancel handling, and now that direct call between them —
splitting them back apart means duplicating both. The `gh` wrapper, the file cache and the cancel
helper itself moved out to [`../shared/`](../shared/) once [`drift/`](../drift/README.md) needed
them too; `issue/gh.ts` still holds everything genuinely specific to filing and picking issues
(`listProjects`, `listLabels`, `listIssues`, `assignToMe`, `developBranch`).

```sh
pnpm issue:add     # node src/issue/index.ts add
pnpm issue:pick    # node src/issue/index.ts pick

pnpm issue:add --refresh   # skip the 24h project/label cache for this run
```

`index.ts` is a dispatcher and nothing else; an unknown or missing subcommand prints the usage and
exits `1`. Ctrl+C at any prompt exits without creating an issue or touching the branch.

## 🗂 Structure

```
index.ts     dispatch on argv[2] — add | pick
add.ts       the filing flow, offering a pick when it finishes on master
pick.ts      the pick-an-issue-and-branch flow, cache-backed when gh is unreachable
gh.ts        the issue-specific gh calls — repo owner, connectivity, projects, labels, open issues, assign, develop branch
git.ts       the git calls — current branch, find a branch for an issue, checkout
branch.ts    slug and branch-name building, the only real logic here
```

`gh.ts`'s own `gh()` wrapper and `createIssue`, the file cache, and `orExit` now live in
[`../shared/`](../shared/) — see that folder's note in the
[top-level README](../../README.md#-adding-a-script) for why.

## 🚀 `pnpm issue:add`

Four prompts and a confirmation between having a thought and having a tracked issue. It exists so
that filing a task never costs enough to be worth skipping; anything it can't express, you edit on
GitHub afterwards.

| Step | What it does |
| --- | --- |
| Project | `gh project list` for the repo's owner, open projects only, plus a *none* option |
| Label | `gh label list`, plus a *none* option |
| Title | Free text, required |
| Description | Free text, required — one line, becomes the whole issue body |
| Draft | Shows title, body, label and project |
| Confirm | *No* cancels and files nothing; *yes* runs `gh issue create` and prints the issue URL |
| Pick? | Only asked if you're now on `master` — *yes* runs `pick` in-process, same as `pnpm issue:pick` |

### 🪝 Filing from `master` offers a pick

The issue most worth filing from `master` is the one you're about to start — so once `gh issue
create` succeeds, `offerPick` in [`add.ts`](./add.ts) checks `currentBranch()` and, if it's
`master`, asks. *Yes* calls the same `pick` this package exports for `pnpm issue:pick` directly,
rather than telling you to run it yourself as a second command. The check runs after the issue is
already filed, so a `No` or a cancelled prompt here never costs you the issue — only the branch.

### 📐 No template

The body is whatever you typed, verbatim. There is no task/bug/spike shape, no acceptance criteria,
no repro steps — that structure is what made the previous version of this script something you
avoided using.

The [`github-issue`](../../../../.claude/skills/github-issue/SKILL.md) skill still has the three
templates, and Claude still fills them in when it files an issue. The two produce different-looking
issues on purpose: the skill is for issues worth the ceremony, this is for the ones that would
otherwise never get written down.

## 🌱 `pnpm issue:pick`

The other direction: you want to work, you don't want to open GitHub, find a ticket, copy its
number and hand-type a branch name.

| Step | What it does |
| --- | --- |
| Project | `gh project list`, open projects only — no *none* here, the board is what's being read |
| Issue | The project's **open** issues, `#number title` with the labels and the URL as a hint |
| Resume | Only if a branch for that issue already exists — *yes* checks it out and stops here |
| Branch type | `feature`, `fix`, `hotfix`, `release` |
| Branch title | Free text, pre-filled with the issue title; slugified, so edit it down to something short |
| — | `gh issue develop <number> --name <type>/<number>-<slug> --checkout`, then `gh issue edit --add-assignee @me` |

`gh issue develop` over `git checkout -b`: the branch it creates is linked on the issue's
Development panel, the same link the "Create a branch" button on the issue would give you, and a
branch name alone — however it's formatted — never gets you.

The issue URL sits in the select's hint so the terminal can turn it into a link — that's the "let me
read the ticket before I commit to it" escape hatch, and the reason the prompt shows nothing else
about the issue.

### 📴 Falling back to cache when `gh` is unreachable

`pick` opens with one `gh api rate_limit` round trip (`isOnline` in [`gh.ts`](./gh.ts)), not a read
of `listProjects`'s own failure — that one already swallows a missing `project` scope to mean
something unrelated, so offline needed a signal of its own. A failed round trip prints a warning and
switches `listProjects` and `listIssues` to reading the file cache directly, however old it is,
instead of paying for a `gh` call already known to fail. `developBranch` and the assignment still go
over the network same as ever, so an offline pick gets you as far as choosing a branch name and then
fails there if `gh` is still unreachable — the fallback is for browsing, not for filing offline.

### 🔢 Why the number comes first

`feature/28-set-up-main-layouts`. The prefix satisfies the `^(hotfix|fix|feature|release)/.+` gate
in [`.husky/pre-push`](../../../../.husky/pre-push), and the number immediately after the slash is
what `branchForIssue` in `git.ts` matches on. That lookup is why picking the same issue twice offers
the existing branch instead of dying on `gh issue develop`'s "branch already exists". Renaming a branch by hand to drop the
number costs you the resume, nothing else.

Answering *no* to the resume prompt still creates a new branch — a `fix/` on top of a `feature/` for
the same ticket is a real thing, just not the common one.

### 🙋 The assignment is last and can't fail the run

`gh issue edit <n> --add-assignee @me`, after the checkout, wrapped in a `try` that only warns.
Two things fall out of that ordering: a repo you can't write to costs you the assignment and not the
branch, and there's no "am I already assigned?" check anywhere — `@me` resolves server-side and
re-adding an existing assignee is a no-op, so both round trips the check would need are skipped.

It runs on the resume path too. Re-picking an issue you already own is the no-op case, which is
cheaper than reasoning about whether it is.

### 🔍 Why not `gh project item-list`

Reading the board directly is the obvious call and the wrong one: it hands back closed issues and
draft items with no number, so both need filtering out, and it needs the project's number and owner
on top of the `gh project list` call already made. `gh issue list --json projectItems` is one call,
open-only by definition, and the project filter is a `some()` on the result. It caps at 100 issues,
which is roughly 90 more than this board will ever hold.

## 🗄 Caching projects, labels and issues

Projects and labels change on the order of quarters, not per run. [`../shared/cache.ts`](../shared/cache.ts)
wraps `listProjects` and `listLabels` in a 24h file cache at `node_modules/.cache/@monorepo/scripts/`, so
most runs skip both `gh` round trips entirely. It sits under `node_modules` on purpose: already
gitignored, already per-clone, and a `pnpm install` clears it for free without another invalidation
path to maintain.

`listIssues` is a different shape of caching, not that TTL: a stale issue list is the one answer
this script exists to avoid, so online it fetches and overwrites the cache on *every* `pick`, no
24h gate at all. The cache exists purely for offline mode — the one case where there's no fresh
fetch to prefer over it, `cache.ts`'s `readCache`/`writeCache` (also what `drift/` uses for its own
dedup key) skip the TTL check entirely and hand back whatever's on disk, however old.

`--refresh` on either command bypasses the read and overwrites the file, for the one time a day the
24h window is wrong (a project just got created, a label just got renamed):

```sh
pnpm issue:pick --refresh
```

A cache write failing (read-only `node_modules`, no space) only costs you the cache, the same
fail-open stance the missing `project` scope already gets in `listProjects` — see
[`gh.ts`](./gh.ts).

## ✅ Tests

[`branch.spec.ts`](./branch.spec.ts) covers `slugify` and `branchName` — the only real logic left in
this folder, per [`writing-tests`](../../../../.claude/skills/writing-tests/SKILL.md).
[`../shared/cache.spec.ts`](../shared/cache.spec.ts) covers the TTL and `--refresh` bypass in
`cached`, plus the TTL-free reads and writes in `readCache`/`writeCache`. `isOnline` and the offline
branches of `listProjects`/`listIssues` are `gh` calls and cache reads respectively, both already
covered by the functions underneath them, so they get no spec of their own.

## 🔑 Requirements

`gh` authenticated. Both flows additionally need the `project` OAuth scope, which a plain
`gh auth login` doesn't grant:

```sh
gh auth refresh -s project
```

Without it `gh project list` fails and `listProjects` returns nothing. For `add` that costs you the
project prompt, not the issue; for `pick` there is nothing left to do, so it warns and exits.

`pick`'s assignment additionally needs write access to the repo — a plain `gh auth login` grants the
scope, but a read-only collaborator still can't self-assign. That path warns and keeps the branch.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A multi-line description | `@clack/prompts` `text` is single-line; this would need an `$EDITOR` handoff (`gh issue create --editor` already does exactly that, if you'd rather drop the prompt) |
| More than one label | `select` becomes `multiselect` and `gh.ts` maps over `--label` instead of taking one |
| Assignee, milestone, issue type | Each is another `gh issue create` flag and another prompt; add them only if you'd actually answer them every time |
| Filtering `pick` by board status or label | `listIssues` already has both in hand — it's a second `select`, or a `--status` argument threaded through `index.ts` |
| `pick` moving the issue to *In Progress* | `gh project item-edit`, which needs the item id and the field id — the two things `listIssues` deliberately doesn't fetch. It would belong next to the assignment, and fail the same way: warn, keep the branch |
| Assigning someone other than yourself | `--add-assignee` takes any login, but then it needs a prompt fed by `gh api repos/{owner}/{repo}/assignees`; `@me` exists so this doesn't |
| Hiding issues already assigned to someone else | `listIssues` would fetch `assignees` and filter — worth it on a shared board, pointless on a solo one |
| Branching from something other than the default branch | `developBranch` takes a `--base`, and `pick` prompts for it; today `gh issue develop` always bases off the repo's default branch. That's also the one thing lost versus plain `git checkout -b`: stacking a `fix/` branch on an unpushed `feature/` branch no longer works, because `--base` names a *remote* branch |
| A dirty working tree when `pick` runs | `git checkout -b` carries the changes over silently, which is usually what you want; a `git status --porcelain` guard would be the alternative |
| Choosing a repo other than the one you're in | `gh` infers it from the working directory today; every call would need `--repo` and a prompt to feed it |
| A default branch other than `master` | `offerPick` in `add.ts` checks `currentBranch() === "master"` literally, matching this repo; a `gh repo view --json defaultBranchRef` call would replace the literal if this ever runs somewhere else |
| Filing an issue while offline | `createIssue` still needs a live `gh`; the offline fallback only covers browsing cached projects and issues in `pick`, not `add` |
