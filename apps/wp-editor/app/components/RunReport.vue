<script setup lang="ts">
import type { BadgeProps } from "@nuxt/ui";
import type { ItemKey, RunReport } from "#shared/types.ts";

interface Props {
    report: RunReport;
}

const props = defineProps<Props>();
const emit = defineEmits<{ select: [key: ItemKey] }>();

const heading = computed(
    () => `${runLabel(props.report)} · ${new Date(props.report.at).toLocaleString()}`,
);

const sections = computed(() => {
    const { kind, ok, refused, failed, warnings } = props.report;
    const okLabel = kind === "apply" ? "Applied" : "Would apply";

    return [
        { label: "Failed", color: "error", entries: failed },
        { label: "Refused", color: "warning", entries: refused },
        { label: "Warnings", color: "info", entries: warnings },
        { label: okLabel, color: "success", entries: ok.map((key) => ({ key, reason: "" })) },
    ] satisfies { label: string; color: BadgeProps["color"]; entries: unknown[] }[];
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">{{ heading }}</p>

        <div class="flex flex-wrap gap-2">
            <UBadge
                v-for="section in sections"
                :key="section.label"
                :color="section.color"
                variant="subtle"
                :label="`${section.label} ${section.entries.length}`"
            />
        </div>

        <UAlert
            v-if="report.stopped"
            color="error"
            variant="subtle"
            icon="i-lucide-octagon-x"
            title="Stopped early"
            :description="`${report.stopped} Run it again once WordPress answers; only pending articles are retried.`"
        />

        <UAlert
            v-if="report.incomplete"
            color="warning"
            variant="subtle"
            icon="i-lucide-circle-pause"
            title="This run didn't finish"
            description="It stopped partway, or is still going, so it lists only the articles it reached."
        />

        <UAlert
            v-if="report.blocker"
            color="neutral"
            variant="subtle"
            icon="i-lucide-lock"
            title="Bulk apply would still be blocked"
            :description="report.blocker"
        />

        <template v-for="section in sections" :key="section.label">
            <section v-if="section.entries.length > 0">
                <h3 class="mb-1 text-sm font-semibold">{{ section.label }}</h3>
                <ul class="divide-y divide-default rounded-md border border-default text-sm">
                    <li
                        v-for="entry in section.entries"
                        :key="entry.key"
                        class="flex gap-3 px-3 py-1.5"
                    >
                        <UButton
                            :label="entry.key"
                            variant="link"
                            size="xs"
                            class="shrink-0 p-0"
                            @click="emit('select', entry.key)"
                        />
                        <span class="text-muted">{{ entry.reason }}</span>
                    </li>
                </ul>
            </section>
        </template>
    </div>
</template>
