<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import type { InterestEntry } from "../types/InterestEntry";

interface Props {
    entries: InterestEntry[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
    rename: [id: string, concept: string];
    remove: [id: string];
    clear: [];
}>();

const CELLS = ["principal", "from", "to", "rate", "interest", "total"] as const;
const COLUMNS = ["concept", ...CELLS] as const;

const { t, locale } = useI18n();
const toast = useToast();
const headingId = useId();
const { copy, isSupported: canCopy } = useClipboard();

const confirmingClear = ref(false);

const formats = computed(() => {
    const euros = new Intl.NumberFormat(locale.value, { style: "currency", currency: "EUR" });
    const plain = new Intl.NumberFormat(locale.value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
    });
    const percent = new Intl.NumberFormat(locale.value, { maximumFractionDigits: 4 });
    const date = new Intl.DateTimeFormat(locale.value, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    });

    return {
        euros: (cents: number) => euros.format(cents / 100),
        plain: (cents: number) => plain.format(cents / 100),
        percent: (value: number) => percent.format(value),
        date: (iso: string) => date.format(Date.parse(`${iso}T00:00:00Z`)),
    };
});

const rows = computed(() =>
    props.entries.map((entry) => ({ ...entry, principalCents: Math.round(entry.principal * 100) })),
);

const totals = computed(() =>
    rows.value.reduce(
        (sum, row) => ({
            principalCents: sum.principalCents + row.principalCents,
            interestCents: sum.interestCents + row.interestCents,
            totalCents: sum.totalCents + row.totalCents,
        }),
        { principalCents: 0, interestCents: 0, totalCents: 0 },
    ),
);

const displayed = computed(() => {
    const { euros, percent, date } = formats.value;

    return {
        rows: rows.value.map((row) => ({
            id: row.id,
            concept: row.concept,
            principal: euros(row.principalCents),
            from: date(row.from),
            to: date(row.to),
            rate: percent(row.ratePercent),
            interest: euros(row.interestCents),
            total: euros(row.totalCents),
        })),
        totals: {
            principal: euros(totals.value.principalCents),
            interest: euros(totals.value.interestCents),
            total: euros(totals.value.totalCents),
        },
    };
});

const toTsv = (): string => {
    const { plain, percent, date } = formats.value;
    const lines = [
        COLUMNS.map((column) => t(`interestCalculator.history.columns.${column}`)),
        ...rows.value.map((row) => [
            row.concept,
            plain(row.principalCents),
            date(row.from),
            date(row.to),
            percent(row.ratePercent),
            plain(row.interestCents),
            plain(row.totalCents),
        ]),
        [
            t("interestCalculator.history.totals"),
            plain(totals.value.principalCents),
            "",
            "",
            "",
            plain(totals.value.interestCents),
            plain(totals.value.totalCents),
        ],
    ];

    return lines
        .map((cells) => cells.map((cell) => cell.replace(/[\t\n]/g, " ")).join("\t"))
        .join("\n");
};

const copyTable = async (): Promise<void> => {
    await copy(toTsv());
    toast.add({ title: t("interestCalculator.history.copied"), icon: "i-lucide-check" });
};

const onClear = (): void => {
    if (!confirmingClear.value) {
        confirmingClear.value = true;

        return;
    }

    confirmingClear.value = false;
    emit("clear");
    toast.add({ title: t("interestCalculator.history.cleared"), icon: "i-lucide-check" });
};
</script>

<template>
    <section :aria-labelledby="headingId">
        <BaseSectionHeading :id="headingId" :title="$t('interestCalculator.history.title')" />
        <p class="mt-4 max-w-measure font-serif text-base/relaxed text-pretty text-toned">
            {{ $t("interestCalculator.history.lead") }}
        </p>

        <p
            v-if="!rows.length"
            class="mt-6 rounded-sm border border-dashed border-default p-6 font-sans text-sm text-toned"
        >
            {{ $t("interestCalculator.history.empty") }}
        </p>

        <template v-else>
            <div class="relative mt-6 overflow-x-auto rounded-sm border border-default bg-ivory-50">
                <table :aria-labelledby="headingId" class="w-full min-w-3xl font-sans text-sm">
                    <thead class="border-b border-default text-left text-toned">
                        <tr>
                            <th
                                v-for="column in COLUMNS"
                                :key="column"
                                scope="col"
                                class="px-3 py-2 font-semibold"
                                :class="column !== 'concept' && 'text-right'"
                            >
                                {{ $t(`interestCalculator.history.columns.${column}`) }}
                            </th>
                            <th scope="col" class="px-3 py-2">
                                <span class="sr-only">
                                    {{ $t("interestCalculator.history.columns.actions") }}
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-(--ui-border) tabular-nums">
                        <tr v-for="(row, index) in displayed.rows" :key="row.id">
                            <td class="px-3 py-1.5">
                                <UInput
                                    :model-value="row.concept"
                                    :aria-label="
                                        $t('interestCalculator.history.conceptLabel', {
                                            row: index + 1,
                                        })
                                    "
                                    maxlength="120"
                                    size="md"
                                    variant="ghost"
                                    class="w-full min-w-60"
                                    :ui="{ base: 'min-h-9 bg-transparent' }"
                                    @change="
                                        emit(
                                            'rename',
                                            row.id,
                                            ($event.target as HTMLInputElement).value,
                                        )
                                    "
                                />
                            </td>
                            <td
                                v-for="cell in CELLS"
                                :key="cell"
                                class="px-3 py-2 text-right whitespace-nowrap"
                                :class="cell === 'total' && 'font-semibold text-highlighted'"
                            >
                                {{ row[cell] }}
                            </td>
                            <td class="p-1 text-right">
                                <UButton
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-trash-2"
                                    :aria-label="
                                        $t('interestCalculator.history.remove', { row: index + 1 })
                                    "
                                    @click="emit('remove', row.id)"
                                />
                            </td>
                        </tr>
                    </tbody>
                    <tfoot
                        class="border-t-2 border-huella-slate-900 font-semibold text-highlighted tabular-nums"
                    >
                        <tr>
                            <th scope="row" class="px-3 py-2 text-left">
                                {{ $t("interestCalculator.history.totals") }}
                            </th>
                            <td class="px-3 py-2 text-right whitespace-nowrap">
                                {{ displayed.totals.principal }}
                            </td>
                            <td colspan="3" />
                            <td class="px-3 py-2 text-right whitespace-nowrap">
                                {{ displayed.totals.interest }}
                            </td>
                            <td class="px-3 py-2 text-right whitespace-nowrap">
                                {{ displayed.totals.total }}
                            </td>
                            <td />
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="mt-4 flex flex-col gap-3 sm:flex-row">
                <ClientOnly>
                    <UButton
                        v-if="canCopy"
                        variant="outline"
                        color="neutral"
                        icon="i-lucide-copy"
                        :label="$t('interestCalculator.history.copy')"
                        class="justify-center"
                        @click="copyTable"
                    />
                </ClientOnly>
                <UButton
                    variant="ghost"
                    :color="confirmingClear ? 'error' : 'neutral'"
                    icon="i-lucide-eraser"
                    :label="
                        $t(
                            confirmingClear
                                ? 'interestCalculator.history.confirmClear'
                                : 'interestCalculator.history.clear',
                        )
                    "
                    class="justify-center"
                    @click="onClear"
                    @blur="confirmingClear = false"
                />
            </div>
        </template>
    </section>
</template>
