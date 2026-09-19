<script setup lang="ts">
import { REPO_SCHEME } from "#shared/docLinks.ts";

const props = defineProps<{ href?: string, target?: string }>();

const { public: { repoUrl } } = useRuntimeConfig();

// Everything else `remarkDocLinks` already resolved to a route; only the forge's own URL is runtime
// config, so only this half is left to the renderer.
const file = computed(() => (props.href?.startsWith(REPO_SCHEME) ? props.href.slice(REPO_SCHEME.length) : null));
</script>

<template>
    <NuxtLink
        v-if="file && repoUrl"
        :to="`${repoUrl}/blob/master/${file}`"
        target="_blank"
        external
    >
        <slot />
    </NuxtLink>

    <span v-else-if="file">
        <slot />
    </span>

    <NuxtLink
        v-else
        :href="props.href"
        :target="props.target"
    >
        <slot />
    </NuxtLink>
</template>
