import { ESLint, type Linter } from "eslint";
import { describe, expect, it } from "vitest";
import {
    createNodeConfig,
    createNuxtConfig,
    createVueConfig,
    routeMeta,
    tailwind,
} from "./index.ts";

const resolve = async (config: object[], filePath: string) => {
    const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: config as Linter.Config[],
    });
    if (await eslint.isPathIgnored(filePath)) return undefined;
    const resolved = (await eslint.calculateConfigForFile(filePath)) as Linter.Config | undefined;
    return resolved?.rules ?? {};
};

const severity = (entry: Linter.RuleEntry | undefined): number | undefined => {
    const level = Array.isArray(entry) ? entry[0] : entry;
    return level === "error" ? 2 : level === "warn" ? 1 : level === "off" ? 0 : level;
};

const importBans = async (config: object[], filePath: string): Promise<string> =>
    JSON.stringify((await resolve(config, filePath))?.["no-restricted-imports"]);

describe("eslint factories", () => {
    it("loads the in-house plugin when several configs and an appended one all register it", async () => {
        const config = [...createNuxtConfig(), routeMeta];
        const eslint = new ESLint({
            overrideConfigFile: true,
            overrideConfig: config as Linter.Config[],
        });

        const [result] = await eslint.lintText("export default defineEventHandler(() => 1);\n", {
            filePath: `${process.cwd()}/server/api/items.get.ts`,
        });

        expect(result?.messages.map(({ ruleId }) => ruleId)).toContain(
            "monorepo/require-route-meta",
        );
    });

    it("keeps each import ban on its own paths instead of one replacing another", async () => {
        const config = createNuxtConfig();

        expect(await importBans(config, "src/core/ports/Client.ts")).toContain("nitropack");
        expect(await importBans(config, "app/composables/useItems.ts")).toContain("tools");
        expect(await importBans(config, "server/api/items.get.ts")).toContain("tools");
        expect(await importBans(config, "e2e/home.spec.ts")).toContain("@playwright/test");
    });

    it("lets specs log and build HTML, and nothing else", async () => {
        const config = createNodeConfig();
        const source = await resolve(config, "src/report.ts");
        const spec = await resolve(config, "src/report.spec.ts");

        expect(severity(source?.["no-console"])).toBe(2);
        expect(severity(source?.["no-eval"])).toBe(2);
        expect(spec?.["no-console"]).toBeUndefined();
        expect(spec?.["no-eval"]).toBeUndefined();
    });

    it("keeps config files unlinted", async () => {
        expect(await resolve(createNodeConfig(), "vitest.config.ts")).toBeUndefined();
        expect(await resolve(createNuxtConfig(), "eslint.config.ts")).toBeUndefined();
    });

    it("applies the Vue rules only to the Vue flavours, and route meta only when appended", async () => {
        const node = await resolve(createNodeConfig(), "server/api/items.get.ts");
        const vue = await resolve(createVueConfig(), "lib/Button.vue");
        const nuxt = await resolve(createNuxtConfig(), "server/api/items.get.ts");

        expect(node?.["monorepo/require-route-meta"]).toBeUndefined();
        expect(nuxt?.["monorepo/require-route-meta"]).toBeUndefined();
        expect(severity(vue?.["monorepo/no-template-call"])).toBe(2);
        expect(severity(vue?.["monorepo/props-shape"])).toBe(2);
        expect(severity(vue?.["vue/no-v-html"])).toBe(2);
    });

    it("requires a reason on every disable, in scripts and templates alike", async () => {
        const script = await resolve(createNodeConfig(), "src/report.ts");
        const component = await resolve(createNuxtConfig(), "app/App.vue");

        expect(severity(script?.["monorepo/disable-needs-reason"])).toBe(2);
        expect(severity(component?.["monorepo/disable-needs-reason"])).toBe(2);
    });

    it("runs ESLint's core recommended rules in a Nuxt app without tripping on auto-imports", async () => {
        const config = createNuxtConfig();
        const component = await resolve(config, "app/App.vue");
        const server = await resolve(config, "server/utils/items.ts");

        expect(severity(component?.["no-fallthrough"])).toBe(2);
        expect(severity(server?.["no-cond-assign"])).toBe(2);
        expect(severity(component?.["no-undef"])).toBe(0);
    });

    it("scopes Tailwind to the entry point the app passes", async () => {
        const config = [...createNuxtConfig(), tailwind("app/main.css")];
        const rules = await resolve(config, "app/App.vue");

        expect(severity(rules?.["better-tailwindcss/no-unknown-classes"])).toBe(2);
        expect(severity(rules?.["better-tailwindcss/enforce-consistent-line-wrapping"])).toBe(0);
    });
});
