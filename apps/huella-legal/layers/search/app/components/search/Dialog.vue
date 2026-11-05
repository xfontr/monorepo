<template>
    <UButton
        :to="{ name: 'search' }"
        square
        variant="ghost"
        color="neutral"
        icon="i-lucide-search"
        :aria-label="$t('searchDialog.open')"
        aria-haspopup="dialog"
        @click="show"
    />
    <LazyUModal
        v-if="used"
        v-model:open="open"
        :title="$t('searchDialog.title')"
        :description="$t('searchDialog.description')"
        :ui="{
            content:
                'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-none max-sm:rounded-none max-sm:shadow-none max-sm:ring-0 sm:top-[10vh] sm:max-h-[78vh] sm:max-w-2xl sm:translate-y-0',
        }"
    >
        <template #content>
            <LazySearchPalette @close="open = false" />
        </template>
    </LazyUModal>
</template>

<script setup lang="ts">
const router = useRouter();
const open = ref<boolean>(false);
// A modal mounted from the start puts Reka's dialog code in the layout chunk every page loads
const used = ref<boolean>(false);

const show = (event?: Event) => {
    event?.preventDefault();
    used.value = true;
    open.value = true;
};

defineShortcuts({ "/": () => show(), meta_k: () => show() });

const cleanUp = router.afterEach(() => {
    open.value = false;
});

onUnmounted(cleanUp);
</script>
