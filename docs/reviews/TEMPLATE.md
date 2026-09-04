# 📊 Review — <YYYY-MM-DD>

Commit `<short sha>` on `<branch>` · Rubric v<n> · Previous: [<date>](./<file>.md)

<Two or three sentences. The headline number, the one card that carries the total, and the single
change that would move it most. Not a summary of the sections below.>

## 🧮 Scores

| Card | Score | Δ | Verdict |
| --- | --- | --- | --- |
| 🧱 Architecture | <n>/5 | <↑n / ↓n / => | <one line> |
| 🧩 Implementation | <n>/5 | <Δ> | <one line> |
| 🧪 Testing | <n>/5 | <Δ> | <one line> |
| ⚙️ Tooling & DX | <n>/5 | <Δ> | <one line> |
| 📚 Documentation | <n>/5 | <Δ> | <one line> |
| 🤖 Agent setup | <n>/5 | <Δ> | <one line> |
| 📋 Process & delivery | <n>/5 | <Δ> | <one line> |
| **Total** | **<n.n>/5** | <Δ> | |

Δ is against the previous review; `—` on the first one. Weights and the arithmetic live in
[`SCORECARDS.md`](./SCORECARDS.md).

## 🃏 Cards

### 🧱 Architecture — <n>/5

<One paragraph: what holds, and why the score isn't higher. Prose, not a list of every observation —
the findings table below carries the specifics.>

| Costs a point | Evidence |
| --- | --- |
| <finding, stated as the problem not the fix> | <`file.ts:12`, a command's output, or a count> |

<Repeat the same two blocks for each of the remaining six cards, in the order of the scores table.
A card that found nothing to deduct says so explicitly and names what was swept — an empty findings
table with no explanation reads as a card nobody looked at.>

## 🔍 Evidence

<The `collect-facts.sh` numbers the scores lean on: target results, the counts, the untested
surface, commits since the last review. Paste the figures, not the log.>

## 🎯 What would move the total

| Action | Card | Points | Filed |
| --- | --- | --- | --- |
| <the change, small enough to start> | <card> | <realistic gain, e.g. +1 on Testing → +0.15 total> | <#issue, a spike report, or `—`> |

Ordered by points per unit of work. This table is a finding, not a tracker: anything worth doing
gets filed (`pnpm issue:add`) or becomes a [spike report](../spikes/README.md), and the row
records which.
