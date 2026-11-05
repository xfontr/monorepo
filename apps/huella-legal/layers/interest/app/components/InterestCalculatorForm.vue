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

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <UFormField name="from" :label="$t('interestCalculator.from.label')">
                <UInput v-model="state.from" type="date" class="w-full" />
            </UFormField>
            <UFormField name="to" :label="$t('interestCalculator.to.label')">
                <UInput v-model="state.to" type="date" class="w-full" />
            </UFormField>
        </div>

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

        <UButton
            type="submit"
            :label="$t('interestCalculator.submit')"
            class="justify-center sm:self-start"
        />
    </UForm>
</template>

<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui";
import { useErrorSummary } from "#layers/forms/app/composables/useErrorSummary";
import { type InterestForm, interestFormSchema } from "../schemas/interestForm";
import type { InterestInput } from "../types/InterestInput";

interface FormState {
    principal: string;
    rate: InterestForm["rate"];
    from: string;
    to: string;
}

const emit = defineEmits<{ submit: [input: InterestInput]; edit: [] }>();

const { t } = useI18n();

const form = useTemplateRef("form");

const schema = interestFormSchema((issue) => t(`interestCalculator.errors.${issue}`));

const state = reactive<FormState>({
    principal: "",
    rate: "legal",
    from: "",
    to: "",
});

const { errors, list } = useErrorSummary((field) => t(`interestCalculator.${field}.label`));

const rates = useInterestRateOptions(["legal", "judicial"]);

// Nothing validates before the first submit, since an error rendered on blur moves the button
// under the pointer; once one has failed, every edit revalidates the whole form
const failed = ref(false);

const onError = (event: FormErrorEvent): void => {
    failed.value = true;
    list(event.errors);
};

const onSubmit = ({ data }: FormSubmitEvent<InterestForm>) => {
    failed.value = false;
    list([]);
    emit("submit", {
        principal: data.principal,
        ratePercent: INTEREST_RATES[data.rate],
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
