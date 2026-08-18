<script lang="ts" setup>
const boom = computed<string>(() => {
    throw new Error("Chaos: component threw while rendering");
});
</script>

<template>
    <p>{{ boom }}</p>
</template>
