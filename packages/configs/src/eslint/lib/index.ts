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
import { constTables, constTablesVue } from "./constTables.ts";
import propsInterface from "./propsInterface.ts";
import { disableReasons, disableReasonsVue } from "./disableReasons.ts";
import templateI18n from "./templateI18n.ts";
import templateCalls from "./templateCalls.ts";
import { typeDefinitions, typeDefinitionsVue } from "./typeDefinitions.ts";
import { useBeforeDefine, useBeforeDefineVue } from "./useBeforeDefine.ts";
import noConsole from "./console.ts";
import { unsafeCode, unsafeCodeVue } from "./unsafeCode.ts";
import e2eFixture from "./e2eFixture.ts";
import routeMeta from "./routeMeta.ts";
import tailwind from "./tailwind.ts";

const regexp: object = regexpPlugin.configs["flat/recommended"];

const shared: object[] = [
    format,
    arrowFunctions,
    destructuring,
    jsonc,
    boundaries,
    coreIsolation,
    constTables,
    typeDefinitions,
    useBeforeDefine,
    regexp,
    noConsole,
    unsafeCode,
    e2eFixture,
    disableReasons,
];

const vueOnly: object[] = [
    formatVue,
    layerIsolation,
    constTablesVue,
    propsInterface,
    templateI18n,
    templateCalls,
    typeDefinitionsVue,
    useBeforeDefineVue,
    unsafeCodeVue,
    disableReasonsVue,
];

export { shared, vueOnly, vitestConfig, baseIgnores, routeMeta, tailwind };
