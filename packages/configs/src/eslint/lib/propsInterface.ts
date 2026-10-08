const DEFINE_PROPS = "CallExpression[callee.name='defineProps'] > TSTypeParameterInstantiation";
const UNDEFINED_DEFAULT_MESSAGE = "An optional prop is already `undefined` when omitted; drop the default.";

const propsInterfaceSelectors: object[] = [
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
    {
        selector: "CallExpression[callee.name='withDefaults'] > ObjectExpression > Property > Identifier.value[name='undefined']",
        message: UNDEFINED_DEFAULT_MESSAGE,
    },
    {
        selector: "VariableDeclarator[init.callee.name='defineProps'] > ObjectPattern > Property > AssignmentPattern > Identifier.right[name='undefined']",
        message: UNDEFINED_DEFAULT_MESSAGE,
    },
];

export default propsInterfaceSelectors;
