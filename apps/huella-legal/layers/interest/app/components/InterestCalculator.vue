<script setup lang="ts">
import type { InterestInput } from "../types/InterestInput";
import type { InterestResult } from "../types/InterestResult";
import InterestCalculatorAdvancedForm from "./InterestCalculatorAdvancedForm.vue";
import InterestCalculatorForm from "./InterestCalculatorForm.vue";
import InterestCalculatorHistory from "./InterestCalculatorHistory.vue";
import InterestCalculatorResult from "./InterestCalculatorResult.vue";

type Mode = "simple" | "advanced";

interface Calculation {
    input: InterestInput & { concept: string };
    result: InterestResult;
    added: boolean;
}

const { t } = useI18n();

const mode = ref<Mode>("simple");

const calculations = reactive<Record<Mode, Calculation | undefined>>({
    simple: undefined,
    advanced: undefined,
});

const history = useInterestHistory();

const tabs = computed(() =>
    (["simple", "advanced"] as const).map((value) => ({
        value,
        slot: value,
        label: t(`interestCalculator.tabs.${value}`),
    })),
);

const calculate = (into: Mode, input: InterestInput & { concept?: string }): void => {
    calculations[into] = {
        input: { concept: "", ...input },
        result: calculateInterest(input),
        added: false,
    };
};

const add = (from: Mode): void => {
    const calculation = calculations[from];

    if (!calculation || calculation.added) return;

    history.add({ ...calculation.input, ...calculation.result });
    calculation.added = true;
};
</script>

<template>
    <div class="flex flex-col gap-16 lg:gap-20">
        <UTabs
            v-model="mode"
            :items="tabs"
            :unmount-on-hide="false"
            variant="link"
            :ui="{
                list: 'gap-6 border-b border-default px-0',
                trigger:
                    'min-h-11 min-w-11 px-0 font-sans text-base font-semibold data-[state=active]:text-highlighted',
                indicator: 'h-0.5 bg-huella-slate-900',
                content: 'pt-8',
            }"
        >
            <template v-for="tab in tabs" :key="tab.value" #[tab.slot]>
                <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-12">
                    <InterestCalculatorForm
                        v-if="tab.value === 'simple'"
                        class="lg:col-span-7"
                        @submit="calculate('simple', $event)"
                        @edit="calculations.simple = undefined"
                    />
                    <InterestCalculatorAdvancedForm
                        v-else
                        class="lg:col-span-7"
                        @submit="calculate('advanced', $event)"
                        @edit="calculations.advanced = undefined"
                    />
                    <InterestCalculatorResult
                        :result="calculations[tab.value]?.result"
                        :added="calculations[tab.value]?.added"
                        class="lg:col-span-5"
                        @add="add(tab.value)"
                    />
                </div>
            </template>
        </UTabs>
        <InterestCalculatorHistory
            :entries="history.entries.value"
            @rename="history.rename"
            @remove="history.remove"
            @clear="history.clear"
        />
    </div>
</template>
