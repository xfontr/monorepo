<script setup lang="ts">
import { useClipboard, useShare } from "@vueuse/core";

interface Props {
    title: string
    url: string
    citeTo?: string
}

const props = withDefaults(defineProps<Props>(), { citeTo: undefined });

const { t } = useI18n();
const toast = useToast();
const { share: nativeShare, isSupported: canNativeShare } = useShare();
const { copy, isSupported: canCopy } = useClipboard();

async function tryNativeShare(): Promise<boolean> {
    if (!canNativeShare.value) return Promise.resolve(false);

    try {
        await nativeShare({ title: props.title, url: props.url });
        return true;
    }
    catch (error) {
        // Dismissing the sheet is the reader's choice
        if (error instanceof DOMException && error.name === "AbortError") return true;
    }

    return false;
}

async function share(): Promise<void> {
    const success = await tryNativeShare();
    if (success) return;

    await copy(props.url);
    toast.add({ title: t("shareBar.linkCopied"), icon: "i-lucide-check" });
}

function print(): void {
    window.print();
}
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
