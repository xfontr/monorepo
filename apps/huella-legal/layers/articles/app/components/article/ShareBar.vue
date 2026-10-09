<script setup lang="ts">
import { useClipboard, useShare } from "@vueuse/core";
import type { RouteLocationRaw } from "vue-router";

interface Props {
    title: string;
    url: string;
    citeTo?: RouteLocationRaw;
}

const props = defineProps<Props>();

const { t } = useI18n();
const toast = useToast();
const { share: nativeShare, isSupported: canNativeShare } = useShare();
const { copy, isSupported: canCopy } = useClipboard();

const share = async (): Promise<void> => {
    if (canNativeShare.value) {
        try {
            await nativeShare({ title: props.title, url: props.url });
            return;
        } catch (error) {
            // Dismissing the sheet is the reader's choice
            if (error instanceof DOMException && error.name === "AbortError") return;
        }
    }

    if (!canCopy.value) return;

    await copy(props.url);
    toast.add({ title: t("shareBar.linkCopied"), icon: "i-lucide-check" });
};

const print = (): void => {
    window.print();
};
</script>

<template>
    <div class="flex items-center print:hidden">
        <UButton
            v-if="citeTo"
            variant="ghost"
            color="neutral"
            icon="i-lucide-quote"
            :label="$t('shareBar.cite')"
            :to="citeTo"
            class="px-3"
        />
        <UButton
            v-if="canNativeShare || canCopy"
            square
            variant="ghost"
            color="neutral"
            icon="i-lucide-share"
            :aria-label="$t('shareBar.share')"
            @click="share"
        />
        <UButton
            square
            variant="ghost"
            color="neutral"
            icon="i-lucide-printer"
            :aria-label="$t('shareBar.print')"
            @click="print"
        />
    </div>
</template>
