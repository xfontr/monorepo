import type { Rule } from "eslint";

type CallExpression = Extract<Rule.Node, { type: "CallExpression" }>;
type Properties = Extract<Rule.Node, { type: "ObjectExpression" }>["properties"];

const REQUIRED_KEYS = ["tags", "summary"];

const findProperty = (properties: Properties, name: string) =>
    properties.find(
        (property) =>
            property.type === "Property" &&
            ((property.key.type === "Identifier" && property.key.name === name) ||
                (property.key.type === "Literal" && property.key.value === name)),
    );

const describesOpenApi = ({ arguments: [meta] }: CallExpression): boolean => {
    if (meta?.type !== "ObjectExpression") return false;
    const openApi = findProperty(meta.properties, "openAPI");
    if (openApi?.type !== "Property" || openApi.value.type !== "ObjectExpression") return false;
    const { properties } = openApi.value;
    return REQUIRED_KEYS.every((key) => findProperty(properties, key));
};

const requireRouteMeta: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Require a top-level `defineRouteMeta` with `openAPI.tags` and `summary`, below the handler.",
        },
        schema: [],
        messages: {
            missing:
                "Describe this route with a top-level `defineRouteMeta({ openAPI: { … } })`, so its OpenAPI entry has a tag and a summary.",
            incomplete:
                "Give `defineRouteMeta` an `openAPI` object literal with `tags` and `summary`.",
            beforeHandler:
                "Move `defineRouteMeta` below the `export default` handler, so the route reads handler first.",
        },
    },
    create: (context) => {
        let found = false;
        let handlerSeen = false;

        return {
            "Program > ExportDefaultDeclaration": () => {
                handlerSeen = true;
            },
            "Program > ExpressionStatement > CallExpression[callee.name='defineRouteMeta']": (
                node: CallExpression,
            ) => {
                found = true;
                if (!describesOpenApi(node)) context.report({ node, messageId: "incomplete" });
                if (!handlerSeen) context.report({ node, messageId: "beforeHandler" });
            },
            "Program:exit": (node) => {
                if (!found) {
                    context.report({ node, loc: { line: 1, column: 0 }, messageId: "missing" });
                }
            },
        };
    },
};

const routeMeta: object = {
    files: ["**/server/api/**/*.ts", "**/server/routes/**/*.ts"],
    ignores: ["**/*.spec.ts"],
    plugins: { monorepo: { rules: { "require-route-meta": requireRouteMeta } } },
    rules: {
        "monorepo/require-route-meta": "error",
    },
};

export default routeMeta;
