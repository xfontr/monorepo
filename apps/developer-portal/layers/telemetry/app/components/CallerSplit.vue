<template>
    <div class="flex h-2 w-24 gap-px overflow-hidden rounded-full bg-accented/40" :title>
        <span v-for="part in parts" :key="part.color" :style="part.style" />
    </div>
</template>

<script setup lang="ts">
interface Props {
    runs: number;
    agent: number;
}

const { runs, agent } = defineProps<Props>();

const title = computed(() => (runs ? `${agent} by agents, ${runs - agent} by people` : "No runs"));

const parts = computed(() =>
    [
        { color: "var(--usage-agent)", count: agent },
        { color: "var(--usage-person)", count: runs - agent },
    ]
        .filter((part) => part.count > 0)
        .map((part) => ({
            color: part.color,
            style: { width: `${percentOf(part.count, runs)}%`, background: part.color },
        })),
);
</script>
