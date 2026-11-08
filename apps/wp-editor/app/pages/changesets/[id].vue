<template>
    <UDashboardPanel id="rail" resizable :default-size="22" :min-size="16" :max-size="34">
        <template #header>
            <UDashboardNavbar :title="data?.changeset.title ?? id" :ui="{ title: 'truncate' }">
                <template #leading>
                    <UButton
                        to="/"
                        icon="i-lucide-arrow-left"
                        color="neutral"
                        variant="ghost"
                        square
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <ItemRail
                v-model:filter="filter"
                :items
                :selected="selectedKey"
                class="-m-4 sm:-m-6"
                @select="select"
            />
        </template>
    </UDashboardPanel>

    <UDashboardPanel id="review">
        <template #header>
            <UDashboardNavbar :ui="{ title: 'min-w-0' }">
                <template #title>
                    <span class="truncate">{{ item?.base.title ?? "Nothing selected" }}</span>
                    <UBadge v-if="badge" v-bind="badge" variant="subtle" class="ml-2" />
                </template>

                <template #right>
                    <UButton
                        v-if="runs.length > 0"
                        icon="i-lucide-history"
                        color="neutral"
                        variant="ghost"
                        label="Reports"
                        @click="openReports"
                    />
                    <UTooltip text="Check every pending article against WordPress, writing nothing">
                        <UButton
                            icon="i-lucide-flask-conical"
                            color="neutral"
                            variant="outline"
                            label="Dry run"
                            :disabled="!!busy"
                            :loading="busy === 'Dry run'"
                            @click="runBulk('dry-run')"
                        />
                    </UTooltip>
                    <UTooltip :text="data?.restoreBlocker ?? 'Restore every applied article'">
                        <UButton
                            icon="i-lucide-undo-2"
                            color="neutral"
                            variant="outline"
                            label="Restore all"
                            :disabled="!!data?.restoreBlocker || !!busy"
                            :loading="busy === RUN_LABELS.restore.name"
                            @click="restoreOpen = true"
                        />
                    </UTooltip>
                    <UTooltip :text="data?.bulkBlocker ?? 'Apply every pending article'">
                        <UButton
                            icon="i-lucide-upload-cloud"
                            label="Bulk apply"
                            :disabled="!!data?.bulkBlocker || !!busy"
                            :loading="busy === 'Bulk apply'"
                            @click="runBulk('apply')"
                        />
                    </UTooltip>
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar v-if="item">
                <template #left>
                    <UButton
                        icon="i-lucide-chevron-left"
                        color="neutral"
                        variant="ghost"
                        :disabled="position <= 0"
                        @click="step(-1)"
                    />
                    <span class="text-sm text-muted tabular-nums"
                        >{{ position + 1 }} / {{ visible.length }}</span
                    >
                    <UButton
                        icon="i-lucide-chevron-right"
                        color="neutral"
                        variant="ghost"
                        :disabled="position >= visible.length - 1"
                        @click="step(1)"
                    />
                    <UTabs v-model="mode" :items="MODES" :content="false" size="xs" class="ml-2" />
                    <UButton
                        :to="item.base.link"
                        target="_blank"
                        icon="i-lucide-external-link"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        aria-label="Open in WordPress"
                    />
                </template>

                <template #right>
                    <ReviewToolbar
                        :item
                        :busy
                        :dirty
                        :dry-run
                        @act="act(item.key, $event)"
                        @save="saveDraft"
                        @discard="draft = proposed"
                    />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <UAlert
                v-if="error"
                color="error"
                variant="subtle"
                title="Changeset can't be read"
                :description="errorMessage"
            />

            <UAlert
                v-else-if="dryRun"
                color="warning"
                variant="subtle"
                icon="i-lucide-flask-conical"
                title="Dry-run mode is on"
                description="Apply, Bulk apply and Restore only check against WordPress; nothing is written. Turn it off in Settings."
                class="shrink-0"
            />

            <UAlert
                v-else-if="data?.bulkBlocker"
                color="neutral"
                variant="subtle"
                icon="i-lucide-lock"
                title="Bulk apply is disabled"
                :description="`${data.bulkBlocker} The workflow is set in Settings.`"
                class="shrink-0"
            />

            <RunProgress v-if="running" :kind="running" :report="progress" :current-title />

            <UEmpty
                v-if="!item"
                icon="i-lucide-inbox"
                title="No articles to review"
                class="flex-1"
            />

            <template v-else>
                <UAlert
                    v-if="item.proposal?.reviewRequested"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-flag"
                    title="Review requested"
                    :description="item.proposal.reviewRequested"
                    class="shrink-0"
                />

                <div
                    v-if="
                        item.proposal?.title !== undefined &&
                        item.proposal.title !== item.base.title
                    "
                    class="shrink-0 rounded-md border border-default p-3 text-sm"
                >
                    <span class="text-muted">Title:</span>
                    <del class="mx-1 bg-error/15">{{ item.base.title }}</del>
                    <ins class="bg-success/15 no-underline">{{ item.proposal.title }}</ins>
                </div>

                <div class="min-h-0 flex-1 overflow-hidden rounded-md border border-default">
                    <DiffPreview
                        v-if="mode === 'preview'"
                        :before="item.base.content"
                        :after="draft"
                    />
                    <DiffSource
                        v-else
                        v-model:draft="draft"
                        :before="item.base.content"
                        :after="proposed"
                        :editable
                    />
                </div>
            </template>

            <UModal
                v-model:open="restoreOpen"
                title="Restore every applied article?"
                :description="`${appliedCount} articles go back to how they were before this changeset. Articles that were never applied get no request.`"
            >
                <template #footer>
                    <UButton
                        label="Cancel"
                        color="neutral"
                        variant="ghost"
                        @click="restoreOpen = false"
                    />
                    <UButton
                        icon="i-lucide-undo-2"
                        color="error"
                        label="Restore all"
                        @click="restoreAll"
                    />
                </template>
            </UModal>

            <UModal v-model:open="reportsOpen" title="Reports" :ui="{ content: 'sm:max-w-2xl' }">
                <template #body>
                    <USelect
                        v-if="runs.length > 1"
                        v-model="runIndex"
                        :items="runItems"
                        class="mb-4 w-full"
                    />
                    <RunReport v-if="shownRun" :report="shownRun" @select="openFromReport" />
                </template>
            </UModal>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { isApplied, isPending } from "#shared/rules.ts";
import type { ItemKey, RunReport } from "#shared/types.ts";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const { data, error, busy, running, progress, act, save, bulk } = useChangeset(id);

const filter = ref<ItemFilter>("all");
const mode = ref<"preview" | "html">("preview");
const draft = ref("");

const items = computed(() =>
    [...(data.value?.items ?? [])].sort((a, b) => b.base.date.localeCompare(a.base.date)),
);
const errorMessage = computed(() => (error.value ? messageOf(error.value) : ""));
const visible = computed(() => items.value.filter((item) => matchesFilter(item, filter.value)));
const selectedKey = computed(
    () => (route.query.item as ItemKey | undefined) ?? visible.value[0]?.key,
);
const item = computed(() => items.value.find(({ key }) => key === selectedKey.value));
const badge = computed(() => (item.value ? itemBadge(item.value) : undefined));
const position = computed(() => visible.value.findIndex(({ key }) => key === selectedKey.value));

const proposed = computed(() => item.value?.proposal?.content ?? item.value?.base.content ?? "");
const dirty = computed(() => !!item.value?.proposal && draft.value !== proposed.value);
const editable = computed(() => !!item.value?.proposal && !isApplied(item.value));

const select = (key: ItemKey | undefined) => {
    if (key) router.replace({ query: { item: key } });
};

const step = (by: number) => select(visible.value[position.value + by]?.key);

// Separate sources, so a refresh that returns the same item and text doesn't reset the draft.
watch(
    [() => item.value?.key, proposed],
    () => {
        draft.value = proposed.value;

        const current = item.value;

        if (current?.proposal && current.state.level === "unreviewed" && !current.state.applied) {
            act(current.key, "seen", true);
        }
    },
    { immediate: true },
);

const saveDraft = () => {
    if (item.value?.proposal)
        save(item.value.key, { ...item.value.proposal, content: draft.value });
};

defineShortcuts({
    arrowleft: () => step(-1),
    arrowright: () => step(1),
    k: () => step(-1),
    j: () => step(1),
    c: () => {
        const current = item.value;

        if (current && isPending(current) && !dirty.value) {
            act(current.key, current.state.level === "confirmed" ? "unconfirm" : "confirm");
        }
    },
    h: () => (mode.value = mode.value === "html" ? "preview" : "html"),
});

const dryRun = computed(() => !!data.value?.settings.dryRun);

const reportsOpen = ref(false);
const runIndex = ref(0);
const runs = computed(() => data.value?.runs ?? []);
const shownRun = computed(() => runs.value[runIndex.value]);
const runItems = computed(() =>
    runs.value.map((run, index) => ({
        label: `${runLabel(run)} · ${new Date(run.at).toLocaleString()}`,
        value: index,
    })),
);

const openReports = () => {
    runIndex.value = 0;
    reportsOpen.value = true;
};

const currentTitle = computed(
    () => items.value.find(({ key }) => key === progress.value?.current)?.base.title,
);

const runBulk = async (kind: RunReport["kind"]) => {
    if (await bulk(kind)) openReports();
};

const restoreOpen = ref(false);
const appliedCount = computed(() => items.value.filter(isApplied).length);

const restoreAll = () => {
    restoreOpen.value = false;
    void runBulk("restore");
};

const openFromReport = (key: ItemKey) => {
    filter.value = "all";
    select(key);
    reportsOpen.value = false;
};

const MODES = [
    { label: "Preview", value: "preview", icon: "i-lucide-eye" },
    { label: "HTML", value: "html", icon: "i-lucide-code" },
];
</script>
