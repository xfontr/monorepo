<script setup lang="ts">
import { useScrollspy } from "@nuxt/ui/composables/useScrollspy";
import { useResizeObserver } from "@vueuse/core";

interface Props {
    items: TocItem[]
}

const props = defineProps<Props>();

const sections = computed(() => props.items.filter(({ level }) => level === 2));
const { activeHeadings, updateHeadings } = useScrollspy();

const lit = computed(() => {
    const visible = sections.value.filter(({ id }) => activeHeadings.value.includes(id)).map(({ id }) => id);

    return visible.length ? visible : sections.value.slice(0, 1).map(({ id }) => id);
});

const rail = useTemplateRef("rail");
const indicator = shallowRef<{ top: number, height: number }>();

function observeHeadings(): void {
    updateHeadings(sections.value.map(({ id }) => document.getElementById(id)).filter((heading) => heading !== null));
}

function measure(): void {
    const links = [...rail.value?.querySelectorAll<HTMLElement>("[data-lit]") ?? []];
    const first = links.at(0);
    const last = links.at(-1);

    indicator.value = first && last ? { top: first.offsetTop, height: last.offsetTop + last.offsetHeight - first.offsetTop } : undefined;
}

onMounted(() => {
    observeHeadings();
    measure();
});

watch(() => sections.value.map(({ id }) => id), observeHeadings, { flush: "post" });
watch(lit, measure, { flush: "post" });

useResizeObserver(rail, measure);
</script>

<template>
    <nav
        v-if="sections.length"
        :aria-label="$t('articleToc.title')"
        class="print:hidden"
    >
        <UAccordion
            :items="[{ label: $t('articleToc.title'), slot: 'toc' as const }]"
            :ui="{ trigger: 'min-h-12 font-sans text-sm font-semibold text-highlighted', body: 'pb-4' }"
            class="max-w-measure rounded-xs border border-default bg-ivory-50 px-4 lg:hidden"
        >
            <template #toc-body>
                <ol class="flex flex-col border-l border-default">
                    <li
                        v-for="item in sections"
                        :key="item.id"
                    >
                        <ULink
                            :to="`#${item.id}`"
                            raw
                            class="-ml-px flex min-h-11 items-center border-l-2 border-transparent pl-4 font-sans text-sm text-toned focus-visible:outline-offset-0"
                        >
                            {{ item.label }}
                        </ULink>
                    </li>
                </ol>
            </template>
        </UAccordion>

        <div class="sticky top-8 hidden lg:block">
            <p class="text-kicker">
                {{ $t("articleToc.title") }}
            </p>
            <div
                ref="rail"
                class="relative mt-3"
            >
                <span
                    v-if="indicator"
                    aria-hidden="true"
                    class="absolute top-0 -left-px w-0.5 rounded-full bg-primary transition-[translate,height] duration-200 ease-out motion-reduce:transition-none"
                    :style="{ height: `${indicator.height}px`, translate: `0 ${indicator.top}px` }"
                />
                <ol class="flex flex-col border-l border-default">
                    <li
                        v-for="item in sections"
                        :key="item.id"
                    >
                        <ULink
                            :to="`#${item.id}`"
                            raw
                            :data-lit="lit.includes(item.id) || undefined"
                            :aria-current="lit[0] === item.id ? 'location' : undefined"
                            class="flex min-h-11 items-center py-1 pl-4 font-sans text-sm leading-snug text-muted transition-colors hover:text-highlighted focus-visible:outline-offset-0 data-lit:font-semibold data-lit:text-highlighted"
                        >
                            {{ item.label }}
                        </ULink>
                    </li>
                </ol>
            </div>
        </div>
    </nav>
</template>
