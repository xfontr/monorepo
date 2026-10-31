<script setup lang="ts">
import { formats, subjects } from "./fixtures-b";
import { archiveD, countIn } from "./fixtures-d";
import Kicker from "./Kicker.vue";

interface Props {
    query: string;
    size?: "compact" | "large";
}

const props = withDefaults(defineProps<Props>(), { size: "compact" });

const fold = (text: string) =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("es");

const subjectName = (slug: string) => subjects.find((item) => item.slug === slug)!.name;
const formatName = (slug: string) => formats.find((item) => item.slug === slug)!.name;

const matches = computed(() =>
    archiveD.filter((entry) =>
        fold(`${entry.title} ${entry.excerpt ?? ""}`).includes(fold(props.query)),
    ),
);
const matchedSubjects = computed(() =>
    subjects.filter((item) => fold(`${item.name} ${item.description}`).includes(fold(props.query))),
);
const latest = archiveD.slice(0, 4);
const shownSubjects = subjects.filter((item) => countIn(item.slug) > 0);
</script>

<template>
    <div class="flex flex-col font-sans" :class="size === 'large' ? 'gap-10 md:gap-12' : 'gap-6'">
        <template v-if="!query">
            <section aria-labelledby="sp-subjects">
                <Kicker id="sp-subjects" tone="muted">Explorar por materia</Kicker>
                <ul
                    v-if="size === 'large'"
                    class="mt-4 grid grid-cols-1 border-t border-default sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3"
                >
                    <li
                        v-for="item in shownSubjects"
                        :key="item.slug"
                        class="border-b border-(--ui-border-muted)"
                    >
                        <a
                            href="/lab/publicaciones"
                            class="flex min-h-12 items-baseline justify-between gap-3 py-3 font-serif text-lg text-highlighted hover:text-primary"
                        >
                            {{ item.name }}
                            <span class="font-sans text-xs text-muted">{{
                                countIn(item.slug)
                            }}</span>
                        </a>
                    </li>
                </ul>
                <ul v-else class="mt-3 flex flex-wrap gap-2">
                    <li v-for="item in shownSubjects.slice(0, 6)" :key="item.slug">
                        <UButton
                            to="/lab/publicaciones"
                            variant="outline"
                            color="neutral"
                            size="sm"
                            :label="item.name"
                        />
                    </li>
                </ul>
            </section>

            <section aria-labelledby="sp-latest">
                <Kicker id="sp-latest" tone="muted">Lo último</Kicker>
                <ol class="mt-2 flex flex-col divide-y divide-(--ui-border-muted)">
                    <li v-for="(entry, index) in latest" :key="entry.slug">
                        <a
                            href="/lab/article"
                            class="flex min-h-12 items-baseline gap-4 py-3 hover:text-primary"
                        >
                            <span class="w-5 shrink-0 font-sans text-xs font-semibold text-muted">
                                {{ String(index + 1).padStart(2, "0") }}
                            </span>
                            <span class="font-serif text-base/snug text-highlighted">
                                {{ entry.title }}
                            </span>
                        </a>
                    </li>
                </ol>
            </section>
        </template>

        <template v-else>
            <section v-if="matchedSubjects.length" aria-labelledby="sp-msubjects">
                <Kicker id="sp-msubjects" tone="muted">Materias</Kicker>
                <ul class="mt-3 flex flex-wrap gap-2">
                    <li v-for="item in matchedSubjects" :key="item.slug">
                        <UButton
                            to="/lab/publicaciones"
                            variant="outline"
                            color="neutral"
                            size="sm"
                            :label="item.name"
                            trailing-icon="i-lucide-arrow-right"
                        />
                    </li>
                </ul>
            </section>

            <section aria-labelledby="sp-matches">
                <Kicker id="sp-matches" tone="muted">Artículos</Kicker>
                <ul class="mt-1 flex flex-col divide-y divide-(--ui-border-muted)">
                    <li v-for="(entry, index) in matches.slice(0, 5)" :key="entry.slug">
                        <a
                            href="/lab/article"
                            class="-mx-3 flex flex-col gap-1 rounded-xs p-3"
                            :class="index === 0 ? 'bg-ivory-200/70' : 'hover:bg-ivory-200/40'"
                        >
                            <span
                                class="text-xs font-semibold tracking-[0.12em] text-secondary uppercase"
                            >
                                {{ subjectName(entry.subject) }} · {{ formatName(entry.format) }}
                            </span>
                            <span
                                class="font-serif leading-snug text-highlighted"
                                :class="size === 'large' ? 'text-xl' : 'text-base'"
                            >
                                {{ entry.title }}
                            </span>
                            <span class="text-xs text-muted">
                                {{ entry.authors.map((author) => author.name).join(", ") }} ·
                                {{ entry.date }}
                            </span>
                        </a>
                    </li>
                </ul>
            </section>

            <a
                href="/lab/estados"
                class="flex min-h-12 items-center justify-between gap-3 border-t-2 border-huella-slate-900 pt-3 text-sm font-semibold text-primary hover:underline"
            >
                <span>Ver los {{ matches.length }} resultados de «{{ query }}»</span>
                <span class="flex items-center gap-1.5">
                    <UKbd value="enter" class="hidden md:inline-flex" />
                    <UIcon name="i-lucide-arrow-right" class="size-4" />
                </span>
            </a>
        </template>
    </div>
</template>
