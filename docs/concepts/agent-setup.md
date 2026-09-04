# 🤖 The agent setup as one inspectable system

An agent working in this repo reads a `CLAUDE.md` per project, twelve `.claude/skills/`, two
`PostToolUse` hooks and a permissions `deny` list in `.claude/settings.json`. All four are indexed
from the root [`CLAUDE.md`](../../CLAUDE.md) — but that file is written *for* an agent, in its
voice, and a human trying to understand what governs an agent's behavior here has to piece the four
together from scratch. This is that piecing-together, done once.

## 📄 Why `CLAUDE.md` reads the way it does

The root file says outright what it's for: "what \[the READMEs\] don't say, or what gets got wrong
anyway." It is not project documentation restated for a machine — the actual documentation is the
READMEs, which a human and an agent both read the same way. `CLAUDE.md` exists only where a plain
reading of the code has produced a wrong edit before: the style rules, the "looks reasonable and is
wrong here" list, the two places that must agree. Every project's `CLAUDE.md` follows the same
shape — a short pointer to its README, then the invariants worth losing a build over. That's why
these files read as terse rule lists rather than prose: they're a correction log, not an
introduction.

## 🪝 What the two hooks actually enforce

Both are `PostToolUse`, firing after every `Edit`/`Write`:

| Hook | Enforces |
| --- | --- |
| [`eslint-fix.sh`](../../.claude/hooks/eslint-fix.sh) | Runs `eslint --fix` on the touched file — style is corrected mechanically, never left as a review comment |
| [`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) | Catches the specific mistakes `CLAUDE.md`'s prose alone hasn't prevented: `boundaries.ts` edited without the README table, a hand-edited `version`, a `build`/lifecycle script added to a package, an endpoint hardcoded outside `.env.example`, a new project missing its tag wiring, a review file with no row in its history table |

The comment at the top of `check-invariants.sh` states its own reason for existing: "the root
CLAUDE.md states these rules in prose, which works right up until an agent edits one file and not
its pair." Every check in it maps to a rule already written down that had already been broken once
— it's a list of prose failures, not a design.

## 🚫 What the deny list forecloses, and why those specifically

[`.claude/settings.json`](../../.claude/settings.json) denies editing any `CHANGELOG.md` or
[`docs/FEATURES.md`](../FEATURES.md), running any form of `nx release`, and reading any `.env` file.
These aren't a generic security posture — each maps to a rule from `CLAUDE.md` that a prose reminder
alone wouldn't reliably stop an agent from doing anyway. Three of the four are the same rule: a
changelog, a version and the feature map are all *derived*, so editing one produces a change that
survives only until the next render (see [`versioning.md`](./versioning.md)). The fourth is
different in kind — `.env` files hold the real values `.env.example` only names.

Where `check-invariants.sh` catches a mistake after the fact and asks for a fix,
`.claude/settings.json`'s `deny` list stops the tool call before it runs — reserved for the
handful of actions where "after the fact" is already too late.

## 🛠 What the skills are, collectively

Twelve `SKILL.md` files today: nine live at the repo root, invoked for a task that spans or doesn't
belong to one project (`new-package`, `spike-report`, `repo-review`, …); three are package-scoped,
living inside `packages/content/`, `packages/i18n/` and `packages/ui/` for a vendor- or
component-adding task specific to that package alone. A skill is loaded on request or on a matching
trigger phrase, not on every turn — unlike `CLAUDE.md`, which an agent reads unconditionally. That
split is deliberate: the invariants that must never be missed are prose an agent can't opt out of
reading, and the procedures that only apply to a specific, recognizable task are opt-in so they
don't compete for attention on unrelated work. [`docs/FEATURES.md`](../FEATURES.md) lists every one
of them with the source that declares it, generated rather than hand-maintained so a new skill
can't go unlisted.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A skill or hook that doesn't map to a prose rule already broken once | Question it before adding it — every hook and deny entry here exists because a specific mistake already happened, not as precaution |
| An agent-facing doc genuinely worth a human reading in its own voice | Still doesn't belong here — this file explains the system, `CLAUDE.md` itself stays written for the agent that reads it every turn |
