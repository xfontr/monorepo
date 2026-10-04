import regexpPlugin from "eslint-plugin-regexp";
import stylistic from "./stylistic.ts";
import jsonc from "./jsonc.ts";
import boundaries from "./boundaries.ts";
import vitestConfig from "./vitest.ts";
import baseIgnores from "./ignores.ts";
import coreIsolation from "./coreIsolation.ts";
import layerIsolation from "./layerIsolation.ts";
import propsInterface from "./propsInterface.ts";
import constTables from "./constTables.ts";
import templateI18n from "./templateI18n.ts";

const regexp: object = regexpPlugin.configs["flat/recommended"];

export { stylistic, jsonc, boundaries, vitestConfig, baseIgnores, coreIsolation, layerIsolation, propsInterface, constTables, templateI18n, regexp };
