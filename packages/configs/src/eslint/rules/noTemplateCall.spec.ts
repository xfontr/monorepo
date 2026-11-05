import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import { describe, it } from "vitest";
import noTemplateCall from "./noTemplateCall.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } },
});

const template = (body: string) => ({ code: `<template>${body}</template>`, filename: "x.vue" });

ruleTester.run("no-template-call", noTemplateCall, {
    valid: [
        template("<p>{{ total }}</p>"),
        template('<p>{{ $t("title") }}</p>'),
        template('<p>{{ $route.path.startsWith("/a") }}</p>'),
        template('<button @click="save()">Save</button>'),
        template('<li v-for="row in rows">{{ format(row) }}</li>'),
        template('<Item v-slot="{ item }">{{ label(item) }}</Item>'),
        { code: "const total = sum(items);", filename: "x.ts" },
    ],
    invalid: [
        { ...template("<p>{{ format(total) }}</p>"), errors: [{ messageId: "call" }] },
        { ...template('<p :class="classes()" />'), errors: [{ messageId: "call" }] },
        {
            ...template("<p>{{ outer(inner(total)) }}</p>"),
            errors: [{ messageId: "call", column: 17 }],
        },
        {
            ...template('<li v-for="row in rows">{{ format(total) }}</li>'),
            errors: [{ messageId: "call" }],
        },
    ],
});
