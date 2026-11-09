<template>
    <UDashboardPanel id="workflows">
        <template #header>
            <UDashboardNavbar title="Workflows">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <UButton
                        to="/docs/docs/workflows/readme"
                        label="How workflows work"
                        icon="i-lucide-ruler"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                    />
                    <UButton
                        v-if="editable"
                        label="New project"
                        icon="i-lucide-plus"
                        size="xs"
                        @click="creating = true"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-6">
                <p class="text-sm text-muted max-w-3xl">
                    A workflow is every stage and capability a kind of project needs, learned from
                    the ones already shipped. Each project switches the optional ones on or off, and
                    its GitHub tickets show where it stands.
                </p>

                <UAlert
                    v-if="data.problems.length > 0"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-triangle-alert"
                    :title="`${data.problems.length} workflow file problems`"
                >
                    <template #description>
                        <ul class="list-disc pl-4">
                            <li
                                v-for="problem in data.problems"
                                :key="problem.file + problem.message"
                            >
                                <code class="font-mono">{{ problem.file }}</code
                                >: {{ problem.message }}
                            </li>
                        </ul>
                    </template>
                </UAlert>

                <section class="flex flex-col gap-3">
                    <h2 class="font-semibold">Projects</h2>

                    <div
                        v-if="data.projects.length === 0"
                        class="rounded-lg border border-dashed border-default p-8 text-center text-sm text-muted"
                    >
                        No project under
                        <code class="font-mono">docs/workflows/projects/</code> yet.
                    </div>

                    <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <NuxtLink
                            v-for="card in projectCards"
                            :key="card.id"
                            :to="`/workflows/${card.id}`"
                            class="flex items-center gap-4 rounded-lg border border-default bg-default p-4 transition-colors hover:bg-elevated/50"
                        >
                            <ProgressRing :percent="card.percent" :size="64" />
                            <div class="min-w-0 flex-1">
                                <p class="font-semibold truncate">{{ card.title }}</p>
                                <p class="text-xs text-muted truncate">{{ card.templateTitle }}</p>
                                <p class="mt-1 text-xs">
                                    <span class="text-dimmed">Now:</span> {{ card.current }}
                                </p>
                                <p class="text-xs text-dimmed tabular-nums">
                                    {{ card.done }}/{{ card.total }} capabilities
                                    <template v-if="card.unsorted > 0">
                                        ·
                                        <span class="tone-warn"
                                            >{{ card.unsorted }} to organise</span
                                        >
                                    </template>
                                </p>
                            </div>
                        </NuxtLink>
                    </div>
                </section>

                <section class="flex flex-col gap-3">
                    <h2 class="font-semibold">Templates</h2>

                    <UCard v-for="template in data.templates" :key="template.id">
                        <template #header>
                            <p class="font-semibold">{{ template.title }}</p>
                            <p class="text-xs text-muted">{{ template.summary }}</p>
                            <p class="mt-1 flex items-center gap-1 text-xs text-dimmed">
                                <UIcon name="i-lucide-toggle-left" class="size-3.5" /> Optional:
                                each project switches it on or off.
                            </p>
                        </template>

                        <ol class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <li v-for="(stage, index) in template.stages" :key="stage.id">
                                <p class="text-sm font-medium">
                                    {{ index + 1 }}. {{ stage.title }}
                                </p>
                                <p class="text-xs text-muted">{{ stage.goal }}</p>
                                <ul class="mt-1 flex flex-wrap gap-1">
                                    <li
                                        v-for="capability in capabilitiesOf(template, stage.id)"
                                        :key="capability.id"
                                    >
                                        <UBadge
                                            :label="capability.title"
                                            :icon="
                                                capability.optional
                                                    ? 'i-lucide-toggle-left'
                                                    : undefined
                                            "
                                            :variant="capability.optional ? 'outline' : 'subtle'"
                                            color="neutral"
                                            size="sm"
                                        />
                                    </li>
                                </ul>
                            </li>
                        </ol>
                    </UCard>
                </section>
            </div>

            <UModal v-model:open="creating" title="New project">
                <template #body>
                    <form class="flex flex-col gap-3" @submit.prevent="create">
                        <UFormField label="Id" help="kebab-case; also the file name">
                            <UInput
                                v-model="draft.project"
                                placeholder="marina-roustan"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Title">
                            <UInput
                                v-model="draft.title"
                                placeholder="Marina Roustan"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Template">
                            <USelect
                                v-model="draft.template"
                                :items="templateItems"
                                value-key="value"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Area label" help="The GitHub label its code lives under">
                            <UInput
                                v-model="draft.area"
                                placeholder="app:marina-roustan"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField
                            label="Milestone"
                            help="Tickets in this milestone belong to the project"
                        >
                            <UInput
                                v-model="draft.milestone"
                                placeholder="Marina Roustan"
                                class="w-full"
                            />
                        </UFormField>
                        <UButton
                            type="submit"
                            label="Create"
                            icon="i-lucide-plus"
                            class="self-end"
                        />
                    </form>
                </template>
            </UModal>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Template } from "#shared/workflows.ts";

useHead({ title: "Workflows" });

const { data } = await useWorkflows();
const { editable, edit } = useWorkflowEdit();

const projectCards = computed(() =>
    data.value.projects.map(({ project, template, stages, progress, unsorted }) => ({
        id: project.id,
        title: project.title,
        templateTitle: template.title,
        percent: progress.percent,
        done: progress.done,
        total: progress.total,
        unsorted: unsorted.length,
        current: stages.find((stage) => stage.state === "current")?.title ?? "Finished",
    })),
);

const capabilitiesOf = (template: Template, stage: string) =>
    template.capabilities.filter((capability) => capability.stage === stage);

const templateItems = computed(() =>
    data.value.templates.map((template) => ({ label: template.title, value: template.id })),
);

const creating = ref(false);
const blank = () => ({
    project: "",
    title: "",
    template: data.value.templates[0]?.id ?? "",
    area: "",
    milestone: "",
});
const draft = reactive(blank());

const create = async () => {
    const id = draft.project;

    if (await edit({ action: "create", ...draft })) {
        creating.value = false;
        Object.assign(draft, blank());
        await navigateTo(`/workflows/${id}`);
    }
};
</script>
