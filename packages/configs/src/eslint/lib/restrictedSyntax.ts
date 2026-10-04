import constTableSelectors from "./constTables.ts";
import propsInterfaceSelectors from "./propsInterface.ts";

// A second config setting this rule for the same files replaces these selectors rather than adding to them
const restrictedSyntax: object = {
    files: ["**/*.ts"],
    rules: {
        "no-restricted-syntax": ["error", ...constTableSelectors],
    },
};

const restrictedSyntaxVue: object = {
    files: ["**/*.vue"],
    rules: {
        "no-restricted-syntax": ["error", ...constTableSelectors, ...propsInterfaceSelectors],
    },
};

export { restrictedSyntax, restrictedSyntaxVue };
