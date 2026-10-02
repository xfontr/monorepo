<script lang="ts" setup>
import type { NuxtError } from "#app";

interface Props {
    error: NuxtError<{ message?: string }>
}

const { error } = defineProps<Props>();

const isDev = import.meta.dev;

useHead({
    title: `Error ${error.status}`,
    meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "robots", content: "noindex" },
    ],
});
</script>

<template>
    <main class="error">
        <span class="error__status">
            {{ error.status }}
        </span>

        <h1 class="error__message">
            {{ error.message }}
        </h1>

        <ErrorDebug
            v-if="isDev"
            :error
        />
    </main>
</template>
