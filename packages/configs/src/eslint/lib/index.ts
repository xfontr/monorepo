import regexpPlugin from "eslint-plugin-regexp";
import { format, formatVue } from "./format.ts";
import arrowFunctions from "./arrowFunctions.ts";
import destructuring from "./destructuring.ts";
import jsonc from "./jsonc.ts";
import boundaries from "./boundaries.ts";
import vitestConfig from "./vitest.ts";
import baseIgnores from "./ignores.ts";
import coreIsolation from "./coreIsolation.ts";
import layerIsolation from "./layerIsolation.ts";
import { restrictedSyntax, restrictedSyntaxVue } from "./restrictedSyntax.ts";
import templateI18n from "./templateI18n.ts";
import templateCalls from "./templateCalls.ts";
import { useBeforeDefine, useBeforeDefineVue } from "./useBeforeDefine.ts";
import noConsole from "./console.ts";
import e2eFixture from "./e2eFixture.ts";
import routeMeta from "./routeMeta.ts";

const regexp: object = regexpPlugin.configs["flat/recommended"];

export {
    format,
    formatVue,
    arrowFunctions,
    destructuring,
    jsonc,
    boundaries,
    vitestConfig,
    baseIgnores,
    coreIsolation,
    layerIsolation,
    restrictedSyntax,
    restrictedSyntaxVue,
    templateI18n,
    templateCalls,
    useBeforeDefine,
    useBeforeDefineVue,
    noConsole,
    e2eFixture,
    routeMeta,
    regexp,
};
