#!/bin/sh
# Style here is enforced by @stylistic through @monorepo/configs, so an edit that gets the indent or
# the quotes wrong is a lint failure that only surfaces at push time. Fixing it on the way out keeps
# that argument from ever reaching a diff.
#
# Errors --fix can't settle go back to the model on stderr with exit 2, which doesn't undo the edit.
# Every other path exits 0: a formatter must never block an edit that was otherwise fine.

command -v jq >/dev/null 2>&1 || exit 0

file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

# eslint only has a config for these; anything else (json, md, yaml) it would reject outright
case "$file" in
    *.ts|*.mts|*.cts|*.vue) ;;
    *) exit 0 ;;
esac

# The root has no eslint binary, only each project does, so run it from the file's own package
dir=$(dirname "$file")
while [ "$dir" != "/" ] && [ "$dir" != "." ] && [ ! -f "$dir/package.json" ]; do
    dir=$(dirname "$dir")
done
[ -f "$dir/package.json" ] || exit 0

# --quiet skips warn-level rules, fixes included; exit 1 means errors remain, 2 that eslint failed
residue=$(cd "$dir" && pnpm exec eslint --fix --quiet "$file" 2>/dev/null)
[ $? -eq 1 ] && [ -n "$residue" ] || exit 0

echo "eslint errors --fix couldn't settle:$residue" >&2
exit 2
