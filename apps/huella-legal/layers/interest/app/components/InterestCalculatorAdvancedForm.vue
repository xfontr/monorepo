<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui";
import { useErrorSummary } from "#layers/forms/app/composables/useErrorSummary";
import {
    type InterestAdvancedForm,
    interestAdvancedFormSchema,
} from "../schemas/interestAdvancedForm";
import type { InterestInput } from "../types/InterestInput";
import type { InterestRate } from "../types/InterestRate";

type DatePart = number | "";

interface FormState {
    concept: string;
    principal: string;
    rate: InterestRate;
    customPercent: string;
    fromDay: DatePart;
    fromMonth: DatePart;
    fromYear: DatePart;
    toDay: DatePart;
    toMonth: DatePart;
    toYear: DatePart;
}

const emit = defineEmits<{ submit: [input: InterestInput & { concept: string }]; edit: [] }>();
const PARTS = [
    { key: "Day", label: "day", min: 1, max: 31 },
    { key: "Month", label: "month", min: 1, max: 12 },
    { key: "Year", label: "year", min: 1900, max: 2100 },
] as const;

const DATES = (["from", "to"] as const).map((date) => ({
    date,
    errorPattern: new RegExp(`^${date}Day$`),
    parts: PARTS.map((part) => ({ ...part, name: `${date}${part.key}` as const })),
}));

const { t } = useI18n();

const form = useTemplateRef("form");

const schema = interestAdvancedFormSchema((issue) => t(`interestCalculator.errors.${issue}`));

const state = reactive<FormState>({
    concept: "",
    principal: "",
    rate: "legal",
    customPercent: "",
    fromDay: "",
    fromMonth: "",
    fromYear: "",
    toDay: "",
    toMonth: "",
    toYear: "",
});

// A date's issue sits on its day field, which the summary names after the whole date
const { errors, list } = useErrorSummary((field) =>
    t(`interestCalculator.${field.replace(/(Day|Month|Year)$/, "")}.label`),
);

const rates = useInterestRateOptions(["legal", "judicial", "custom"]);

// Nothing validates before the first submit, since an error rendered on blur moves the button
// under the pointer; once one has failed, every edit revalidates the whole form
const failed = ref(false);

const onError = (event: FormErrorEvent): void => {
    failed.value = true;
    list(event.errors);
};

const onSubmit = ({ data }: FormSubmitEvent<InterestAdvancedForm>) => {
    failed.value = false;
    list([]);
    emit("submit", {
        concept: data.concept,
        principal: data.principal,
        ratePercent: data.rate === "custom" ? data.customPercent : INTEREST_RATES[data.rate],
        from: data.from,
        to: data.to,
    });
};

watch(
    state,
    () => {
        emit("edit");
        if (failed.value) form.value?.validate({ silent: true });
    },
    { deep: true },
);

watch(
    () => form.value?.errors,
    (current) => {
        if (failed.value) list(current ?? []);
    },
);
</script>

<template>
    <UForm
        ref="form"
        :schema
        :state
        :validate-on="[]"
        novalidate
        class="flex flex-col gap-6"
        @submit="onSubmit"
        @error="onError"
    >
        <FormErrorSummary :errors />
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
                v-model="state.customPercent"
                inputmode="decimal"
                autocomplete="off"
                class="w-full sm:w-48"
            />
        </UFormField>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <fieldset v-for="{ date, errorPattern, parts } in DATES" :key="date" class="min-w-0">
                <legend class="mb-2 font-sans text-sm font-medium text-highlighted">
                    {{ $t(`interestCalculator.advanced.${date}.legend`) }}
                </legend>
                <div class="grid grid-cols-[1fr_1fr_1.5fr] gap-3">
                    <!-- Each part carries its date's issue for screen readers; it shows once below -->
                    <UFormField
                        v-for="part in parts"
                        :key="part.name"
                        :name="part.name"
                        :error-pattern
                        :label="$t(`interestCalculator.date.${part.label}`)"
                        :ui="{ error: 'sr-only' }"
                    >
                        <UInput
                            v-model.number="state[part.name]"
                            type="number"
                            inputmode="numeric"
                            :min="part.min"
                            :max="part.max"
                            step="1"
                            class="w-full"
                        />
                    </UFormField>
                </div>
                <p
                    v-if="form?.getErrors(`${date}Day`)[0]"
                    aria-hidden="true"
                    class="mt-2 text-sm text-error"
                >
                    {{ form.getErrors(`${date}Day`)[0]?.message }}
                </p>
            </fieldset>
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <UFormField
                name="principal"
                :label="$t('interestCalculator.principal.label')"
                :hint="$t('interestCalculator.principal.hint')"
            >
                <UInput
                    v-model="state.principal"
                    inputmode="decimal"
                    autocomplete="off"
                    class="w-full"
                />
            </UFormField>
            <UFormField
                name="concept"
                :label="$t('interestCalculator.concept.label')"
                :hint="$t('interestCalculator.concept.hint')"
            >
                <UInput v-model="state.concept" maxlength="120" class="w-full" />
            </UFormField>
        </div>

        <UButton
            type="submit"
            :label="$t('interestCalculator.submit')"
            class="justify-center sm:self-start"
        />
    </UForm>
</template>
