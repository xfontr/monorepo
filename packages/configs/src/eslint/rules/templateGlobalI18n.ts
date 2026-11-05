import { selectorRule } from "./selectorRule.ts";

const templateGlobalI18n = selectorRule({
    description:
        "Require the global `$t` (`$te`, `$tm`, `$rt`, `$d`, `$n`) inside `<template>` instead of the `useI18n()` binding.",
    template: true,
    bans: {
        binding: {
            selector: "CallExpression[callee.type='Identifier'][callee.name=/^(t|te|tm|rt|d|n)$/]",
            message:
                "Use the global `$t` (`$te`, `$tm`, `$rt`, `$d`, `$n`) in templates, not the `useI18n()` binding.",
        },
    },
});

export default templateGlobalI18n;
