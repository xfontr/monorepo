<script setup lang="ts">
import type { InterestInput } from "../types/InterestInput";
import type { InterestResult } from "../types/InterestResult";
import InterestCalculatorForm from "./InterestCalculatorForm.vue";
import InterestCalculatorResult from "./InterestCalculatorResult.vue";

const result = ref<InterestResult>();

const onSubmit = (input: InterestInput) => {
    result.value = calculateInterest(input);
};
</script>

<template>
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-12">
        <InterestCalculatorForm
            class="lg:col-span-7"
            @submit="onSubmit"
            @edit="result = undefined"
        />
        <InterestCalculatorResult :result class="lg:col-span-5" />
    </div>
</template>
