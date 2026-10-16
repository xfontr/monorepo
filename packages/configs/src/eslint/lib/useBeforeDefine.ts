const rules = {
    "@typescript-eslint/no-use-before-define": [
        "error",
        {
            functions: true,
            classes: true,
            variables: true,
            typedefs: false,
            ignoreTypeReferences: true,
            allowNamedExports: true,
        },
    ],
};

const useBeforeDefine: object = { files: ["**/*.ts"], rules };

const useBeforeDefineVue: object = { files: ["**/*.vue"], rules };

export { useBeforeDefine, useBeforeDefineVue };
