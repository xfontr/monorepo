<script lang="ts" setup>
import type { NuxtError } from "#app";

interface Props {
    error: NuxtError<{ message?: string }>
}

const { error } = defineProps<Props>();
</script>

<template>
    <section class="error__debug">
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
</template>
