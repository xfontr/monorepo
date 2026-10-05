import { eslint } from "@monorepo/configs";

export default [
    ...eslint.createNuxtConfig(),
    { files: ["app/lab/**", "app/pages/lab/**"], rules: { "monorepo/no-template-call": "off" } },
];
