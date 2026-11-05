<template>
    <div>
        <BaseKicker>{{ kicker }}</BaseKicker>
        <h1 class="mt-2 font-serif text-title text-balance text-highlighted md:text-title-lg">
            {{ title }}
        </h1>
        <p v-if="lead" class="mt-4 max-w-measure font-serif text-standfirst text-pretty text-toned">
            {{ lead }}
        </p>
    </div>
</template>

<script setup lang="ts">
interface Props {
    kicker: string;
    title: string;
    lead?: string;
}

defineProps<Props>();
</script>
