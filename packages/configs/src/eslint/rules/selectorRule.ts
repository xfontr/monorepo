import type { Rule } from "eslint";

interface TemplateParserServices {
    defineTemplateBodyVisitor?: (
        visitor: Record<string, (node: never) => void>,
    ) => Rule.RuleListener;
}

interface Ban {
    selector: string;
    message: string;
}

interface SelectorRuleOptions {
    description: string;
    bans: Record<string, Ban>;
    template?: boolean;
}

/** Visits a `.vue` file's `<template>`; anywhere vue-eslint-parser didn't parse, visits nothing. */
export const templateBodyVisitor = (
    context: Rule.RuleContext,
    visitor: Record<string, (node: never) => void>,
): Rule.RuleListener => {
    const services = context.sourceCode.parserServices as TemplateParserServices;
    return services.defineTemplateBodyVisitor?.(visitor) ?? {};
};

/** A rule that reports every node matching one of its selectors, one messageId per selector. */
export const selectorRule = ({
    description,
    bans,
    template = false,
}: SelectorRuleOptions): Rule.RuleModule => ({
    meta: {
        type: "suggestion",
        docs: { description },
        schema: [],
        messages: Object.fromEntries(
            Object.entries(bans).map(([messageId, { message }]) => [messageId, message]),
        ),
    },
    create: (context) => {
        const visitor = Object.fromEntries(
            Object.entries(bans).map(([messageId, { selector }]) => [
                selector,
                (node: Rule.Node) => context.report({ node, messageId }),
            ]),
        );
        return template ? templateBodyVisitor(context, visitor) : visitor;
    },
});
