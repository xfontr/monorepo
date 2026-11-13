import { configs } from "eslint-plugin-sonarjs";

const preset = configs.recommended;

const sonarjs: object = {
    ...preset,
    ignores: ["**/*.spec.ts"],
};

export default sonarjs;
