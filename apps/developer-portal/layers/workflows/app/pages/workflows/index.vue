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
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col gap-6">
                <p class="max-w-3xl text-sm text-muted">
                    A workflow is a map of every block a kind of project needs and what each one
                    needs first, learned from the ones already shipped. Each project picks its
                    features, files the blocks as GitHub tickets with their blocked-by links, and
                    from then on GitHub says where it stands.
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

                    <p v-if="data.projects.length === 0" class="text-sm text-muted">
                        No project under
                        <code class="font-mono">data/workflows/projects/</code> yet.
                    </p>

                    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <WorkflowCard
                            v-for="view in data.projects"
                            :key="view.project.id"
                            :project="view"
                        />
                        <NewProjectCard />
                    </div>
                </section>

                <section class="flex flex-col gap-3">
                    <h2 class="font-semibold">Templates</h2>

                    <UCard v-for="template in data.templates" :key="template.id">
                        <template #header>
                            <p class="font-semibold">{{ template.title }}</p>
                            <p class="text-xs text-muted">{{ template.summary }}</p>
                            <p class="mt-1 text-xs text-dimmed tabular-nums">
                                {{ templateCounts[template.id] }}
                            </p>
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
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { templateEstimate, type Template } from "#layers/workflows/shared/workflows.ts";

useHead({ title: "Workflows" });

const { data } = await useWorkflows();

const capabilitiesOf = (template: Template, stage: string) =>
    template.capabilities.filter((capability) => capability.stage === stage);

const templateCounts = computed(() =>
    Object.fromEntries(
        data.value.templates.map((template) => {
            const { blocks, tickets, points } = templateEstimate(template);
            return [
                template.id,
                `${blocks} blocks by default · ${points} SP · ${tickets.block} tickets one per block, ${tickets.fast} fast`,
            ];
        }),
    ),
);
</script>
