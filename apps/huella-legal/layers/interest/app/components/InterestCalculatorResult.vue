<template>
    <section :aria-label="$t('interestCalculator.result.label')">
        <div role="status">
            <dl
                v-if="result && amounts"
                class="flex flex-col gap-4 border-t-2 border-inverted pt-4"
            >
                <div>
                    <dt class="font-sans text-sm text-toned">
                        {{ $t("interestCalculator.result.days", result.days) }}
                    </dt>
                    <dd class="font-serif text-section text-highlighted">{{ result.days }}</dd>
                </div>
                <div>
                    <dt class="font-sans text-sm text-toned">
                        {{ $t("interestCalculator.result.interest") }}
                    </dt>
                    <dd class="font-serif text-section text-highlighted">
                        {{ amounts.interest }}
                    </dd>
                </div>
                <div>
                    <dt class="font-sans text-sm text-toned">
                        {{ $t("interestCalculator.result.total") }}
                    </dt>
                    <dd class="font-serif text-h2 text-highlighted">{{ amounts.total }}</dd>
                </div>
            </dl>
            <p v-else class="max-w-measure font-serif text-standfirst text-pretty text-toned">
                {{ $t("interestCalculator.result.empty") }}
            </p>
        </div>
        <p
            v-if="result && added"
            ref="confirmation"
            tabindex="-1"
            class="mt-6 flex min-h-11 items-center gap-2 font-sans text-sm text-highlighted outline-none"
        >
            <UIcon name="i-lucide-check" class="size-4 text-primary" aria-hidden="true" />
            {{ $t("interestCalculator.result.added") }}
        </p>
        <UButton
            v-if="result && !added"
            variant="outline"
            color="neutral"
            icon="i-lucide-plus"
            :label="$t('interestCalculator.result.add')"
            class="mt-6"
            @click="$emit('add')"
        />
        <p class="mt-6 max-w-measure font-sans text-sm text-pretty text-toned">
            {{ $t("interestCalculator.disclaimer") }}
        </p>
    </section>
</template>

<script setup lang="ts">
import type { InterestResult } from "../types/InterestResult";

interface Props {
    result?: InterestResult;
    added?: boolean;
}

const props = defineProps<Props>();

defineEmits<{ add: [] }>();

// The button that was focused unmounts once the row is added, so focus lands on what replaced it
const confirmation = useTemplateRef("confirmation");

watch(confirmation, (element) => element?.focus());

const { locale } = useI18n();

const amounts = computed(() => {
    if (!props.result) return undefined;

    const euros = new Intl.NumberFormat(locale.value, { style: "currency", currency: "EUR" });

    return {
        interest: euros.format(props.result.interestCents / 100),
        total: euros.format(props.result.totalCents / 100),
    };
});
</script>
