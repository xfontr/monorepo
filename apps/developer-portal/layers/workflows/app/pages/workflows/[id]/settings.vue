<template>
    <UDashboardPanel id="workflow-settings">
        <template #header>
            <UDashboardNavbar :title="base ? `${base.project.title} · Settings` : 'Settings'">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <UButton
                        :to="`/workflows/${id}`"
                        label="Back to the project"
                        icon="i-lucide-arrow-left"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div v-if="!base" class="p-12 text-center text-sm text-muted">
                No project <code class="font-mono">{{ id }}</code> under
                <code class="font-mono">data/workflows/projects/</code>.
            </div>

            <div v-else class="mx-auto flex w-full max-w-4xl flex-col gap-10">
                <UAlert
                    v-if="!editable"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-lock"
                    title="Read-only here"
                    description="Settings write the project file, so they change only under pnpm dev developer-portal."
                />

                <section
                    v-for="section in SECTIONS"
                    :key="section.id"
                    class="grid gap-4 md:grid-cols-3"
                >
                    <header>
                        <h2 class="font-semibold">{{ section.title }}</h2>
                        <p class="text-sm text-muted">{{ section.hint }}</p>
                    </header>

                    <div class="md:col-span-2">
                        <div
                            v-if="section.id === 'general'"
                            class="flex flex-col gap-4 rounded-xl border border-default p-4"
                        >
                            <UFormField label="Title">
                                <UInput
                                    v-model="draft.title"
                                    :disabled="!editable"
                                    class="w-full"
                                />
                            </UFormField>
                            <UFormField label="Summary">
                                <UTextarea
                                    v-model="draft.summary"
                                    :rows="2"
                                    :disabled="!editable"
                                    class="w-full"
                                />
                            </UFormField>
                            <div class="grid gap-4 sm:grid-cols-2">
                                <UFormField
                                    label="Milestone"
                                    help="Rename it on GitHub too, or its tickets drop out of view"
                                >
                                    <UInput
                                        v-model="draft.milestone"
                                        :disabled="!editable"
                                        class="w-full"
                                    />
                                </UFormField>
                                <UFormField label="Area label">
                                    <UInput
                                        v-model="draft.area"
                                        :disabled="!editable"
                                        class="w-full"
                                    />
                                </UFormField>
                            </div>
                            <p class="text-xs text-muted">
                                Template: {{ base.template.title }}. It can't change, since the
                                switches and settled blocks belong to it.
                            </p>
                        </div>

                        <div v-else-if="section.id === 'features'" class="flex flex-col gap-6">
                            <FeaturePicker :features :editable @toggle="toggle" />
                            <RequiredBlocks :template="base.template" />
                        </div>

                        <TicketSizePicker
                            v-else-if="section.id === 'tickets'"
                            v-model="draft.ticketSize"
                            :editable="editable && !sizeFixed"
                        />
                    </div>
                </section>

                <div v-if="editable" class="flex items-center justify-end gap-3">
                    <span v-if="changed" class="text-sm text-muted">Unsaved changes</span>
                    <UButton
                        label="Discard"
                        color="neutral"
                        variant="ghost"
                        :disabled="!changed"
                        @click="discard"
                    />
                    <UButton label="Save" :disabled="!changed" :loading="saving" @click="save" />
                </div>

                <section
                    v-if="editable"
                    class="grid gap-4 border-t border-default pt-8 md:grid-cols-3"
                >
                    <header>
                        <h2 class="font-semibold">Remove</h2>
                        <p class="text-sm text-muted">Rarely needed.</p>
                    </header>
                    <div
                        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default p-4 md:col-span-2"
                    >
                        <p class="text-sm text-muted">
                            Removes the project file and its snapshot. Run
                            <code>pnpm workflow:drop {{ id }}</code> first to close the tickets
                            nobody started; the rest stay on GitHub.
                        </p>
                        <UButton
                            label="Delete project…"
                            icon="i-lucide-trash-2"
                            color="error"
                            variant="soft"
                            size="sm"
                            @click="deleting = true"
                        />
                    </div>
                </section>
            </div>

            <UModal
                v-model:open="leaving"
                title="Leave without saving?"
                description="The changes on this page aren't in the project file yet."
            >
                <template #footer>
                    <div class="flex w-full justify-end gap-2">
                        <UButton
                            label="Stay"
                            color="neutral"
                            variant="ghost"
                            @click="leaving = false"
                        />
                        <UButton label="Leave without saving" color="error" @click="leave" />
                    </div>
                </template>
            </UModal>

            <UModal
                v-model:open="deleting"
                :title="`Delete ${base?.project.title ?? id}?`"
                description="The project file and its snapshot go. Deleting closes nothing on GitHub."
            >
                <template #body>
                    <p v-if="dropping.close > 0" class="mb-4 text-sm text-muted">
                        As of the last sync, {{ dropping.close }} tickets are untouched and
                        {{ dropping.keep }} already started or closed. Close the untouched ones
                        first with <code>pnpm workflow:drop {{ id }} --yes</code>, since it reads
                        the milestone from this project file.
                    </p>
                    <UFormField :label="`Type ${id} to confirm`">
                        <UInput v-model="confirmation" class="w-full" autofocus />
                    </UFormField>
                </template>
                <template #footer>
                    <div class="flex w-full justify-end gap-2">
                        <UButton
                            label="Cancel"
                            color="neutral"
                            variant="ghost"
                            @click="deleting = false"
                        />
                        <UButton
                            label="Delete project"
                            icon="i-lucide-trash-2"
                            color="error"
                            :disabled="confirmation !== id"
                            @click="remove"
                        />
                    </div>
                </template>
            </UModal>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { featuresOf, ticketStatus, type TicketSize } from "#layers/workflows/shared/workflows.ts";

const SECTIONS = [
    {
        id: "general",
        title: "General",
        hint: "What the project is called and where its tickets live.",
    },
    {
        id: "features",
        title: "Features",
        hint: "Leaving one out takes its blocks out of the map; whatever needed them waits on what they needed.",
    },
    {
        id: "tickets",
        title: "Ticket size",
        hint: "How many blocks share a ticket when filed. It can't change once one is.",
    },
] as const;

const route = useRoute();
const id = computed(() => String(route.params.id));

const { data } = await useWorkflows();
const { editable, edit } = useWorkflowEdit();

const base = computed(() => data.value.projects.find(({ project }) => project.id === id.value));

useHead({ title: () => `${base.value?.project.title ?? "Workflow"} · Settings` });

const draft = reactive({
    title: "",
    summary: "",
    milestone: "",
    area: "",
    switches: {} as Record<string, boolean>,
    ticketSize: "block" as TicketSize,
});
const saved = computed(() => {
    const project = base.value?.project;
    return {
        title: project?.title ?? "",
        summary: project?.summary ?? "",
        milestone: project?.milestone ?? "",
        area: project?.area ?? "",
        ticketSize: project?.ticketSize ?? ("block" as TicketSize),
    };
});
const discard = () => Object.assign(draft, saved.value, { switches: {} });
watch(saved, discard, { immediate: true });

/** Only tickets filed from the map count; ones added by hand never fix the size. */
const sizeFixed = computed(() => (base.value?.tickets.filed ?? 0) > 0);

const features = computed(() => {
    if (!base.value) return [];
    const { project, template } = base.value;
    return featuresOf(
        { ...project, switches: { ...project.switches, ...draft.switches } },
        template,
    );
});

/** Only the switches that differ from the file go in the draft, so toggling back clears it. */
const toggle = (capability: string, on: boolean) => {
    const current = base.value?.features.find(({ id }) => id === capability)?.enabled;
    if (on === current) delete draft.switches[capability];
    else draft.switches[capability] = on;
};

const changed = computed(
    () =>
        Object.keys(draft.switches).length > 0 ||
        (Object.keys(saved.value) as (keyof typeof saved.value)[]).some(
            (key) => draft[key] !== saved.value[key],
        ),
);

const saving = ref(false);
const save = async () => {
    saving.value = true;
    await edit({ action: "settings", project: id.value, ...draft });
    saving.value = false;
};

const { leaving, leave } = useLeaveGuard(() => changed.value, discard);

/** Mirrors `dropPlan` in infrastructure/scripts/src/workflow/domain/queue.ts; change both together. */
const dropping = computed(() => {
    const statuses = (base.value?.snapshot?.issues ?? []).map(ticketStatus);
    const close = statuses.filter((status) =>
        ["ready", "blocked", "waiting-on-you"].includes(status),
    ).length;
    return { close, keep: statuses.length - close };
});

const deleting = ref(false);
const confirmation = ref("");
watch(deleting, () => {
    confirmation.value = "";
});

const remove = async () => {
    if (await edit({ action: "delete", project: id.value })) {
        deleting.value = false;
        discard();
        await navigateTo("/workflows");
    }
};
</script>
