# 📊 Review — <YYYY-MM-DD>

Commit `<short sha>` on `<branch>` · Method v<n> · Previous: [<date>](./<file>.md)

<Two or three sentences: the headline number, and the one judgement about the repo that explains it.
Say here if the tree was dirty or the method was run with a deviation.>

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

<The arithmetic, and whether Δ is like-for-like (same method version) or crosses a bump.>

## 🔭 The big picture

<The thesis, and the most important section. Several paragraphs, not a list. Cover what this repo
is and what it's for, what it's genuinely good at, and what's wrong with it as a whole. Say where
the effort has gone since the last review against where it should have gone, and which direction
it's heading. Take positions; this is the part a reader remembers.>

## 🃏 Cards

### 🧱 Architecture — <n>/5

<Two to four paragraphs answering the card's questions in SCORECARDS.md.>

| Strength | Evidence |
| --- | --- |
| <what holds, and why it matters> | <files, measurements, history> |

| Weakness | Evidence |
| --- | --- |
| <a pattern, not a single line> | <several places it shows, or why one instance is revealing> |

**Why not <n+1>:** <the best case for higher, and why it doesn't hold>. **Why not <n−1>:** <same,
downward>.

<Repeat for the remaining six cards, in the order of the scores table.>

## 🔥 What's really wrong

<Ranked, worst first. The problems that matter most to the repo's future, whichever card they sit
on: the ones a senior engineer joining would raise in their first week.>

| # | Problem | Why it matters | Evidence |
| --- | --- | --- | --- |
| 1 | <problem> | <consequence if left> | <evidence> |

## 🏗 Over- and under-engineering

| Where | Which | What it costs | Evidence |
| --- | --- | --- | --- |
| <area> | <over / under> | <the cost, in time, attention or risk> | <measurement or files> |

## 🍒 Low-hanging fruit

| Fix | Effort | What it buys | Where |
| --- | --- | --- | --- |
| <change> | <minutes / an hour / a day> | <outcome> | <file> |

## 🎯 Recommendations

<The strategic moves, ordered by value to the repo, not by points. Each one says what changes and
why now.>

| Recommendation | Cards it moves | Filed |
| --- | --- | --- |
| <move> | <cards> | <#issue, a decision report, an audit, or `—`> |

## 🔍 Evidence

<The `collect-facts.sh` figures the judgements lean on: target results, sizes, ratios, activity
since the last review, and the audits consulted. Paste the figures, not the log.>
