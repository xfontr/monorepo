import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import { describe, it, vi } from "vitest";
import layerBoundaries from "./layerBoundaries.ts";

// What `nuxi prepare` writes into /repo/app/.nuxt, which the rule reads to place each auto-import.
const nuxt = vi.hoisted(() => {
    const files: Record<string, string> = {
        "/repo/app/.nuxt/types/imports.d.ts": [
            "  const useWorkflows: typeof import('../../layers/workflows/app/composables/useWorkflows').useWorkflows",
            "  const useFormPost: typeof import('../../layers/forms/app/composables/useFormPost').useFormPost",
            "  const useTrack: typeof import('../../app/composables/useTrack').useTrack",
        ].join("\n"),
        "/repo/app/.nuxt/types/nitro-imports.d.ts": "",
        "/repo/app/.nuxt/types/shared-imports.d.ts": "",
        "/repo/app/.nuxt/components.d.ts": [
            "export const WorkflowsGraph: typeof import(\"../layers/workflows/app/components/WorkflowsGraph.vue\")['default']",
            "export const BaseCard: typeof import(\"../app/components/base/Card.vue\")['default']",
            "export const ShellSiteHeader: typeof import(\"../app/components/shell/SiteHeader.vue\")['default']",
        ].join("\n"),
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

const KIT_PATHS = "app/components/base/, app/composables/";
const OPTIONS = [{ cores: ["design", "snapshot"], kit: KIT_PATHS.split(", ") }];
const FEATURE = "/repo/app/layers/audits/app/utils/format.ts";
const CORE = "/repo/app/layers/docs/shared/docPages.ts";
const CORES = [{ cores: ["design", "docs", "snapshot"], kit: KIT_PATHS.split(", ") }];
const KIT = [{ cores: ["articles", "forms"], kit: KIT_PATHS.split(", ") }];
const ARTICLES = "/repo/app/layers/articles/app/utils/summary.ts";
const IN_KIT = "/repo/app/app/composables/useListing.ts";

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
            code: 'import { a } from "#layers/workflows/shared/workflows.ts";',
            filename: "/repo/app/app/pages/index.ts",
            options: OPTIONS,
        },
        {
            code: 'import { a } from "../../tools/lib/run.ts";',
            filename: FEATURE,
            options: OPTIONS,
        },
        { code: "useFormPost();", filename: FEATURE, options: KIT },
        { code: 'import { a } from "~/composables/useTrack";', filename: FEATURE, options: KIT },
        { code: "useTrack();", filename: ARTICLES, options: KIT },
        { code: "useTrack();", filename: IN_KIT, options: KIT },
        { code: 'import { ref } from "vue";', filename: IN_KIT, options: KIT },
    ],
    invalid: [
        {
            code: 'import { a } from "#layers/workflows/shared/workflows.ts";',
            filename: FEATURE,
            options: OPTIONS,
            errors: [
                {
                    messageId: "featureToFeature",
                    data: { target: "workflows", cores: "design, snapshot", kit: KIT_PATHS },
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
                    data: { target: "workflows", cores: "design, snapshot", kit: KIT_PATHS },
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
                    data: { target: "audits", cores: "design, docs, snapshot", kit: KIT_PATHS },
                },
            ],
        },
        {
            code: "useFormPost();",
            filename: ARTICLES,
            options: KIT,
            errors: [{ messageId: "coreToCore", data: { target: "forms", kit: KIT_PATHS } }],
        },
        {
            code: 'import { a } from "~/components/shell/SiteHeader.vue";',
            filename: FEATURE,
            options: KIT,
            errors: [{ messageId: "layerToShell" }],
        },
        {
            code: 'import { a } from "../../../../app/layouts/default.vue";',
            filename: ARTICLES,
            options: KIT,
            errors: [{ messageId: "layerToShell" }],
        },
        {
            code: "useWorkflows();",
            filename: IN_KIT,
            options: KIT,
            errors: [{ messageId: "kitToOutside", data: { target: "workflows", kit: KIT_PATHS } }],
        },
        {
            code: 'import { a } from "#layers/articles/shared/constants";',
            filename: IN_KIT,
            options: KIT,
            errors: [{ messageId: "kitToOutside", data: { target: "articles", kit: KIT_PATHS } }],
        },
        {
            code: 'import { a } from "../components/shell/SiteHeader.vue";',
            filename: IN_KIT,
            options: KIT,
            errors: [{ messageId: "kitToOutside", data: { target: "shell", kit: KIT_PATHS } }],
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
        {
            code: "<template><BaseCard /></template>",
            filename: "/repo/app/layers/audits/app/components/AuditCard.vue",
            options: KIT,
        },
        {
            code: "<template><WorkflowsGraph /></template>",
            filename: PAGE,
            options: KIT,
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
                    data: { target: "workflows", cores: "design, snapshot", kit: KIT_PATHS },
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
        {
            code: "<template><ShellSiteHeader /></template>",
            filename: PAGE,
            options: KIT,
            errors: [{ messageId: "layerToShell" }],
        },
        {
            code: "<template><WorkflowsGraph /></template>",
            filename: "/repo/app/app/components/base/Card.vue",
            options: KIT,
            errors: [{ messageId: "kitToOutside", data: { target: "workflows", kit: KIT_PATHS } }],
        },
    ],
});
