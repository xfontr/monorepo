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
    packages/*/package.json|apps/*/package.json|infrastructure/*/package.json)
        # Lifecycle scripts are banned workspace-wide (CLAUDE.md), not just under packages/*: both CI
        # workflows install with --ignore-scripts everywhere, so one works locally and silently does
        # nothing where it matters, regardless of which root it's added under
        lifecycle=$(jq -r '.scripts // {} | keys[] | select(. == "postinstall" or . == "prepare" or . == "prepublish" or . == "prepublishOnly")' "$file" 2>/dev/null | tr '\n' ' ')

        if [ -n "$lifecycle" ]; then
            echo "$rel declares: $lifecycle" >&2
            echo "Lifecycle scripts are banned here: CI installs with --ignore-scripts, so they do" >&2
            echo "nothing there while still working locally." >&2
            exit 2
        fi

        # The no-build-step rule is packages/*-only: apps and infrastructure projects are consumed
        # directly, never published, so they're allowed a real build script
        case "$rel" in
            packages/*/package.json)
                build=$(jq -r '.scripts // {} | keys[] | select(. == "build")' "$file" 2>/dev/null)

                if [ -n "$build" ]; then
                    echo "$rel declares a build script." >&2
                    echo "packages/* export raw TypeScript/Vue source — no build script, no dist/, no main/types." >&2
                    exit 2
                fi
                ;;
        esac
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

# A package.json git has never seen means a new project, and step 5 of new-package is the one skipped.
# One it has seen before gets a different check: `version` is nx release's alone to move
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

        old_version=$(git -C "$root" show "HEAD:$rel" 2>/dev/null | jq -r '.version // empty')
        new_version=$(jq -r '.version // empty' "$file" 2>/dev/null)
        if [ -n "$old_version" ] && [ "$old_version" != "$new_version" ]; then
            echo "$rel's version moved from $old_version to $new_version by hand." >&2
            echo "nx release derives version from Conventional Commits — never hand-edit it, here or" >&2
            echo "in any CHANGELOG.md." >&2
            exit 2
        fi
        ;;
esac

# "Never write a real endpoint, URL, token or instance ID into the repo" (CLAUDE.md).A blanket https?://
# grep isn't the fix — it fires on "$schema" in settings.json/nx.json,
# on tsconfig.json's doc-link comment, and on every *.spec.ts that hardcodes a fake vendor URL as a
# fixture (that's the norm here, not the violation) — so this skips specs/stories, comments, $schema
# and localhost, and looks only at the source/config a real endpoint would actually land in
case "$rel" in
    *.spec.ts|*.spec.vue|*.stories.ts)
        ;;
    *.ts|*.vue|*.json)
        hit=$(grep -nE 'https?://' "$file" 2>/dev/null \
            | grep -viE '://localhost' \
            | grep -vE '"\$schema"' \
            | grep -vE '^[0-9]+:[[:space:]]*(//|/\*|\*)' \
            | head -1)

        if [ -n "$hit" ]; then
            echo "$rel: $hit" >&2
            echo "Endpoints, tokens and instance IDs are env vars with no default (CLAUDE.md)." >&2
            echo "Add the name to .env.example and read the value at runtime instead." >&2
            exit 2
        fi
        ;;
esac

exit 0
