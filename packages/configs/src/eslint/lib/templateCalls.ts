import type { Rule } from "eslint";
import type { AST } from "vue-eslint-parser";

type Node = AST.Node & { parent?: Node | null };

interface TemplateParserServices {
    defineTemplateBodyVisitor?: (visitor: Record<string, (node: never) => void>) => Rule.RuleListener
}

function rootName(callee: AST.ESLintExpression | AST.ESLintSuper): string | undefined {
    let node: AST.ESLintExpression | AST.ESLintSuper = callee;
    while (node.type === "MemberExpression") node = node.object;
    return node.type === "Identifier" ? node.name : undefined;
}

function isEventHandler(node: Node): boolean {
    for (let current = node.parent; current; current = current.parent) {
        if (current.type === "VAttribute") return current.directive && current.key.name.name === "on";
    }
    return false;
}

function container(node: Node): AST.VExpressionContainer | undefined {
    for (let current = node.parent; current; current = current.parent) {
        if (current.type === "VExpressionContainer") return current;
    }
    return undefined;
}

function readsLocal(call: AST.ESLintCallExpression, scope: AST.VExpressionContainer): boolean {
    const [start, end] = call.range;
    return scope.references.some(({ id, variable }) =>
        (variable?.kind === "v-for" || variable?.kind === "scope") && id.range[0] >= start && id.range[1] <= end);
}

const noTemplateCall: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        docs: { description: "Disallow template calls that read only component state; derive them in a `computed`." },
        schema: [],
        messages: { call: "Move this call into a `computed`; template calls are only for `$` globals, event handlers and `v-for`/slot variables." },
    },
    create(context) {
        const services = context.sourceCode.parserServices as TemplateParserServices;
        if (!services.defineTemplateBodyVisitor) return {};

        function offends(node: AST.ESLintCallExpression): boolean {
            if (rootName(node.callee)?.startsWith("$") || isEventHandler(node)) return false;
            const scope = container(node);
            return !scope || !readsLocal(node, scope);
        }

        function insideOffender(node: Node): boolean {
            for (let current = node.parent; current && current.type !== "VExpressionContainer"; current = current.parent) {
                if (current.type === "CallExpression" && offends(current)) return true;
            }
            return false;
        }

        return services.defineTemplateBodyVisitor({
            CallExpression(node: AST.ESLintCallExpression) {
                if (offends(node) && !insideOffender(node)) {
                    context.report({ node: node as unknown as Rule.Node, messageId: "call" });
                }
            },
        });
    },
};

const templateCalls: object = {
    files: ["**/*.vue"],
    plugins: { monorepo: { rules: { "no-template-call": noTemplateCall } } },
    rules: {
        "monorepo/no-template-call": "error",
    },
};

export default templateCalls;
