import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import { describe, it } from "vitest";
import layerBoundaries from "./layerBoundaries.ts";

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

vueTester.run("layer-boundaries in .vue", layerBoundaries, {
    valid: [],
    invalid: [
        {
            code: '<script setup lang="ts">\nimport { a } from "#layers/workflows/shared/workflows.ts";\n</script>',
            filename: "/repo/app/layers/audits/app/pages/audits.vue",
            options: OPTIONS,
            errors: [{ messageId: "featureToFeature" }],
        },
    ],
});
