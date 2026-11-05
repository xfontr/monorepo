import { selectorRule } from "./selectorRule.ts";

const DEFINE_PROPS = "CallExpression[callee.name='defineProps'] > TSTypeParameterInstantiation";

const propsShape = selectorRule({
    description:
        "Require `defineProps<Props>()` with `Props` declared as an `interface`, and no optional prop defaulted to `undefined`.",
    bans: {
        inlineType: {
            selector: `${DEFINE_PROPS} > TSTypeLiteral`,
            message:
                "Declare the props as `interface Props { … }` and pass `defineProps<Props>()`.",
        },
        name: {
            selector: `${DEFINE_PROPS} > TSTypeReference:not([typeName.name='Props'])`,
            message: "Name the props interface `Props`.",
        },
        typeAlias: {
            selector: "Program > TSTypeAliasDeclaration[id.name='Props']",
            message: "Declare `Props` with `interface`, not `type`.",
        },
        undefinedDefault: {
            selector:
                "CallExpression[callee.name='withDefaults'] > ObjectExpression > Property > Identifier.value[name='undefined'], VariableDeclarator[init.callee.name='defineProps'] > ObjectPattern > Property > AssignmentPattern > Identifier.right[name='undefined']",
            message: "An optional prop is already `undefined` when omitted; drop the default.",
        },
    },
});

export default propsShape;
