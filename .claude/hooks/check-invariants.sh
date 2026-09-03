#!/bin/sh
# The root CLAUDE.md states these rules in prose, which works right up until an agent edits one file
# and not its pair. Each check below maps to a rule that is already written down and has already been
# broken at least once.
#
# Exit 2 puts the message on stderr and back into the model's context. Every other path exits 0 —
# a reminder that blocks unrelated edits gets turned off within a day.

command -v jq >/dev/null 2>&1 || exit 0

file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -n "$file" ] || exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rel=${file#"$root"/}

# The tag table is written twice and the readable copy is the one that gets forgotten
if [ "$rel" = "packages/configs/src/eslint/lib/boundaries.ts" ]; then
    echo "boundaries.ts is the enforced copy of the Nx tag table. The readable copy in README.md" >&2
    echo "must say the same thing — update the '🧱 Architecture & boundaries' table before moving on." >&2
    exit 2
fi

case "$rel" in
    packages/*/package.json)
        # No build step and no lifecycle scripts: packages export raw source, and both CI workflows
        # install with --ignore-scripts, so a lifecycle script works locally and silently does nothing
        # where it matters
        found=$(jq -r '.scripts // {} | keys[] | select(. == "build" or . == "postinstall" or . == "prepare" or . == "prepublish" or . == "prepublishOnly")' "$file" 2>/dev/null | tr '\n' ' ')

        if [ -n "$found" ]; then
            echo "$rel declares: $found" >&2
            echo "packages/* export raw TypeScript/Vue source — no build script, no dist/, no main/types." >&2
            echo "Lifecycle scripts are worse: CI installs with --ignore-scripts, so they do nothing there." >&2
            exit 2
        fi
        ;;
esac

# A review whose row never lands in the history table is a review nobody will ever compare against.
# This one clears itself: the check only fires while the row is genuinely missing
case "$rel" in
    docs/reviews/[0-9]*.md)
        name=$(basename "$rel")
        if ! grep -q "$name" "$root/docs/reviews/README.md" 2>/dev/null; then
            echo "$rel has no row in the history table in docs/reviews/README.md." >&2
            echo "Add it now — ratings only, one column per card plus the total and the rubric" >&2
            echo "version. A review that isn't in the table can't be compared to the next one." >&2
            exit 2
        fi
        ;;
esac

# A package.json git has never seen means a new project, and step 5 of new-package is the one skipped
case "$rel" in
    packages/*/package.json|apps/*/package.json|infrastructure/*/package.json)
        if ! git -C "$root" ls-files --error-unmatch "$rel" >/dev/null 2>&1; then
            echo "$rel is a new project. Three things outside its directory have to agree:" >&2
            echo "  1. nx.tags in this package.json (one type: tag, one scope: tag)" >&2
            echo "  2. depConstraints in packages/configs/src/eslint/lib/boundaries.ts, plus the tag" >&2
            echo "     added to every consumer's onlyDependOnLibsWithTags" >&2
            echo "  3. the tag table and the workspace-layout block in README.md" >&2
            exit 2
        fi
        ;;
esac

exit 0
