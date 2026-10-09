<script setup lang="ts">
interface Props {
    rows?: number;
}

withDefaults(defineProps<Props>(), {
    rows: 3,
});
</script>

<template>
    <div>
        <p class="sr-only">
            {{ $t("skeletonList.loading") }}
        </p>
        <ul class="flex flex-col divide-y divide-(--ui-border-muted)" aria-hidden="true">
            <li v-for="row in rows" :key="row" class="flex gap-6 py-5 first:pt-0">
                <div class="flex flex-1 flex-col gap-3">
                    <USkeleton class="h-3 w-28" />
                    <USkeleton class="h-6 w-11/12" />
                    <USkeleton class="h-6 w-3/5" />
                    <USkeleton class="h-3 w-48" />
                </div>
                <USkeleton class="hidden aspect-[4/3] w-32 sm:block" />
            </li>
        </ul>
    </div>
</template>
