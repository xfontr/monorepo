import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import { describe, it, vi } from "vitest";
import layerBoundaries from "./layerBoundaries.ts";

// What `nuxi prepare` writes into /repo/app/.nuxt, which the rule reads to place each auto-import.
const nuxt = vi.hoisted(() => {
    const files: Record<string, string> = {
        "/repo/app/.nuxt/types/imports.d.ts":
            "  const useWorkflows: typeof import('../../layers/workflows/app/composables/useWorkflows').useWorkflows",
        "/repo/app/.nuxt/types/nitro-imports.d.ts": "",
        "/repo/app/.nuxt/types/shared-imports.d.ts": "",
        "/repo/app/.nuxt/components.d.ts":
            "export const WorkflowsGraph: typeof import(\"../layers/workflows/app/components/WorkflowsGraph.vue\")['default']",
    };
    return { files };
});

vi.mock("node:fs", () => ({
    statSync: (file: string) => (file in nuxt.files ? { mtimeMs: 1 } : undefined),
    readFileSync: (file: string) => nuxt.files[file],
}));

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

const OPTIONS = [{ cores: ["design", "snapshot"] }];
const FEATURE = "/repo/app/layers/audits/app/utils/format.ts";
const CORE = "/repo/app/layers/docs/shared/wiki.ts";
const CORES = [{ cores: ["design", "docs", "snapshot"] }];

ruleTester.run("layer-boundaries", layerBoundaries, {
    valid: [
        {
            code: 'import { a } from "#layers/snapshot/shared/types.ts";',
            filename: FEATURE,
            options: OPTIONS,
        },
        {
            code: 'import { a } from "#layers/audits/shared/auditReports.ts";',
            filename: FEATURE,
            options: OPTIONS,
        },
        {
            code: 'import { a } from "../../shared/auditReports.ts";',
            filename: FEATURE,
            options: OPTIONS,
        },
        {
            code: 'import { a } from "#layers/snapshot/shared/types.ts";',
            filename: CORE,
            options: CORES,
        },
        {
            code: 'import { a } from "#layers/workflows/shared/workflows.ts";',
            filename: "/repo/app/app/pages/index.ts",
            options: OPTIONS,
        },
        {
            code: 'import { a } from "../../tools/lib/run.ts";',
            filename: FEATURE,
            options: OPTIONS,
        },
    ],
    invalid: [
        {
            code: 'import { a } from "#layers/workflows/shared/workflows.ts";',
            filename: FEATURE,
            options: OPTIONS,
            errors: [
                {
                    messageId: "featureToFeature",
                    data: { target: "workflows", cores: "design, snapshot" },
                },
            ],
        },
        {
            code: 'import { a } from "../../../workflows/shared/workflows.ts";',
            filename: FEATURE,
            options: OPTIONS,
            errors: [{ messageId: "featureToFeature" }],
        },
        {
            code: 'export { a } from "#layers/workflows/shared/workflows.ts";',
            filename: FEATURE,
            options: OPTIONS,
            errors: [{ messageId: "featureToFeature" }],
        },
        {
            code: 'const mod = import("#layers/workflows/shared/workflows.ts");',
            filename: FEATURE,
            options: OPTIONS,
            errors: [{ messageId: "featureToFeature" }],
        },
        {
            code: "useWorkflows();",
            filename: FEATURE,
            options: OPTIONS,
            errors: [
                {
                    messageId: "featureToFeature",
                    data: { target: "workflows", cores: "design, snapshot" },
                },
            ],
        },
        {
            code: "useWorkflows();",
            filename: "/unprepared/layers/audits/app/utils/format.ts",
            options: OPTIONS,
            errors: [{ messageId: "unprepared" }],
        },
        {
            code: 'import { a } from "#layers/audits/shared/auditReports.ts";',
            filename: CORE,
            options: CORES,
            errors: [
                {
                    messageId: "coreToFeature",
                    data: { target: "audits", cores: "design, docs, snapshot" },
                },
            ],
        },
    ],
});

const vueTester = new RuleTester({
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } },
});

const PAGE = "/repo/app/layers/audits/app/pages/audits.vue";

vueTester.run("layer-boundaries in .vue", layerBoundaries, {
    valid: [
        {
            code: "<template><WorkflowsGraph /></template>",
            filename: PAGE,
            options: OPTIONS,
        },
        {
            code: "<template><workflows-graph /></template>",
            filename: PAGE,
            options: OPTIONS,
        },
    ],
    invalid: [
        {
            code: "<template><WorkflowsGraph /></template>",
            filename: "/repo/app/layers/audits/app/components/AuditCard.vue",
            options: OPTIONS,
            errors: [
                {
                    messageId: "featureToFeature",
                    data: { target: "workflows", cores: "design, snapshot" },
                },
            ],
        },
        {
            code: "<template><p>{{ useWorkflows() }}</p></template>",
            filename: PAGE,
            options: OPTIONS,
            errors: [{ messageId: "featureToFeature" }],
        },
        {
            code: "<template><WorkflowsGraph /></template>",
            filename: "/repo/app/layers/docs/app/pages/wiki.vue",
            options: CORES,
            errors: [{ messageId: "coreToFeature" }],
        },
        {
            code: '<script setup lang="ts">\nimport { a } from "#layers/workflows/shared/workflows.ts";\n</script>',
            filename: PAGE,
            options: OPTIONS,
            errors: [{ messageId: "featureToFeature" }],
        },
    ],
});
