<template>
    <UDashboardPanel id="workflow-new">
        <template #header>
            <UDashboardNavbar title="New project">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <UButton
                        to="/workflows"
                        label="Cancel"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="mx-auto flex w-full max-w-5xl flex-col gap-8">
                <UStepper v-model="step" :items="steps" disabled class="w-full" />

                <div class="grid gap-6 lg:grid-cols-3">
                    <section class="flex flex-col gap-4 lg:col-span-2">
                        <header>
                            <h2 class="text-lg font-semibold">{{ current.question }}</h2>
                            <p class="text-sm text-muted">{{ current.hint }}</p>
                        </header>

                        <TemplatePicker
                            v-if="current.id === 'template'"
                            :templates="data.templates"
                            :model-value="draft.template"
                            @update:model-value="pickTemplate"
                        />

                        <form
                            v-else-if="current.id === 'details'"
                            class="flex flex-col gap-4"
                            @submit.prevent="next"
                        >
                            <UFormField label="Title" required>
                                <UInput
                                    v-model="draft.title"
                                    placeholder="Harbour Notes"
                                    size="lg"
                                    class="w-full"
                                    autofocus
                                />
                            </UFormField>
                            <UFormField
                                label="Summary"
                                help="One line on what the site is and who reads it"
                            >
                                <UTextarea v-model="draft.summary" :rows="2" class="w-full" />
                            </UFormField>
                            <div class="grid gap-4 sm:grid-cols-3">
                                <UFormField
                                    label="Id"
                                    help="kebab-case; the file name"
                                    :error="idError"
                                >
                                    <UInput v-model="id" class="w-full" />
                                </UFormField>
                                <UFormField
                                    label="Milestone"
                                    help="Its tickets live here"
                                    :error="milestoneError"
                                >
                                    <UInput v-model="milestone" class="w-full" />
                                </UFormField>
                                <UFormField label="Area label" help="Where its code lives">
                                    <UInput v-model="area" class="w-full" />
                                </UFormField>
                            </div>
                            <button type="submit" hidden />
                        </form>

                        <div
                            v-else-if="current.id === 'features' && template"
                            class="flex flex-col gap-6"
                        >
                            <FeaturePicker :features editable @toggle="toggle" />
                            <RequiredBlocks :template />
                        </div>

                        <div v-else class="flex flex-col gap-6">
                            <dl class="divide-y divide-default rounded-xl border border-default">
                                <div
                                    v-for="row in review"
                                    :key="row.label"
                                    class="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-6"
                                >
                                    <dt class="w-32 shrink-0 text-sm text-muted">
                                        {{ row.label }}
                                    </dt>
                                    <dd class="text-sm">{{ row.value }}</dd>
                                </div>
                            </dl>

                            <section v-if="preview" class="rounded-2xl border border-default">
                                <header class="border-b border-default px-4 py-3">
                                    <h2 class="text-sm font-semibold">Dependency graph</h2>
                                </header>
                                <WorkflowGraph
                                    :capabilities="preview.capabilities"
                                    :stages="preview.stages"
                                    :selected="picked"
                                    class="rounded-t-none"
                                    @select="pick"
                                />
                            </section>
                        </div>

                        <footer class="flex items-center justify-between gap-3 pt-2">
                            <UButton
                                v-if="step > 0"
                                label="Back"
                                icon="i-lucide-arrow-left"
                                color="neutral"
                                variant="ghost"
                                @click="step -= 1"
                            />
                            <span v-else />
                            <UButton
                                v-if="step < steps.length - 1"
                                label="Next"
                                trailing-icon="i-lucide-arrow-right"
                                :disabled="!ready"
                                @click="next"
                            />
                            <UButton
                                v-else-if="editable"
                                label="Create project"
                                icon="i-lucide-check"
                                :loading="creating"
                                @click="create"
                            />
                            <span v-else class="flex items-center gap-2">
                                <UButton
                                    label="Download YAML"
                                    icon="i-lucide-download"
                                    color="neutral"
                                    variant="outline"
                                    @click="download"
                                />
                                <UTooltip :text="LOCKED">
                                    <span tabindex="0">
                                        <UButton
                                            label="Create project"
                                            icon="i-lucide-check"
                                            disabled
                                        />
                                    </span>
                                </UTooltip>
                            </span>
                        </footer>

                        <UAlert
                            v-if="!editable && step === steps.length - 1"
                            color="warning"
                            variant="subtle"
                            icon="i-lucide-lock"
                            :title="LOCKED"
                            :description="`This portal is a read-only snapshot. Download the file and add it to data/workflows/projects/${id}.yaml in a pull request.`"
                        />
                    </section>

                    <aside class="lg:sticky lg:top-4 lg:self-start">
                        <UCard>
                            <p class="text-xs text-muted">{{ template?.title ?? "No template" }}</p>
                            <p class="truncate font-semibold">
                                {{ draft.title || "Untitled project" }}
                            </p>
                            <div class="mt-4 flex gap-6 tabular-nums">
                                <div>
                                    <p class="text-2xl font-semibold">{{ blocks.length }}</p>
                                    <p class="text-xs text-muted">blocks</p>
                                </div>
                                <div>
                                    <p class="text-2xl font-semibold">
                                        {{ tickets[draft.ticketSize] }}
                                    </p>
                                    <p class="text-xs text-muted">tickets</p>
                                </div>
                                <div>
                                    <p class="text-2xl font-semibold">{{ points }}</p>
                                    <p class="text-xs text-muted">SP</p>
                                </div>
                            </div>
                            <div class="mt-4 border-t border-default pt-4">
                                <p class="mb-2 text-xs font-medium text-muted">Ticket size</p>
                                <TicketSizePicker
                                    v-model="draft.ticketSize"
                                    :counts="tickets"
                                    editable
                                    compact
                                />
                            </div>
                            <p class="mt-4 text-xs text-muted">
                                Creating writes
                                <code class="font-mono">projects/{{ id || "…" }}.yaml</code> and
                                nothing else. Tickets are filed later, one block at a time, with
                                <code class="font-mono">pnpm workflow:file</code>.
                            </p>
                        </UCard>
                    </aside>
                </div>
            </div>

            <UModal
                v-model:open="leaving"
                title="Leave without creating?"
                description="Nothing picked on this page is in a project file yet."
            >
                <template #footer>
                    <div class="flex w-full justify-end gap-2">
                        <UButton
                            label="Stay"
                            color="neutral"
                            variant="ghost"
                            @click="leaving = false"
                        />
                        <UButton label="Leave without creating" color="error" @click="leave" />
                    </div>
                </template>
            </UModal>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import {
    blocksOn,
    complexityOf,
    draftProject,
    featuresOf,
    PROJECT_ID,
    projectSlug,
    projectView,
    projectYaml,
    TICKET_SIZE_LABELS,
    ticketsToFile,
    type TicketSize,
} from "#layers/workflows/shared/workflows.ts";

useHead({ title: "New project" });

const { data } = await useWorkflows();
const { editable, edit } = useWorkflowEdit();

const STEPS = [
    {
        id: "template",
        title: "Template",
        icon: "i-lucide-layout-template",
        question: "What are you building?",
        hint: "The template is the map of blocks the project starts from. It can't be changed later.",
    },
    {
        id: "details",
        title: "Details",
        icon: "i-lucide-pencil",
        question: "What is it called?",
        hint: "The id, milestone and area label follow the title until you change them.",
    },
    {
        id: "features",
        title: "Features",
        icon: "i-lucide-layers",
        question: "Which features does it need?",
        hint: "Leaving one out takes its blocks out of the map; the ticket count beside it follows. You can change this later in Settings.",
    },
    {
        id: "review",
        title: "Review",
        icon: "i-lucide-check",
        question: "Ready to create it?",
        hint: "Nothing goes to GitHub. The project file is all that gets written.",
    },
] as const;

const steps = STEPS.map(({ title, icon }) => ({ title, icon }));
const step = ref(0);
const current = computed(() => STEPS[step.value] ?? STEPS[0]);

const draft = reactive({
    // Files load in name order, so a blank template such as `custom` would otherwise come first.
    template:
        (
            data.value.templates.find(({ capabilities }) => capabilities.length > 0) ??
            data.value.templates[0]
        )?.id ?? "",
    title: "",
    summary: "",
    switches: {} as Record<string, boolean>,
    ticketSize: "block" as TicketSize,
});

/** A field follows the title until someone types in it, and again once it is cleared. */
const derived = <T extends string>(from: () => T) => {
    const typed = ref<string | null>(null);
    return computed({
        get: () => typed.value ?? from(),
        set: (value: string) => {
            typed.value = value || null;
        },
    });
};

const id = derived(() => projectSlug(draft.title));
const milestone = derived(() => draft.title.trim());
const area = derived(() => (id.value ? `app:${id.value}` : ""));

const idError = computed(() => {
    if (id.value) return PROJECT_ID.test(id.value) ? undefined : "Lower case, digits and dashes";
    return draft.title.trim() ? "Type one: the title has no letters to make it from" : undefined;
});

const milestoneError = computed(() => {
    const owner = data.value.projects.find(
        ({ project }) => project.milestone === milestone.value.trim(),
    );
    return owner ? `Already ${owner.project.title}'s milestone` : undefined;
});

const template = computed(() => data.value.templates.find(({ id }) => id === draft.template));

const pickTemplate = (templateId: string) => {
    if (templateId !== draft.template) draft.switches = {};
    draft.template = templateId;
};

const features = computed(() =>
    template.value ? featuresOf(draftProject(template.value, draft.switches), template.value) : [],
);
const toggle = (feature: string, on: boolean) => {
    draft.switches = { ...draft.switches, [feature]: on };
};

const blocks = computed(() => (template.value ? blocksOn(template.value, draft.switches) : []));
const tickets = computed(() => ticketsToFile(blocks.value));
const points = computed(() => complexityOf(blocks.value));

const preview = computed(() =>
    template.value
        ? projectView(
              draftProject(template.value, draft.switches, draft.ticketSize),
              template.value,
              null,
          )
        : null,
);
const picked = ref<string | null>(null);
const pick = (id: string) => {
    picked.value = picked.value === id ? null : id;
};

const ready = computed(() => {
    if (current.value.id === "template") return template.value !== undefined;
    if (current.value.id === "details") {
        return Boolean(
            draft.title.trim() &&
            id.value &&
            !idError.value &&
            milestone.value &&
            !milestoneError.value,
        );
    }
    return true;
});

const next = () => {
    if (ready.value && step.value < STEPS.length - 1) step.value += 1;
};

const review = computed(() => {
    const on = features.value.filter(({ enabled }) => enabled).map(({ title }) => title);
    const off = features.value.filter(({ enabled }) => !enabled).map(({ title }) => title);

    return [
        { label: "Template", value: template.value?.title ?? "" },
        { label: "Title", value: draft.title },
        { label: "Summary", value: draft.summary || "—" },
        { label: "Id", value: id.value },
        { label: "Milestone", value: milestone.value },
        { label: "Area label", value: area.value || "—" },
        { label: "Features on", value: on.join(", ") || "None" },
        { label: "Left out", value: off.join(", ") || "None" },
        {
            label: "Tickets",
            value: `${TICKET_SIZE_LABELS[draft.ticketSize].title}, ${tickets.value[draft.ticketSize]} for ${blocks.value.length} blocks`,
        },
        { label: "Complexity", value: `${points.value} SP` },
    ];
});

const LOCKED = "You're not authorised to create projects here";

const fields = () => ({
    template: draft.template,
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    milestone: milestone.value.trim(),
    area: area.value.trim(),
    switches: draft.switches,
    ticketSize: draft.ticketSize,
});

const untouched = JSON.stringify(draft);
const done = ref(false);
const { leaving, leave } = useLeaveGuard(
    () => !done.value && (step.value > 0 || JSON.stringify(draft) !== untouched),
    () => {
        done.value = true;
    },
);

const creating = ref(false);
const create = async () => {
    creating.value = true;
    const created = await edit({ action: "create", project: id.value, ...fields() });
    creating.value = false;

    if (created) {
        done.value = true;
        await navigateTo(`/workflows/${id.value}`);
    }
};

const download = () => {
    const blob = new Blob([projectYaml({ id: id.value, ...fields() })], { type: "text/yaml" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `${id.value}.yaml`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
};
</script>
