<script lang="ts" setup>
import type { NuxtError } from "#app";

const { error } = defineProps<{ error: NuxtError<{ message?: string }> }>();

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

        <section
            v-if="isDev"
            class="error__debug"
        >
            <details
                v-if="error.data?.message"
                open
            >
                <summary>Message</summary>
                <p>{{ error.data.message }}</p>
            </details>

            <details v-if="error.data">
                <summary>Data</summary>
                <p>{{ error.data }}</p>
            </details>

            <details>
                <summary>Stack</summary>
                <pre>{{ error.stack }}</pre>
            </details>
        </section>
    </main>
</template>
