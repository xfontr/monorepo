<template>
    <div aria-hidden="true" class="sr-only">
        <label :for="id">{{ $t("formHoneypot.label") }}</label>
        <input :id v-model="honeypot" type="text" name="sitio" tabindex="-1" autocomplete="off" />
    </div>
</template>

<script setup lang="ts">
const honeypot = defineModel<string>({ required: true });

const id = useId();
</script>
