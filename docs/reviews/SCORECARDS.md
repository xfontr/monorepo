# 🎯 Scorecards

The rubric a [review](./README.md) scores against: seven cards, each an integer 1–5, weighted into
one total. A review is a **macro judgement of the repository as a system**: whether it is shaped
right for what it does, whether its effort goes where the risk is, and where it is heading. It is
not a bug hunt. Individual defects belong to an [audit](../audits/README.md); a review may cite one
as evidence of a pattern, never as a reason on its own.

The method version lives in [`METHOD.md`](./METHOD.md) and never in this file, because this is one
of the artifacts the version digests.

## 📊 The cards

| # | Card | Weight | The question |
| --- | --- | --- | --- |
| 1 | 🧱 Architecture | 20 | Is the system shaped right for what it has to do, and for what it will have to do next? |
| 2 | 🧩 Implementation | 20 | Is the code inside the boundaries something a senior engineer would want to own? |
| 3 | 🧪 Testing | 15 | Would the suite catch the mistakes this repo is actually likely to make? |
| 4 | ⚙️ Tooling & DX | 15 | What does working here cost after the first hour, and what does the tooling cost to keep alive? |
| 5 | 📚 Documentation | 10 | Do the docs help the next person make the right decision, at a reading cost they'll pay? |
| 6 | 🤖 Agent setup | 10 | Does the agent setup make an agent here better, or only busier? |
| 7 | 📋 Process & delivery | 10 | Can someone reconstruct what happened and why, and does the process move work forward? |

Architecture and implementation carry 40 of the 100 points because they are what a rewrite costs;
everything else is recoverable.

## 🔢 The scale

The same five anchors apply to every card. Each card below adds what a 5, a 3 and a 1 look like on
its own dimension.

| Score | Means |
| --- | --- |
| 5 | A strength that compounds. You would point a new team at it as the model to copy |
| 4 | Sound. Weaknesses are real but local, and fixing them doesn't mean rethinking anything |
| 3 | Mixed. It works today, but the shape has problems that grow with the repo |
| 2 | Weak. The dimension is costing time or correctness now, and the fix is structural |
| 1 | Failing. It actively works against the repo |

## ⚖️ How to judge

- **Judge the whole, not the worst line.** A single defect moves a score only as evidence of a
  pattern. Name the pattern and show where else it holds, or explain why this one instance is
  revealing (a design choice, not a slip). A bug that is just a bug goes to an audit.
- **Proportionality is quality.** Machinery that costs more than the risk it covers is a weakness,
  exactly like a missing safeguard. That goes for abstractions, gates, docs, rules and process alike.
  Ask what each one protects, and what it costs to keep.
- **Enforcement is evidence, not the definition of good.** A check that enforces the wrong thing, or
  one heavier than what it protects, counts against the card. Good judgement with no gate can be a 4.
- **Unevenness is a finding.** Say where the repo is markedly better or worse than its own average,
  and what that suggests: who wrote it, how, and with how much care.
- **Trajectory counts.** Say where effort went since the last review and whether that was the right
  place. A card can hold its score while heading the wrong way, and the prose must say so.
- **Support every judgement.** Cite representative evidence: files, measurements from
  `collect-facts.sh`, history, audits. A synthesis ("this project reads unsupervised") is expected
  when it's backed by what was read; an impression with nothing behind it gets dropped.
- **Steelman both directions.** Every score states the best case for one point higher and one lower,
  and why neither holds. That is the guard against inflation, and it replaces arithmetic rules.
- **Calibrate against a production monorepo of this size and purpose.** Not the repo's own
  ambitions, not "it's a side project", and not the last review's numbers.
- **The total is computed, never chosen.** `Σ(score × weight) / 100`, one decimal. If it disagrees
  with the thesis, one of the cards is wrong: fix the card.

## 🃏 Card by card

Each card lists the questions its assessment must answer and where to start looking. The questions
are the card; answer them in prose, not as a checklist.

### 🧱 1. Architecture — weight 20

- Do the boundaries sit on the real seams: the places where things vary, or where teams, vendors or
  deploy targets differ? Would the next vendor, app or consumer fit without bending anything?
- Does each layer earn its cost at this size, with ports where there's real variation and none
  where there isn't?
- Where does the complexity live, and is that where the problem is?
- What does duplication across projects say about a missing home or a wrong boundary?
- What breaks first if the repo doubles?

Start at the Nx tags against [`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts),
the vendor seams in `content` and `i18n`, and how the apps compose the packages.

| 5 | 3 | 1 |
| --- | --- | --- |
| Boundaries match the problem; a new consumer has one obvious place to go; abstraction exactly where variation is | Layering is real but uneven: some seams are ceremonial, some real ones are missing | The drawn architecture and the running one are different systems |

### 🧩 2. Implementation — weight 20

- Is the code clear, cohesive and consistent across projects doing similar jobs?
- Do abstractions earn their place, in both directions: no speculative wrapper, no missing one?
- What is the error-handling philosophy, and is it the same everywhere? What happens at the edges
  (a failed fetch, a missing env var, a malformed payload)?
- Where was the code written with markedly less care, and how much of the repo is that?
- Is the amount of code proportionate to what it does?

Start at the largest files from `collect-facts.sh`, the two vendor packages side by side, and
whatever [audits](../audits/README.md) exist.

| 5 | 3 | 1 |
| --- | --- | --- |
| Reads like one careful author at every size; failure paths are designed, not patched | Solid core, with areas nobody would sign; inconsistency you have to learn | You'd rewrite before you'd extend |

### 🧪 3. Testing — weight 15

- Where does the risk actually live, and is that where the tests are?
- Do the specs pin behaviour, or restate implementation? Would a plausible one-character mistake in
  a core function fail something?
- What does the suite cost: brittleness, slowness, mocks that need rewriting on every change?
- What is untested on purpose, and is that written down?

Start at the per-project spec counts and the untested-file list, then read specs in the riskiest
projects, not the tidiest.

| 5 | 3 | 1 |
| --- | --- | --- |
| The suite is a specification: risky code is pinned, tests are cheap to keep | Good coverage where testing is easy, thin where the risk is | Green means nothing |

### ⚙️ 4. Tooling & DX — weight 15

- Is the feedback loop fast and truthful: caching correct, local and CI in agreement?
- How often does tooling break for reasons unrelated to the change?
- Is the number of gates, hooks and scripts proportionate to what they protect?
- What does a fresh clone need, and is it written down?

Start at [`nx.json`](../../nx.json), the hooks in [`.husky/`](../../.husky/) against
[`ci.yml`](../../.github/workflows/ci.yml), and the four target results.

| 5 | 3 | 1 |
| --- | --- | --- |
| Invisible when it works, loud and precise when it doesn't, cheap to maintain | Works, with rough edges and machinery nobody would miss | People route around it |

### 📚 5. Documentation — weight 10

- Do the docs explain why things are shaped this way, and what breaks if that's undone?
- Are they true, and is drift trending up or down?
- Is the volume proportionate? What does it cost to read, and does anyone read it?
- Is each fact written once, or copied into places that will drift?

Start at every project README against its code, then the ratio of markdown to code.

| 5 | 3 | 1 |
| --- | --- | --- |
| Short, true, and the first place you'd look | Useful but sprawling or partly stale; you check the code anyway | Wrong often enough that it misleads |

### 🤖 6. Agent setup — weight 10

- Does each skill, rule and hook target a failure agents actually make here?
- What context does an agent pay for on every turn, and is it worth it?
- Is enforcement placed where a mistake is expensive, and left out where prose is enough?
- Does the setup help agents do good work, or only stop them doing bad work?
- What does it cost to maintain, relative to the product code it serves?

Start at [`AGENTS.md`](../../AGENTS.md), [`.claude/settings.json`](../../.claude/settings.json),
`.claude/hooks/` and `.agents/skills/`.

| 5 | 3 | 1 |
| --- | --- | --- |
| Small, targeted, and agents here visibly do better work for it | Useful core under a layer of rules nobody could keep in their head | Agents spend more effort on the setup than on the task |

### 📋 7. Process & delivery — weight 10

- Can a newcomer reconstruct why things are the way they are: issues, decisions, commit history?
- Do findings, reviews and decisions turn into work, or accumulate?
- Do decisions stay true, and get superseded when the code moves on?
- Is the release trail derived rather than typed, and do commit types match what changed?
- Is the process overhead proportionate to the team that runs it?

Start at `git log` since the last review, [`docs/decisions/`](../decisions/README.md) against the
code, and the last review's recommendations against what happened to them.

| 5 | 3 | 1 |
| --- | --- | --- |
| Everything traceable, nothing ceremonial, findings close | Traceable, but records pile up faster than they're acted on | History has to be asked for |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Weights that fit a different stage | Weights are the part meant to be argued with. Change them above, run `review:version`, and say what stage the new split is for |
| A dimension none of the seven covers | Add a card only if its question can't live inside an existing one. The Scores table shape is parsed by `apps/developer-portal/tools/lib/scorecards.ts`, so a new card is a code change there too |
| Reviews of one area rather than the whole tree | That's an [audit](../audits/README.md). A review stays whole-repo, so its total stays comparable |
