#!/bin/sh
# ship-issue agents run unattended, so reaching a real system or rewriting shared history is refused
# here rather than trusted to a prompt. Exit 2 blocks the call and hands the message to the model.

command -v jq >/dev/null 2>&1 || exit 0

cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null)
[ -n "$cmd" ] || exit 0

block() {
    echo "Blocked: $1" >&2
    echo "Ask the user to run it themselves if it's really needed." >&2
    exit 2
}

# Anchored to where a command starts, so a heredoc or a message that only mentions one passes
at='(^|[;&|(])[[:space:]]*'

matches() {
    printf '%s' "$cmd" | grep -Eq "$at$1"
}

runner='(npx[[:space:]]+|pnpm[[:space:]]+(exec[[:space:]]+|dlx[[:space:]]+)?)?'

if matches 'pnpm[^;&|]*[[:space:]](run[[:space:]]+)?start([[:space:];&|)]|$)' ||
    matches "${runner}nux[ti][[:space:]]+preview"; then
    block "a production server reads real credentials and talks to real vendors; use dev mode."
fi

if matches '(curl|wget|xh|http)[[:space:]].*(huellalegal\.com|/wp-json)' ||
    matches 'node[[:space:]].*fetch\(.*(huellalegal\.com|/wp-json)'; then
    block "requests to the live WordPress site; use the fixtures and fakes instead."
fi

push='git[[:space:]]+push[^;&|]*'

if matches "$push[[:space:]](-f|--force|--force-with-lease)([=[:space:]]|\$)"; then
    block "force-pushing rewrites history other runs may have built on."
fi

if matches "$push[[:space:]:]master([[:space:];&|]|\$)"; then
    block "master only moves through a merged PR."
fi

exit 0
