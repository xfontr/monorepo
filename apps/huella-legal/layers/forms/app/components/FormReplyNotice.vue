<template>
    <UAlert
        v-if="until"
        color="secondary"
        variant="subtle"
        icon="i-lucide-clock"
        :title="$t('formReplyNotice.title')"
        :description="$t('formReplyNotice.description')"
    />
</template>

<script setup lang="ts">
import { useReplyPace } from "../composables/useReplyPace";

const until = useReplyPace();
</script>
