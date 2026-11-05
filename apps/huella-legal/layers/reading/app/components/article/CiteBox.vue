<template>
    <section
        v-if="citation"
        :aria-labelledby="headingId"
        class="rounded-sm border border-default bg-muted p-5 md:p-6"
    >
        <h2 :id="headingId" class="font-serif text-xl text-highlighted">
            {{ $t("citeBox.title") }}
        </h2>
        <UTabs
            v-if="citations.length > 1"
            v-model="tab"
            :items="tabs"
            variant="link"
            :ui="{ list: 'print:hidden', trigger: 'text-sm' }"
            class="mt-3"
        >
            <template #content="{ item }">
                <p class="mt-4 font-serif text-citation wrap-break-word text-toned">
                    {{ item.text }}
                </p>
            </template>
        </UTabs>
        <p v-else class="mt-4 font-serif text-citation wrap-break-word text-toned">
            {{ citation.text }}
        </p>
        <ClientOnly>
            <UButton
                v-if="canCopy"
                variant="outline"
                color="neutral"
                icon="i-lucide-copy"
                :label="$t('citeBox.copy')"
                class="mt-4 print:hidden"
                @click="copy(citation)"
            />
        </ClientOnly>
    </section>
</template>

<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

interface Props {
    citations: Citation[];
}

const props = defineProps<Props>();

const { t } = useI18n();
const toast = useToast();
const headingId = useId();
const { copy: copyText, isSupported: canCopy } = useClipboard();
const track = useTrack();
const tab = ref<string>("0");

const tabs = computed(() =>
    props.citations.map(({ style, text }, index) => ({ label: style, value: String(index), text })),
);
const citation = computed<Citation | undefined>(
    () => props.citations[Number(tab.value)] ?? props.citations[0],
);

const copy = async ({ style, text }: Citation): Promise<void> => {
    await copyText(text);
    track("citation_copy", { style });
    toast.add({ title: t("citeBox.copied"), icon: "i-lucide-check" });
};
</script>
