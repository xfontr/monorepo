<script setup lang="ts">
import { es } from "@nuxt/ui/locale";
</script>

<template>
    <UApp :locale="es">
        <NuxtLoadingIndicator color="var(--ui-primary)" />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>
