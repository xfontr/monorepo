const rules = {
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
};

const typeDefinitions: object = { files: ["**/*.ts"], rules };

const typeDefinitionsVue: object = { files: ["**/*.vue"], rules };

export { typeDefinitions, typeDefinitionsVue };
