<script setup lang="ts">
import type { Asset } from "@monorepo/content";

interface Props {
    lead: string;
    html: string;
    image?: Asset;
}

defineProps<Props>();
</script>

<template>
    <div>
        <!-- eslint-disable vue/no-v-html -- sanitised by the articles layer's body mapper -->
        <div class="hl-prose max-w-measure" v-html="lead" />
        <figure v-if="image" class="my-10 max-w-measure md:my-11">
            <img
                :src="image.url"
                :alt="image.alt"
                :width="image.width"
                :height="image.height"
                class="aspect-video w-full rounded-xs object-cover"
            />
        </figure>
        <div class="hl-prose mt-[1.25em] max-w-measure" v-html="html" />
        <!-- eslint-enable vue/no-v-html -->
    </div>
</template>
