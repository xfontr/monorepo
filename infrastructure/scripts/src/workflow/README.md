# 🧭 workflow

Snapshots the GitHub side of each project under
[`docs/workflows/projects/`](../../../../docs/workflows/README.md). Every issue in the project's
milestone, closed ones included, lands in `<project>.snapshot.json` beside the project file, with
its `cap:` labels read as the capabilities it belongs to. So do the open issues carrying the
project's `area` label and no milestone, because `pnpm issue:add` never sets one and a ticket filed
that way would otherwise never show up. Each issue also carries the author date of every commit
whose subject tags it as `[#N]`, read from the local `git log`. The developer portal's Workflows page
reads that file, so progress is only as fresh as the last sync.

```sh
pnpm workflow:sync                 # every project
pnpm workflow:sync marina-roustan  # one or more by id
```

It only reads, from GitHub and the local history, and only writes the snapshot. Labels, milestones and the project file are
changed by hand, by the `project-workflow` skill, or from the portal under `pnpm dev`. A sync that
finds the same issues and commits leaves the file alone, so running it costs no diff.

## 🗂 Structure

```
index.ts               hands main to run()
main.ts                the per-project loop: read the milestone and area, list their issues, write the snapshot
adapters/gh.ts         gh issue list for one milestone, and for an area label with no milestone
adapters/git.ts        every non-merge commit's author date and subject
adapters/files.ts      the project ids, the project file's YAML, the snapshot read and write
domain/snapshot.ts     gh's issue shape to the snapshot, commits to issues, the unchanged check and the summary line
```

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Board Status (Todo / In Progress) instead of open and closed | `projectItems` needs a token with the `project` scope; open and closed already say what the page shows |
| Running it on a schedule | A workflow that syncs and commits would need write access to `master`, which only moves through a PR |
| Creating the `cap:` labels | `gh label create cap:<id>` by hand or through the skill; the sync never writes to GitHub |
