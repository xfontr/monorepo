<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

interface Props {
    citations: Citation[]
}

const props = defineProps<Props>();

const { t } = useI18n();
const toast = useToast();
const headingId = useId();
const { copy: copyText, isSupported: canCopy } = useClipboard();
const tab = ref<string>("0");

const tabs = computed(() => props.citations.map(({ style, text }, index) => ({ label: style, value: String(index), text })));
const citation = computed<Citation | undefined>(() => props.citations[Number(tab.value)] ?? props.citations[0]);

async function copy(text: string): Promise<void> {
    await copyText(text);
    toast.add({ title: t("citeBox.copied"), icon: "i-lucide-check" });
}
</script>

<template>
    <section
        v-if="citation"
        :aria-labelledby="headingId"
        class="rounded-sm border border-default bg-ivory-50 p-5 md:p-6"
    >
        <h2
            :id="headingId"
            class="font-serif text-xl text-highlighted"
        >
            {{ $t("citeBox.title") }}
        </h2>
        <UTabs
            v-if="citations.length > 1"
            v-model="tab"
            :items="tabs"
            variant="link"
            :ui="{ list: 'gap-6 border-b border-default px-0 print:hidden', trigger: 'min-h-11 min-w-11 px-0 font-sans text-sm font-semibold data-[state=active]:text-highlighted', indicator: 'bg-huella-slate-900 h-0.5' }"
            class="mt-3"
        >
            <template #content="{ item }">
                <p class="mt-4 font-serif text-citation break-words text-toned">
                    {{ item.text }}
                </p>
            </template>
        </UTabs>
        <p
            v-else
            class="mt-4 font-serif text-citation break-words text-toned"
        >
            {{ citation.text }}
        </p>
        <UButton
            v-if="canCopy"
            variant="outline"
            color="neutral"
            icon="i-lucide-copy"
            :label="$t('citeBox.copy')"
            class="mt-4 print:hidden"
            @click="copy(citation.text)"
        />
    </section>
</template>
