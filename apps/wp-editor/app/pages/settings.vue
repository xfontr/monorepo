<template>
    <UDashboardPanel id="settings">
        <template #header>
            <UDashboardNavbar title="Settings" icon="i-lucide-settings-2">
                <template #right>
                    <UButton
                        v-if="draft"
                        icon="i-lucide-save"
                        label="Save"
                        :disabled="!dirty"
                        :loading="saving"
                        @click="save"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <UAlert
                v-if="error"
                color="error"
                variant="subtle"
                icon="i-lucide-triangle-alert"
                title="The store can't be read"
                :description="errorMessage"
            />

            <div v-else-if="draft" class="flex w-full max-w-2xl flex-col gap-8">
                <section class="flex flex-col gap-3">
                    <h2 class="font-semibold">WordPress</h2>
                    <UPageCard
                        variant="subtle"
                        :ui="{ container: 'gap-y-0 divide-y divide-default' }"
                    >
                        <UFormField
                            label="Dry-run mode"
                            description="Check every write against WordPress without saving it."
                            orientation="horizontal"
                            class="pb-4"
                        >
                            <USwitch v-model="draft.dryRun" />
                        </UFormField>

                        <UFormField
                            label="Pause between articles"
                            :description="`Milliseconds a bulk run waits before the next article, so the host doesn't block us. ${DEFAULT_SETTINGS.pauseMs} is the recommended value; raise it after a block.`"
                            orientation="horizontal"
                            class="pt-4"
                        >
                            <UInputNumber
                                v-model="draft.pauseMs"
                                :min="0"
                                :max="MAX_PAUSE_MS"
                                :step="100"
                                class="w-48"
                            />
                        </UFormField>
                    </UPageCard>
                </section>

                <section class="flex flex-col gap-3">
                    <h2 class="font-semibold">Bulk apply</h2>
                    <UPageCard
                        variant="subtle"
                        :ui="{ container: 'gap-y-0 divide-y divide-default' }"
                    >
                        <UFormField
                            label="Require review"
                            description="Which pending articles must be reviewed first."
                            orientation="horizontal"
                            class="pb-4"
                        >
                            <USelect v-model="draft.reviewGate" :items="GATES" class="w-48" />
                        </UFormField>

                        <UFormField
                            v-if="draft.reviewGate !== 'none'"
                            label="Reviewed means"
                            description="Opened at least once, or explicitly confirmed."
                            orientation="horizontal"
                            class="py-4"
                        >
                            <USelect
                                v-model="draft.bulkApplyMinLevel"
                                :items="LEVELS"
                                class="w-48"
                            />
                        </UFormField>

                        <UFormField
                            label="Require a dry run"
                            description="A dry run must clear the current proposals first."
                            orientation="horizontal"
                            class="pt-4"
                        >
                            <USwitch v-model="draft.requireDryRun" />
                        </UFormField>
                    </UPageCard>
                </section>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";
import type { Settings } from "#shared/types.ts";
import { DEFAULT_SETTINGS, MAX_PAUSE_MS } from "#shared/types.ts";

const toast = useToast();
const { data: settings, error } = await useFetch<Settings>("/api/settings");
const errorMessage = computed(() => (error.value ? messageOf(error.value) : ""));

const draft = ref<Settings | null>(settings.value ? { ...settings.value } : null);
const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(settings.value));
const saving = ref(false);

const GATES = [
    { value: "all", label: "All articles" },
    { value: "requested", label: "Flagged for review" },
    { value: "none", label: "None" },
] satisfies SelectItem[];

const LEVELS = [
    { value: "seen", label: "Seen" },
    { value: "confirmed", label: "Confirmed" },
] satisfies SelectItem[];

const save = async () => {
    saving.value = true;

    try {
        settings.value = await $fetch<Settings>("/api/settings", {
            method: "PUT",
            body: draft.value,
        });
        draft.value = { ...settings.value };
        toast.add({ title: "Saved", color: "success", icon: "i-lucide-check" });
    } catch (saveError) {
        toast.add({ title: "Not saved", description: messageOf(saveError), color: "error" });
    } finally {
        saving.value = false;
    }
};
</script>
