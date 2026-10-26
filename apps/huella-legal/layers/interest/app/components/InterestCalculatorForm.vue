<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui";
import FormErrorSummary from "~/components/form/FormErrorSummary.vue";
import { type InterestForm, interestFormSchema } from "../schemas/interestForm";
import type { InterestInput } from "../types/InterestInput";
import type { InterestRate } from "../types/InterestRate";

interface FormState {
    principal: number | undefined;
    rate: InterestRate;
    customPercent: number | undefined;
    from: string;
    to: string;
}

const emit = defineEmits<{ submit: [input: InterestInput]; edit: [] }>();

const { t, locale } = useI18n();

const schema = interestFormSchema((issue) => t(`interestCalculator.errors.${issue}`));

const state = reactive<FormState>({
    principal: undefined,
    rate: "legal",
    customPercent: undefined,
    from: "",
    to: "",
});

const errors = ref<{ id: string; label: string; message: string }[]>([]);

const rates = computed(() => {
    const percent = new Intl.NumberFormat(locale.value, { maximumFractionDigits: 4 });

    return [
        ...(Object.keys(INTEREST_RATES) as (keyof typeof INTEREST_RATES)[]).map((value) => ({
            value,
            label: t(`interestCalculator.rate.options.${value}`, {
                percent: percent.format(INTEREST_RATES[value]),
            }),
        })),
        { value: "custom", label: t("interestCalculator.rate.options.custom") },
    ];
});

const onError = (event: FormErrorEvent) => {
    errors.value = event.errors.flatMap(({ id, name, message }) =>
        id && name ? [{ id, label: t(`interestCalculator.${name}.label`), message }] : [],
    );
};

const onSubmit = ({ data }: FormSubmitEvent<InterestForm>) => {
    errors.value = [];
    emit("submit", {
        principal: data.principal,
        ratePercent: data.rate === "custom" ? data.customPercent : INTEREST_RATES[data.rate],
        from: data.from,
        to: data.to,
    });
};

watch(state, () => emit("edit"), { deep: true });
</script>

<template>
    <UForm
        :schema
        :state
        novalidate
        class="flex flex-col gap-6"
        @submit="onSubmit"
        @error="onError"
    >
        <FormErrorSummary :errors />
        <UFormField
            name="principal"
            :label="$t('interestCalculator.principal.label')"
            :hint="$t('interestCalculator.principal.hint')"
        >
            <UInput
                v-model.number="state.principal"
                type="number"
                inputmode="decimal"
                min="0"
                step="0.01"
                class="w-full"
            />
        </UFormField>

        <UFormField name="rate" :label="$t('interestCalculator.rate.label')">
            <URadioGroup v-model="state.rate" :items="rates" />
        </UFormField>

        <UFormField
            v-if="state.rate === 'custom'"
            name="customPercent"
            :label="$t('interestCalculator.customPercent.label')"
            :hint="$t('interestCalculator.customPercent.hint')"
        >
            <UInput
                v-model.number="state.customPercent"
                type="number"
                inputmode="decimal"
                min="0"
                max="100"
                step="0.0001"
                class="w-full"
            />
        </UFormField>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <UFormField name="from" :label="$t('interestCalculator.from.label')">
                <UInput v-model="state.from" type="date" class="w-full" />
            </UFormField>
            <UFormField name="to" :label="$t('interestCalculator.to.label')">
                <UInput v-model="state.to" type="date" class="w-full" />
            </UFormField>
        </div>

        <UButton
            type="submit"
            :label="$t('interestCalculator.submit')"
            class="justify-center sm:self-start"
        />
    </UForm>
</template>
