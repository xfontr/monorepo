import monorepo from "../rules/index.ts";

const rules = { "monorepo/lookup-table-shape": "error" };

const constTables: object = { files: ["**/*.ts"], plugins: { monorepo }, rules };

const constTablesVue: object = { files: ["**/*.vue"], plugins: { monorepo }, rules };

export { constTables, constTablesVue };
