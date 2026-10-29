<script setup lang="ts">
interface Props {
    kicker: string;
    title: string;
    lead?: string;
}

defineProps<Props>();
</script>

<template>
    <div>
        <BaseKicker>{{ kicker }}</BaseKicker>
        <h1
            class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted text-balance md:text-[3.5rem]"
        >
            {{ title }}
        </h1>
        <p v-if="lead" class="mt-4 max-w-measure font-serif text-standfirst text-toned text-pretty">
            {{ lead }}
        </p>
    </div>
</template>
