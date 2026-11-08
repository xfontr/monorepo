import { selectorRule } from "./selectorRule.ts";

const namedDefaultExport = selectorRule({
    description: "Require a default-exported function or class to have a name.",
    bans: {
        function: {
            selector:
                "ExportDefaultDeclaration > :matches(ArrowFunctionExpression, FunctionExpression, FunctionDeclaration[id=null])",
            message:
                "Declare it as `const name = (…) => { … };` and end the file with `export default name;`.",
        },
        class: {
            selector:
                "ExportDefaultDeclaration > :matches(ClassExpression, ClassDeclaration[id=null])",
            message: "Name the class: `export default class Name { … }`.",
        },
    },
});

export default namedDefaultExport;
