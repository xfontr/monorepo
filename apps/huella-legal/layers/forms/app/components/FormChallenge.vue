<script setup lang="ts">
import { until } from "@vueuse/core";

const TOKEN_TIMEOUT_MS = 30_000;

const widget = useTemplateRef("widget");

const armed = ref<boolean>(false);
const token = ref<string>();

const arm = (): void => {
    armed.value = true;
};

const challenge: Challenge = async (send) => {
    arm();

    const ready = await until(token).toBeTruthy({
        timeout: TOKEN_TIMEOUT_MS,
        throwOnTimeout: true,
    });

    token.value = undefined;

    try {
        return await send(ready);
    } finally {
        widget.value?.reset();
    }
};
</script>

<template>
    <div class="flex flex-col gap-3" @focusin.once="arm">
        <slot :challenge />
        <NuxtTurnstile
            v-if="armed"
            ref="widget"
            v-model="token"
            :options="{ appearance: 'interaction-only' }"
            class="empty:hidden"
        />
    </div>
</template>
