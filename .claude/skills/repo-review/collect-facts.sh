#!/bin/sh
# Everything a repo review should not be trusting a model to remember: what the targets do on this
# tree right now, the counts a card would otherwise get eyeballed, and whether the last review is
# recent enough that this one is probably a mistake.
#
# Output is markdown on stdout, meant to be read and quoted into the review's Evidence section.
# Exits 0 even when a target fails — a red suite is the most useful finding a review can have, not
# a reason to stop collecting.
#
#   collect-facts.sh            everything, including the four nx targets across every project
#   collect-facts.sh --quick    skips the targets (the slow half) — for a re-run, not a first pass

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 1

quick=0
[ "$1" = "--quick" ] && quick=1

has_jq=0
command -v jq >/dev/null 2>&1 && has_jq=1

# Sources are ts/vue minus specs; every count below means the same thing by "source file"
sources() { git ls-files '*.ts' '*.mts' '*.vue' | grep -v '\.spec\.ts$'; }

# git grep over source only, counted in lines. `grep -c` prints 0 on no matches and exits 1, so no
# `|| echo 0` anywhere below: that would print a second zero and break the numeric tests further down
count() { git grep -nI -E "$1" -- '*.ts' '*.mts' '*.vue' 2>/dev/null | grep -vc '\.spec\.ts:'; }
lines() { grep -c .; }

epoch_of() { date -j -f "%Y-%m-%d" "$1" +%s 2>/dev/null || date -d "$1" +%s 2>/dev/null; }

echo "# Review facts"
echo

# ------------------------------------------------------------------ review history
# The guard the skill acts on. Two things make a new review a waste: no commits since the last one
# (it would score the same tree) and a last one from days ago (the numbers can't have moved).
echo "## Review history"
echo
last=$(ls docs/reviews/[0-9]*.md 2>/dev/null | sort | tail -1)

if [ -z "$last" ]; then
    echo "No previous review — this is the first. No Δ column to fill, no recency guard."
    echo
else
    base=$(basename "$last" .md)
    last_date=$(echo "$base" | cut -d- -f1-3)
    last_sha=$(echo "$base" | cut -d- -f4-)
    echo "Last review: \`$last\` — $last_date, against commit \`$last_sha\`."
    echo

    if git cat-file -e "$last_sha" 2>/dev/null; then
        commits=$(git rev-list --count "$last_sha"..HEAD 2>/dev/null || echo "?")
        echo "Commits since: $commits"
        echo "Diff since: $(git diff --shortstat "$last_sha"..HEAD 2>/dev/null || echo "n/a")"
        echo
        if [ "$commits" = "0" ]; then
            echo "> **STOP AND ASK.** Nothing has been committed since the last review, so a new one"
            echo "> scores the same tree and can only differ by judgement. Ask the user whether they"
            echo "> meant to re-score, or to read the existing review instead."
            echo
        fi
    else
        echo "Commit \`$last_sha\` isn't in this repo's history — can't diff against it."
        echo
    fi

    then_ts=$(epoch_of "$last_date")
    if [ -n "$then_ts" ]; then
        days=$(( ( $(date +%s) - then_ts ) / 86400 ))
        echo "Age of last review: $days day(s)"
        echo
        if [ "$days" -lt 7 ]; then
            echo "> **ASK FIRST.** The last review is $days day(s) old. Unless something large landed"
            echo "> in between, confirm with the user before writing another one."
            echo
        fi
    fi
fi

# ------------------------------------------------------------------ tree
echo "## Tree"
echo
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
head_sha=$(git rev-parse --short HEAD 2>/dev/null)
dirty=$(git status --porcelain 2>/dev/null | lines)
untracked=$(git ls-files --others --exclude-standard -- '*.ts' '*.mts' '*.vue' | lines)
echo "| Fact | Value |"
echo "| --- | --- |"
echo "| Branch | \`$branch\` |"
echo "| HEAD | \`$head_sha\` |"
echo "| Uncommitted files | $dirty |"
echo "| Untracked source files | $untracked |"
echo "| Source files (ts/vue, excl. specs) | $(sources | lines) |"
echo "| Spec files | $(git ls-files '*.spec.ts' | lines) |"
echo "| Test cases | $(git grep -nI -E '(^|[[:space:]])(it|test)\(' -- '*.spec.ts' 2>/dev/null | lines) |"
echo
[ "$branch" != "master" ] && echo "Not on \`master\`: this scores work in progress — say so in the review's opening line."
[ "$dirty" -gt 0 ] && echo "Tree is dirty, so \`$head_sha\` doesn't fully describe what was scored. Note it or stash first."
if [ "$untracked" -gt 0 ]; then
    echo
    echo "> Every count and list below comes from \`git ls-files\` and \`git grep\`, so those"
    echo "> $untracked untracked file(s) are invisible to all of them. Commit them or score them by"
    echo "> hand — an untracked project reads as a project that doesn't exist:"
    git ls-files --others --exclude-standard -- '*.ts' '*.mts' '*.vue' | head -20 | sed 's/^/> - `/;s/$/`/'
fi
echo

# ------------------------------------------------------------------ projects
echo "## Projects"
echo
echo "| Project | Root | Nx tags | Private | Specs | README |"
echo "| --- | --- | --- | --- | --- | --- |"
for manifest in packages/*/package.json apps/*/package.json infrastructure/*/package.json; do
    [ -f "$manifest" ] || continue
    dir=$(dirname "$manifest")
    if [ "$has_jq" -eq 1 ]; then
        name=$(jq -r '.name // "?"' "$manifest")
        tags=$(jq -r '(.nx.tags // []) | join(", ")' "$manifest")
        priv=$(jq -r 'if .private then "yes" else "no" end' "$manifest")
    else
        name="$dir"; tags="(jq missing)"; priv="?"
    fi
    specs=$(git ls-files "$dir" | grep -c '\.spec\.ts$')
    readme="no"; [ -f "$dir/README.md" ] && readme="yes"
    echo "| $name | \`$dir\` | $tags | $priv | $specs | $readme |"
done
echo

# ------------------------------------------------------------------ signals
# Counts, not verdicts. Each one caps a card in SCORECARDS.md, so the review has to look at the
# hits rather than quote the number.
echo "## Signals"
echo
# The pre-push gate rejects added lines containing the two flagged-comment markers, which would
# block this very file — hence the bracket in each pattern. It matches the same strings.
flagged="T[O]DO|F[I]XME|H[A]CK|X[X]X"
echo "| Signal | Count | Card it caps |"
echo "| --- | --- | --- |"
echo "| Flagged comments in source | $(count "$flagged") | Process |"
echo "| \`any\` in non-spec source | $(count '(\bas any\b|:\s*any\b|<any>)') | Implementation |"
echo "| ts escapes (\`@ts-ignore\`/\`@ts-expect-error\`) | $(count '@ts-(ignore|expect-error)') | Implementation |"
echo "| \`eslint-disable\` | $(count 'eslint-disable') | Implementation |"
echo "| \`console.*\` outside specs | $(count 'console\.(log|warn|error|debug)') | Implementation |"
echo "| \`process.env\` reads | $(count 'process\.env') | Architecture |"
echo "| Skipped or focused specs | $(git grep -nI -E '(it|test|describe)\.(skip|only)\(' -- '*.spec.ts' 2>/dev/null | lines) | Testing |"
echo "| \`--passWithNoTests\` in a package script | $(git grep -nI -e '--passWithNoTests' -- '*/package.json' 2>/dev/null | lines) | Testing |"
echo

echo "### Source files over 200 lines"
echo
over=""
for f in $(sources); do
    [ -f "$f" ] || continue
    n=$(wc -l < "$f" | tr -d ' ')
    [ "$n" -gt 200 ] && over="$over$n $f\n"
done
if [ -z "$over" ]; then
    echo "None."
else
    printf '%b' "$over" | sort -rn | head -15 | while read -r n f; do echo "- \`$f\` — $n lines"; done
fi
echo

echo "### Source files with no sibling spec"
echo
echo "Wrapper configs, barrels and \`.d.ts\` are filtered out — they need no spec and the list is"
echo "useless once they're in it. Type-only modules survive the filter, so read the list rather"
echo "than quoting the count."
echo
# No `case` in here: bash 3.2, which is still /bin/sh on macOS, mis-parses a pattern's `)` inside a
# command substitution. `${f%.ts}` is unchanged when the name doesn't end in .ts, which is the test
noise='(^|/)(index|eslint\.config|vitest\.config|vite\.config|nuxt\.config)\.ts$|\.d\.ts$|\.stories\.ts$|/\.storybook/'
missing=$(for f in $(sources | grep -v -E "$noise"); do
    [ "${f%.ts}" = "$f" ] && continue
    [ -f "${f%.ts}.spec.ts" ] || echo "$f"
done)
n_missing=$(echo "$missing" | lines)
echo "$n_missing file(s):"
echo
[ "$n_missing" -gt 0 ] && echo "$missing" | head -30 | sed 's/^/- `/;s/$/`/'
echo

# ------------------------------------------------------------------ targets
echo "## Targets"
echo
if [ "$quick" -eq 1 ]; then
    echo "Skipped (\`--quick\`). A review that scores Tooling & DX without running them is guessing."
else
    echo "Whole workspace, not affected — a review scores the tree, not the diff."
    echo
    echo "| Target | Result |"
    echo "| --- | --- |"
    fails=""
    for target in lint typecheck test build; do
        out=$(pnpm exec nx run-many -t "$target" --output-style=static 2>&1)
        if [ $? -eq 0 ]; then
            echo "| \`$target\` | pass |"
        else
            echo "| \`$target\` | **FAIL** |"
            fails="$fails\n### \`$target\` output (tail)\n\n\`\`\`\n$(echo "$out" | tail -25)\n\`\`\`\n"
        fi
    done
    echo
    [ -n "$fails" ] && printf '%b\n' "$fails"
fi

exit 0
