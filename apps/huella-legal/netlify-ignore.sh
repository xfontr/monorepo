#!/usr/bin/env bash
# Exits 0 when nothing Huella Legal's build reads changed between two commits, 1 otherwise.
# Usage: netlify-ignore.sh <from> <to>, run from anywhere in the repo.

set -uo pipefail

from="${1:-}"
to="${2:-}"

cd "$(git rev-parse --show-toplevel)" || exit 1

# A preview's last build is master's or its own, and neither says what the PR itself changes.
if [ "${CONTEXT:-}" = "deploy-preview" ]; then
    base="${NETLIFY_IGNORE_BASE:-}"
    if [ -z "$base" ]; then
        git fetch --quiet --no-tags origin master || exit 1
        base=FETCH_HEAD
    fi
    from="$(git merge-base "$base" "$to")" || exit 1
fi

# Netlify sets both refs to the same commit when a build has no cache, and GitHub sends an all-zero
# `before` on a new branch, so an unusable range builds rather than skipping.
if [ -z "$from" ] || [ -z "$to" ] || [ "$from" = "$to" ] || ! git cat-file -e "$from^{commit}" 2>/dev/null; then
    exit 1
fi

git diff --quiet "$from" "$to" -- \
    apps/huella-legal \
    packages/content \
    packages/i18n \
    packages/observability \
    package.json \
    pnpm-lock.yaml \
    pnpm-workspace.yaml \
    .nvmrc \
    netlify.toml \
    ":(exclude,glob)**/*.md" \
    ":(exclude,glob)**/*.spec.ts" \
    ":(exclude,glob)**/*.test.ts" \
    ":(exclude,glob)**/*.stories.ts" \
    ":(exclude,glob)**/vitest.config.ts" \
    ":(exclude,glob)**/vitest.setup.ts" \
    ":(exclude,glob)**/eslint.config.ts" \
    ":(exclude,glob)**/src/testing/**" \
    ":(exclude)apps/huella-legal/e2e" \
    ":(exclude)apps/huella-legal/.storybook" \
    ":(exclude)apps/huella-legal/playwright.config.ts" \
    ":(exclude)apps/huella-legal/tsconfig.e2e.json" \
    ":(exclude)apps/huella-legal/tsconfig.storybook.json"
