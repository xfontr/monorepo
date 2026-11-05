import type { Rule } from "eslint";
import type { AST } from "vue-eslint-parser";
import { templateBodyVisitor } from "./selectorRule.ts";

type Node = AST.Node & { parent?: Node | null };

const rootName = (callee: AST.ESLintExpression | AST.ESLintSuper): string | undefined => {
    let node: AST.ESLintExpression | AST.ESLintSuper = callee;
    while (node.type === "MemberExpression") node = node.object;
    return node.type === "Identifier" ? node.name : undefined;
};

const isEventHandler = (node: Node): boolean => {
    for (let current = node.parent; current; current = current.parent) {
        if (current.type === "VAttribute")
            return current.directive && current.key.name.name === "on";
    }
    return false;
};

const container = (node: Node): AST.VExpressionContainer | undefined => {
    for (let current = node.parent; current; current = current.parent) {
        if (current.type === "VExpressionContainer") return current;
    }
    return undefined;
};

const readsLocal = (call: AST.ESLintCallExpression, scope: AST.VExpressionContainer): boolean => {
    const [start, end] = call.range;
    return scope.references.some(
        ({ id, variable }) =>
            (variable?.kind === "v-for" || variable?.kind === "scope") &&
            id.range[0] >= start &&
            id.range[1] <= end,
    );
};

const noTemplateCall: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Disallow template calls that read only component state; derive them in a `computed`.",
        },
        schema: [],
        messages: {
            call: "Move this call into a `computed`; template calls are only for `$` globals, event handlers and `v-for`/slot variables.",
        },
    },
    create: (context) => {
        const offends = (node: AST.ESLintCallExpression): boolean => {
            if (rootName(node.callee)?.startsWith("$") || isEventHandler(node)) return false;
            const scope = container(node);
            return !scope || !readsLocal(node, scope);
        };

        const insideOffender = (node: Node): boolean => {
            for (
                let current = node.parent;
                current && current.type !== "VExpressionContainer";
                current = current.parent
            ) {
                if (current.type === "CallExpression" && offends(current)) return true;
            }
            return false;
        };

        return templateBodyVisitor(context, {
            CallExpression: (node: AST.ESLintCallExpression) => {
                if (offends(node) && !insideOffender(node)) {
                    context.report({ node: node as unknown as Rule.Node, messageId: "call" });
                }
            },
        });
    },
};

export default noTemplateCall;
