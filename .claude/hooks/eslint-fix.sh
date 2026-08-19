#!/bin/sh
# Style here is enforced by @stylistic through @monorepo/configs, so an edit that gets the indent or
# the quotes wrong is a lint failure that only surfaces at push time. Fixing it on the way out keeps
# that argument from ever reaching a diff.
#
# Every failure path exits 0: a formatter must never block an edit that was otherwise fine.

command -v jq >/dev/null 2>&1 || exit 0

file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

# eslint only has a config for these; anything else (json, md, yaml) it would reject outright
case "$file" in
    *.ts|*.mts|*.cts|*.vue) ;;
    *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
pnpm exec eslint --fix "$file" >/dev/null 2>&1

exit 0
