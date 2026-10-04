const TOP = ":matches(Program, ExportNamedDeclaration) > VariableDeclaration[kind='const'] > VariableDeclarator";

const OPEN_KEY = "/^TS(String|Number)Keyword$/";

const constTableSelectors: object[] = [
    {
        selector: `${TOP}[id.typeAnnotation.typeAnnotation.typeName.name='Record']:not([id.typeAnnotation.typeAnnotation.typeArguments.params.0.type=${OPEN_KEY}])`,
        message: "Declare a lookup table as `NAME = { … } as const satisfies Record<K, V>`, not with a type annotation.",
    },
    {
        selector: `${TOP}[id.typeAnnotation.typeAnnotation.typeName.name='Partial'][id.typeAnnotation.typeAnnotation.typeArguments.params.0.typeName.name='Record']:not([id.typeAnnotation.typeAnnotation.typeArguments.params.0.typeArguments.params.0.type=${OPEN_KEY}])`,
        message: "Spell out every key and declare it as `NAME = { … } as const satisfies Record<K, V>`; a partial table can't be indexed by `K`.",
    },
    {
        selector: `${TOP} > TSSatisfiesExpression[typeAnnotation.typeName.name='Record'][expression.type='ObjectExpression']`,
        message: "Add `as const` before `satisfies Record<K, V>`.",
    },
    {
        selector: `${TOP}[id.name!=/^[A-Z][A-Z0-9_]*$/][init.type='TSSatisfiesExpression'][init.typeAnnotation.typeName.name='Record']`,
        message: "Name a lookup table in UPPER_SNAKE_CASE.",
    },
];

export default constTableSelectors;
