# 🎯 Scorecards

The rubric a [review](./README.md) scores against. Seven cards, each an integer 1–5, weighted into
one total. This is the only copy of the rubric: the skill reads it, the template leaves room for it,
and nothing else restates it.

Rubric **version 1**. Bump it and say so in the history table when a card, an anchor or a weight
changes — scores from two versions aren't comparable, and quietly re-scoring history is worse than
a gap in it.

## 📊 The cards

| # | Card | Weight | What it asks |
| --- | --- | --- | --- |
| 1 | 🧱 Architecture | 20 | Is the layering real, or only drawn? |
| 2 | 🧩 Implementation | 20 | Does the code inside the boundaries hold up on its own? |
| 3 | 🧪 Testing | 15 | What does the suite actually pin? |
| 4 | ⚙️ Tooling & DX | 15 | What does the second hour of work here cost? |
| 5 | 📚 Documentation | 10 | Do the docs say why, and are they still true? |
| 6 | 🤖 Agent setup | 10 | Is an agent here constrained by tooling, or only by prose? |
| 7 | 📋 Process & delivery | 10 | Is the work traceable without asking the author? |

## 🔢 The scale

The same five anchors apply to every card. The right-hand column is the question that settles a
borderline score — pick the score whose test you can answer with a citation.

| Score | Means | The test |
| --- | --- | --- |
| 5 | Enforced, not merely intended | Breaking it fails a hook, a lint rule, a spec or CI — name which |
| 4 | Sound, with gaps that are named where someone will find them | The gap is deliberate and written down |
| 3 | Works today; nothing stops it going wrong | Nothing is broken and nothing is enforced |
| 2 | Being worked around | Someone has to know a workaround for this to go well |
| 1 | Costing time or correctness right now | Point at the failure it has already caused |

## ⚖️ Calibration

Score against what an unfamiliar senior engineer joining a **production** monorepo would need. Not
against the repo's own stated ambitions, not against "it's a personal project", and not against the
last review's numbers. A card that scores 5 everywhere has stopped measuring anything.

| Rule | Why it's here |
| --- | --- |
| Evidence or it didn't happen | Every score cites a `file.ts:12`, a command's output, or a count from `collect-facts.sh`. An uncited score gets deleted, not argued for |
| Assertion caps a card at 3 | A rule stated in a README with no enforcement path and no spec behind it is intent, not structure |
| A 5 needs an attempted breakage | Name the mistake and the tooling that catches it. If you can't, it's a 4 |
| Never score by feature count | Five skills aren't better than three; one enforcing hook beats four reminders. Score whether the thing does its job |
| Every card names its downgrade | At least one concrete thing costing it points — or an explicit line saying a sweep found none, and what was swept |
| The total is computed, never chosen | If the arithmetic disagrees with your gut, the cards are wrong. Fix a card, don't nudge the total |

## 🧮 The total

`total = Σ(score × weight) / 100`, to one decimal. Architecture and implementation carry 40 of the
100 points between them because everything else is recoverable and those two are what a rewrite
costs.

## 🃏 Card by card

Each card below says what it asks, where to look, and what caps it. A cap is a ceiling, not a
deduction: hit one and the card cannot score above it however good the rest looks.

### 🧱 1. Architecture — weight 20

Whether the layering is a property of the code or a picture in a README. DDD and hexagonal are the
vocabulary here, not the goal — score the property (a domain that doesn't know its transport, an
adapter that can be swapped without touching a caller), never the presence of a folder named after
a pattern.

Look at: the Nx tags in each `package.json` against
[`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts) and the
[root README's table](../../README.md#-architecture--boundaries); the vendor/port seams in
`content` and `i18n`; whether `apps/*` compose and everything else stays a leaf; whether a new
consumer would have an obvious place to go.

| Caps the card at | When |
| --- | --- |
| 3 | The enforced tag table and the readable one disagree |
| 3 | A package reaches a vendor SDK, an env var or a transport outside its adapter |
| 2 | Layering exists only as prose — no `@nx/enforce-module-boundaries`, or it's configured to warn |
| 2 | Two projects at the same layer solve the same problem two different ways |

Reserved tags for layers nothing uses yet (`type:feature`, `type:domain`) cost nothing on their
own. Deduct only when a project that should sit at that layer isn't there.

### 🧩 2. Implementation — weight 20

The code inside the boundaries, judged as code. Cohesion, earned abstractions, honest error paths,
type safety at the edges, duplication, dead code. This repo argues in its own READMEs that a
dependency or an abstraction has to earn its place — hold it to that in both directions: a
speculative wrapper with one caller costs as much as a missing one.

Look at: the largest files and longest functions from `collect-facts.sh`; the type and lint escapes
it counts; whether `content` and `i18n` — two packages doing structurally the same job — look
alike; what happens on a failed fetch, a missing env var, a malformed vendor payload.

| Caps the card at | When |
| --- | --- |
| 3 | `any`, `@ts-ignore` or `@ts-expect-error` in non-spec code without a comment saying why |
| 3 | The same logic exists twice, in a form where fixing one leaves the other wrong |
| 3 | An abstraction with a single caller and no named second one coming |
| 2 | An error path swallows a failure and returns something that looks like success |
| 2 | An `eslint-disable` covering a rule the repo claims to enforce |

### 🧪 3. Testing — weight 15

What the suite pins, not how much of it there is. The failure mode this repo already names in
[`@monorepo/scripts`](../../infrastructure/scripts/README.md) is a spec that asserts a mock against
itself; that counts as untested, not tested. Read specs against the
[`writing-tests`](../../.claude/skills/writing-tests/SKILL.md) conventions — a title should name the
failure it pins.

Look at: the spec-to-source counts and the untested-file list from `collect-facts.sh`; whether the
untested files hold logic or only types and barrels; what a deliberate one-character change to a
core function would break.

| Caps the card at | When |
| --- | --- |
| 3 | A skipped or focused spec is committed |
| 3 | A project with real logic has no specs at all |
| 3 | Specs assert against their own mocks, or only exercise the happy path |
| 2 | `--passWithNoTests` covers a project that has logic worth pinning |
| 2 | The suite is green but a known-broken behaviour isn't covered by any failing test |

### ⚙️ 4. Tooling & DX — weight 15

What the second hour here costs. Nx correctness first — a cache that lies is worse than no cache:
declared `outputs`, honest `inputs`, `sharedGlobals` that actually invalidate what they should. Then
the reach of lint and typecheck, the parity between what runs locally and what runs in CI, the
release path, and how many undocumented steps a fresh clone needs.

Look at: `nx.json` `targetDefaults` against each project's real outputs; `pnpm exec nx show project`
for a project that looks under-targeted; the [pre-push hook](../../.husky/pre-push) against
[`ci.yml`](../../.github/workflows/ci.yml); whether the gaps between them are written down.

| Caps the card at | When |
| --- | --- |
| 3 | A cached target doesn't declare the outputs it writes |
| 3 | A check runs in CI with no local equivalent, and that gap isn't documented |
| 3 | A fresh clone needs a step no README mentions |
| 2 | A target fails on a clean tree |
| 2 | Formatting or style is argued in review rather than settled by `eslint --fix` |

### 📚 5. Documentation — weight 10

Whether the docs say *why* and are still true. Drift is the whole card: a claim that no longer
matches the code is worth less than no claim. Volume is not a signal — a short accurate README
beats a thorough stale one, and this repo's own
[`house-docs`](../../.claude/skills/house-docs/SKILL.md) rules are the bar.

Look at: every project README's claims against its code; whether loose ends and stubs are named or
smoothed over; whether `🧭 Deliberately deferred` sections exist and are specific enough to act on;
whether `CLAUDE.md` files duplicate their README instead of pointing at it.

| Caps the card at | When |
| --- | --- |
| 2 | A README contradicts the code — a renamed env var, a dropped command, a moved file |
| 3 | A project has no README, or one that lists its files instead of saying what it's for |
| 4 | Docs describe what the code does rather than why it's shaped that way |

### 🤖 6. Agent setup — weight 10

Whether an agent working here is constrained by tooling or only by prose. The question for every
skill is whether it exists because the task gets got wrong without it; the question for every ban in
`CLAUDE.md` is whether anything catches it.

Look at: each skill's `description` against the prompt that should trigger it; whether a skill
encodes what a README already says (it should link, not restate); the `deny` list in
[`settings.json`](../../.claude/settings.json) against the prose bans in
[`CLAUDE.md`](../../CLAUDE.md); whether each `PostToolUse` hook maps to a rule already written down.

| Caps the card at | When |
| --- | --- |
| 3 | A `CLAUDE.md` ban has no deny entry and no hook, where one is possible |
| 3 | A skill's description wouldn't trigger on the prompt it's for |
| 4 | A skill restates a README instead of linking it — two copies, one drifts |
| 2 | A hook blocks edits it has no business blocking; a reminder that cries wolf gets turned off |

### 📋 7. Process & delivery — weight 10

Whether the work is traceable without asking the author. Issues for what's known, spike reports
for the forks that got resolved, commit messages whose type matches what the commit did, and a
release trail that was derived rather than typed.

Look at: `gh issue list` and `gh issue list --state closed --label spike` against
[`docs/spikes/`](../spikes/README.md); `git log --oneline -40` for types that don't match their
diffs; whether the markers the [push gate](../../.husky/pre-push) rejects were filed as issues or
just deleted; branches and versions against the [release rules](../../README.md#-versioning).

| Caps the card at | When |
| --- | --- |
| 1 | A version or a `CHANGELOG.md` was edited by hand |
| 3 | A resolved architectural fork has no spike report |
| 3 | Commit types don't match their diffs, so the derived version is wrong |
| 4 | Known work exists only in a branch name or in the author's head |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A card that stops discriminating (everything scores 5 twice running) | Rewrite that card's caps to a harder bar and bump the rubric version — don't re-score old reviews |
| Coverage as evidence on the testing card | `collect-facts.sh` would need a `test:coverage` target on every project (only `scripts` has one today) and a threshold worth defending; a percentage with no threshold is not evidence |
| Weights that reflect a different stage | Weights are the one part meant to be argued with. Change them in the table above, bump the version, and say what stage the new split is for |
| More than a handful of reviews | The history table in [`README.md`](./README.md) grows a fold — keep the last six rows and move the rest to a collapsed section |
