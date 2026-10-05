<script setup lang="ts">
interface Props {
    title: string
    icon?: string
}

withDefaults(defineProps<Props>(), {
    icon: "i-lucide-wifi-off",
});
</script>

<template>
    <UAlert
        role="alert"
        color="error"
        variant="subtle"
        :icon
        :title
    >
        <template
            v-if="$slots.default"
            #description
        >
            <slot />
        </template>
    </UAlert>
</template>
