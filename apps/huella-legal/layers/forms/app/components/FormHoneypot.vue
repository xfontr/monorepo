<script setup lang="ts">
const website = defineModel<string>({ required: true });

const id = useId();
</script>

<template>
    <div aria-hidden="true" class="sr-only">
        <label :for="id">{{ $t("formHoneypot.label") }}</label>
        <input :id v-model="website" type="text" name="sitio" tabindex="-1" autocomplete="off" />
    </div>
</template>
