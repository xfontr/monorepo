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

                    <div
                        v-if="data.projects.length === 0 && !editable"
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
                                <p class="truncate font-semibold">{{ card.title }}</p>
                                <p class="truncate text-xs text-muted">{{ card.templateTitle }}</p>
                                <p class="mt-1 text-xs tabular-nums">
                                    <span class="text-dimmed">Now:</span> {{ card.now }}
                                </p>
                                <p class="text-xs text-dimmed tabular-nums">
                                    {{ card.points }}
                                </p>
                                <p class="text-xs text-dimmed tabular-nums">
                                    {{ card.done }}/{{ card.total }} capabilities ·
                                    {{ card.tickets }}
                                    <template v-if="card.unsorted > 0">
                                        ·
                                        <span class="tone-warn"
                                            >{{ card.unsorted }} to organise</span
                                        >
                                    </template>
                                </p>
                            </div>
                        </NuxtLink>
                        <NewProjectCard v-if="editable" label="New project" />
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
import {
    blocksOn,
    complexityOf,
    pointsLine,
    ticketsToFile,
    type Template,
} from "#layers/workflows/shared/workflows.ts";

useHead({ title: "Workflows" });

const { data } = await useWorkflows();
const { editable } = useWorkflowEdit();

const projectCards = computed(() =>
    data.value.projects.map(
        ({ project, template, counts, progress, points, unsorted, tickets }) => ({
            id: project.id,
            title: project.title,
            templateTitle: template.title,
            percent: progress.percent,
            done: progress.done,
            total: progress.total,
            points: pointsLine(points),
            unsorted: unsorted.length,
            tickets: `${tickets.filed} tickets filed, ${tickets.toFile[project.ticketSize]} to file`,
            now: [
                `${counts["waiting-on-you"]} waiting on you`,
                `${counts.ready} ready`,
                `${counts["in-flight"]} in flight`,
                `${counts.blocked} blocked`,
            ].join(" · "),
        }),
    ),
);

const capabilitiesOf = (template: Template, stage: string) =>
    template.capabilities.filter((capability) => capability.stage === stage);

/** What a template files with its defaults on, at the biggest and smallest ticket size. */
const estimateOf = (template: Template | undefined) => {
    const blocks = template ? blocksOn(template) : [];
    return { blocks: blocks.length, tickets: ticketsToFile(blocks), points: complexityOf(blocks) };
};

const templateCounts = computed(() =>
    Object.fromEntries(
        data.value.templates.map((template) => {
            const { blocks, tickets, points } = estimateOf(template);
            return [
                template.id,
                `${blocks} blocks by default · ${points} SP · ${tickets.block} tickets one per block, ${tickets.lean} lean`,
            ];
        }),
    ),
);
</script>
