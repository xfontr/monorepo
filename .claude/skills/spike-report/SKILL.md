---
name: spike-report
description: Investigate an architectural question against this repo and write the answer up as a spike report under docs/spikes/. Use on "do a spike on this", "spike this", "write a spike" or "add a spike report" — and when a spike issue gets resolved and the outcome needs to survive after the issue closes. Filing a GitHub spike issue is the `github-issue` skill, not this one.
---

# Writing a spike report

A spike is a question that has to get answered before work can start. The question may live in a
GitHub issue or may have come straight out of a conversation; either way the answer belongs in
`docs/spikes/`, because an issue thread is unsearchable outside `gh` and gone from context the
moment it closes.

**"Do a spike" means research plus a file.** It does not mean filing an issue — that's the
`github-issue` skill, and the user will say so ("open a spike issue") when that's what they want.
It also doesn't mean answering in chat: the response is the file, and a summary in the terminal is
a courtesy on top of it, not a substitute.

## 1. Answer the question first

Usually nobody has done the investigation — do it now, against the actual repo, before writing a
line of the report. Two failure modes to avoid:

- **Don't argue from what a repo like this usually does.** Every claim in the report has to come
  from a file you read. `grep` for the thing you're about to assert is undocumented; check the
  boundary table before saying a new project fits somewhere; read the hook before describing what
  it enforces. A report full of plausible generalities is worse than no report, because the next
  person trusts it.
- **Don't stop at the framing you were handed.** The useful spike result is often that the question
  was the wrong shape — a content problem that's really a navigation problem, a build decision
  that's really a boundary decision. Say so, then answer the question that's actually load-bearing.

If a spike issue exists, read it for the framing rather than re-deriving it — its
`Decision needed` / `Question` fields (see the `github-issue` skill) become the report's Context:

```sh
gh issue view <n>
```

Ask the user only for what the repo can't tell you: a preference between two options that are
genuinely equivalent on the evidence, or a constraint that exists only in their head.

## 2. Write the file

Copy [`docs/spikes/TEMPLATE.md`](../../../docs/spikes/TEMPLATE.md) to
`docs/spikes/<issue-number, zero-padded to 4 digits>-<slug>.md` and fill in its four sections and
its `Status:` line — [`docs/spikes/README.md`](../../../docs/spikes/README.md) says what each is
for. Status is almost always `To implement` on the day the report is written: the report records
that a decision was made, not that the work is done. Set it to `Implemented` only if the change it
calls for is already in the same PR, and to `Won't implement` only when the finding itself is a
decision not to act.

The number is the issue that **raised the question**, which is not always labelled `spike` — an
enhancement issue whose thread turned out to hide a decision is the issue that raised it. If
nothing filed it at all, say so and ask whether to file one or hang the report off the closest
existing issue; don't invent a number.

Two things the template's shape enforces that are easy to lose:

- **Result states what was found, not what is recommended.** "Three layered checks are adopted" —
  not "we should consider adopting". If the finding is that the question needs splitting, that's
  the result.
- **Options considered is a table of losers.** One row per option that was really on the table,
  with the specific reason it lost. An option nobody would have picked is padding.

Keep it as tight as the shortest sections in the `ui`/`content` package READMEs: this is a record
of an outcome, not a design doc arguing for it. Follow `house-docs` like any other markdown here.

## 3. Close the loop

**When the follow-up work lands (or is dropped), flip the `Status:` line in the same PR.** That's
the one line in a spike report expected to change after the fact — it's how
[the dashboard](../../../apps/dashboard/README.md) shows, at a glance, which spikes are still owed
work.

**Never comment on the issue.** The report is reachable without one: its filename carries the issue
number, and the PR that lands it references the issue. An issue comment adds a notification and a
second copy of the answer that can drift from the file.

Closing is outward-facing, so show the user before running it, and only once they confirm the spike
is fully resolved — a spike report can exist for a spike whose issue stays open for follow-up work.
Usually the PR closes the issue anyway, which makes this unnecessary:

```sh
gh issue close <n>
```
