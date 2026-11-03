import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, type Ref, ref } from "vue";
import { useInterestRateOptions } from "./useInterestRateOptions";

const i18n = vi.hoisted(() => ({ locale: undefined as unknown as Ref<string> }));

mockNuxtImport("useI18n", () => () => ({
    t: (key: string, params?: Record<string, unknown>) =>
        params ? `${key} ${JSON.stringify(params)}` : key,
    locale: i18n.locale,
}));

const optionsFor = async (rates: Parameters<typeof useInterestRateOptions>[0]) => {
    let options!: ReturnType<typeof useInterestRateOptions>;

    await mountSuspended(
        defineComponent({
            setup: () => {
                options = useInterestRateOptions(rates);

                return () => null;
            },
        }),
    );

    return options;
};

describe("useInterestRateOptions", () => {
    beforeEach(() => {
        i18n.locale = ref("es-ES");
    });

    it("labels each preset with its percentage in the reader's decimal format", async () => {
        const options = await optionsFor(["legal", "judicial"]);

        expect(options.value).toEqual([
            { value: "legal", label: 'interestCalculator.rate.options.legal {"percent":"3,25"}' },
            {
                value: "judicial",
                label: 'interestCalculator.rate.options.judicial {"percent":"5,25"}',
            },
        ]);
    });

    it("gives the custom rate no percentage, since the reader types it", async () => {
        const options = await optionsFor(["legal", "custom"]);

        expect(options.value.at(-1)).toEqual({
            value: "custom",
            label: "interestCalculator.rate.options.custom",
        });
    });

    it("reformats the percentages when the locale changes, instead of keeping the first one", async () => {
        const options = await optionsFor(["legal"]);

        i18n.locale.value = "en-GB";

        expect(options.value[0]).toMatchObject({
            label: 'interestCalculator.rate.options.legal {"percent":"3.25"}',
        });
    });
});
