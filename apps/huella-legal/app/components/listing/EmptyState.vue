<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

interface Props {
    subject: string
    publishTo: RouteLocationRaw
    browseTo: RouteLocationRaw
}

defineProps<Props>();

const titleId = useId();
</script>

<template>
    <section
        :aria-labelledby="titleId"
        class="flex flex-col items-start gap-4 rounded-sm border border-dashed border-(--ui-border-accented) bg-ivory-50 px-5 py-10 md:px-12"
    >
        <UIcon
            name="i-lucide-feather"
            class="size-7 text-huella-teal-500"
        />
        <h2
            :id="titleId"
            class="font-serif text-h3 text-highlighted text-balance"
        >
            {{ $t("emptyState.title", { subject }) }}
        </h2>
        <p class="max-w-md font-serif text-base leading-relaxed text-toned">
            {{ $t("emptyState.description") }}
        </p>
        <div class="flex flex-col gap-3 self-stretch sm:flex-row sm:self-start">
            <UButton
                :label="$t('emptyState.publish')"
                :to="publishTo"
                class="justify-center"
            />
            <UButton
                variant="outline"
                color="neutral"
                :label="$t('emptyState.browse')"
                :to="browseTo"
                class="justify-center"
            />
        </div>
    </section>
</template>
