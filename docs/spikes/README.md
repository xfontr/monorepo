# 🧭 Spikes

Where a spike's answer goes once it's answered. One file per spike, named `<NNNN>-<slug>.md` —
`0013-ui-headless.md` is the thirteenth decision recorded here.

A spike report is neither a design doc nor meeting minutes: it exists so the result of the
investigation survives after the issue closes and the thread that led to it is forgotten. Write one
when a spike (or any real architectural fork) gets resolved, not when the investigation starts —
the issue holds the question, the file holds the answer. An issue comment can't do this job: it's
unsearchable outside `gh`, unreviewed, and gone from context the moment the issue itself is closed
and forgotten.

## 🗂 Structure

Copy [`TEMPLATE.md`](./TEMPLATE.md). A frontmatter block, then five sections, all of them short:

| Section | Answers |
| --- | --- |
| Context | What was in tension — reuse the spike issue's own framing, don't re-derive it |
| Result | The outcome, stated as a fact that was found, not a recommendation |
| Options considered | Table: option, why it lost |
| Consequences | What this unlocks, what it forecloses, what would have to change to revisit it |
| Confirmation | How compliance with the decision is verified — a command, a check, a test that would fail if it stopped being true |

## 🔢 Numbering

**The number is consecutive, not the issue's.** The next report takes the next free `NNNN`,
zero-padded to four digits, and the issue that raised the question goes in the `issue:` frontmatter
field instead. That way the number is unique by construction, and a directory listing reads in the
order the decisions were actually made — which is what you want when one report builds on another.

Numbering by issue was the earlier convention and it failed twice over: two reports filed off one
issue collided on the same prefix, and the sequence sorted by when a GitHub issue happened to be
opened rather than by when anything was decided.

**The five sections are a record of what was found, not a living document** — with two narrow
exceptions, both about the container rather than the finding. A **labelled, whole-corpus template
migration** (every filed report moved to a new template shape in one dated change, this file's own
history is the example) may touch every section, because nothing about any individual finding
changes. A **citation repair** — a relative link gone stale because the file it pointed at moved or
was renamed elsewhere in the repo — may be fixed in place, the same way a dated review's broken
link gets fixed rather than left. Neither licenses rewriting one report's prose in isolation to say
something different than what was originally found; that stays what
[`0009-comment-discipline.md`](./0009-comment-discipline.md) got wrong.

## 🚦 Status and decision

Everything above the H1 is frontmatter, and it carries the one thing in the file expected to change
after the report is written — every section is a record of what was found, the frontmatter is what
happened since. It splits into **two axes on purpose**, because they answer different questions and
a single field can't hold both without one of them going unasked:

```
---
issue: 106
status: to-implement
decision: accepted
---
```

| Field | Axis | Values |
| --- | --- | --- |
| `status` | Has the work landed? | `to-implement` — the decision is made, the work isn't in the repo yet · `implemented` — it is · `wont-implement` — decided against, deliberately, not a report waiting on follow-up |
| `decision` | Does the decision still hold? | `accepted` — the default · `superseded` — a later report overturned it; see [🔁 Superseding a decision](#-superseding-a-decision) |

Whoever lands the follow-up work flips `status` in the same PR, the way `CHANGELOG.md` gets touched
by the change it describes rather than by a separate bookkeeping pass. A spike whose status never
moves off `to-implement` is either still waiting or forgotten, and there is no third option this
field can express — that ambiguity is deliberate, the same read a stale changelog gets.

[`apps/tech-docs`](../../apps/tech-docs/README.md) parses both fields the same way it already
parses `## 🧭 Deliberately deferred`. `status` shows next to every spike in the wiki nav and on the
report's own page; `decision` gets a pill on the report's own page alone, and only when it reads
`superseded` — so this is the one part of a spike report with a reader other than a human on
GitHub. `pnpm exec nx check-docs @monorepo/tech-docs` is what enforces that the values stay inside
the vocabulary above, and it runs in CI.

## 🔗 Linking back

The spike report is the artifact; the `issue:` field is the link. Nothing gets commented on the
issue — the PR that lands the report references it, and that trail is enough. A comment would be a
second copy of the answer, free to drift from the file and notifying watchers to say so.

Two reports may share an `issue:` — [`0011`](./0011-docs-system-enforcement.md) and
[`0012`](./0012-review-rubric-validity.md) both came off #106, which raised two questions. Their
filenames don't collide, because the filename number is theirs alone.

## 🔁 Superseding a decision

A report that reverses another gets a **new file** — never edit the old one's sections, which stays
a record of what was actually found at the time. Two frontmatter fields carry the reversal instead:

1. The new report is filed as usual, `decision: accepted`.
2. The old report's frontmatter — and only its frontmatter — changes: `decision: superseded` and
   `supersededBy: <new-file>.md`.

`check-docs` fails if `supersededBy` names a file that isn't a filed spike, or if it's set without
`decision: superseded`, so a reversed decision can't silently keep reading as current on its own
page.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Full MADR — `Decision Drivers`, `Considered Options`, `Pros and Cons of the Options` | This repo's four content sections plus `Confirmation` already carry what MADR's eight do; `Options considered` as a table of losers is the deliberate alternative to a pro/con essay per option, which is what a "Pros and Cons" section invites |
