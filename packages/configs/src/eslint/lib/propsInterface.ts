const DEFINE_PROPS = "CallExpression[callee.name='defineProps'] > TSTypeParameterInstantiation";

const propsInterface: object = {
    files: ["**/*.vue"],
    rules: {
        "no-restricted-syntax": ["error",
            {
                selector: `${DEFINE_PROPS} > TSTypeLiteral`,
                message: "Declare the props as `interface Props { … }` and pass `defineProps<Props>()`.",
            },
            {
                selector: `${DEFINE_PROPS} > TSTypeReference:not([typeName.name='Props'])`,
                message: "Name the props interface `Props`.",
            },
            {
                selector: "Program > TSTypeAliasDeclaration[id.name='Props']",
                message: "Declare `Props` with `interface`, not `type`.",
            },
        ],
    },
};

export default propsInterface;
