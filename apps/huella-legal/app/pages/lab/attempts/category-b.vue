<script setup lang="ts">
import ArchiveRow from "~/lab/ArchiveRow.vue";
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import { archive, formats, navB, series, seriesEntries, subjects, type FormatSlug } from "~/lab/fixtures-b";
import { provideVariantB } from "~/lab/variant";

provideVariantB();

const route = useRoute();
const router = useRouter();
const one = (value: unknown) => (typeof value === "string" && value ? value : undefined);

const subject = computed(() => subjects.find((item) => item.slug === one(route.query.materia)) ?? subjects[0]!);
const inSubject = computed(() => archive.filter((item) => item.subject === subject.value.slug));
const subjectSeries = computed(() => series.filter((item) => item.subject === subject.value.slug));

useHead({ title: () => `${subject.value.name} (B) · Laboratorio Huella Legal`, htmlAttrs: { lang: "es" } });

const format = computed(() => one(route.query.formato) as FormatSlug | undefined);
const subtopic = computed(() => one(route.query.subtema));
const oldestFirst = computed(() => route.query.orden === "antiguas");

const setQuery = (patch: Record<string, string | undefined>) =>
    router.replace({ query: { ...route.query, ...patch } });

const hrefWith = (patch: Record<string, string | undefined>) => {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries({ ...route.query, ...patch })) if (typeof value === "string" && value) query.set(key, value);

    return `?${query}`;
};

const sort = computed({
    get: () => (oldestFirst.value ? "Más antiguas" : "Más recientes"),
    set: (value: string) => setQuery({ orden: value === "Más antiguas" ? "antiguas" : undefined }),
});

const bySubtopic = computed(() => inSubject.value.filter((item) => !subtopic.value || item.subtopic === subtopic.value));
const results = computed(() => {
    const list = bySubtopic.value.filter((item) => !format.value || item.format === format.value);

    return oldestFirst.value ? [...list].reverse() : list;
});

const years = computed(() => {
    const groups = new Map<number, typeof results.value>();

    for (const item of results.value) groups.set(item.year, [...(groups.get(item.year) ?? []), item]);

    return [...groups.entries()];
});

const tabs = computed(() => [
    { slug: undefined, label: "Todo", count: bySubtopic.value.length },
    ...formats.map((item) => ({ slug: item.slug, label: item.plural, count: bySubtopic.value.filter((entry) => entry.format === item.slug).length })),
]);

const frequentTags = computed(() => {
    const counts = new Map<string, number>();

    for (const item of inSubject.value) for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);

    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
});

const notes = {
    changes: [
        "Sin imágenes en el listado: la fila es texto, como el índice de una revista. El § de relleno ocupaba un tercio de cada fila.",
        "El antetítulo ya no repite la materia en cada fila; dice el formato y el subtema, que es lo que la página no dice.",
        "Subtemas como enlaces de texto bajo el título, no como píldoras.",
        "Pestañas de formato con recuento, subrayadas con la misma regla de 2 px que el paginador.",
        "Filas agrupadas por año, con el año fijo en el margen.",
        "La serie de la materia sube a la cabecera; el boletín del lateral desaparece porque la banda del final ya lo pide.",
        "«Más leídas» se quita del orden: sin plugin no hay recuento de visitas.",
    ],
    sources: [
        { element: "Materia y subtema", source: "Categoría de WP y sus categorías hijas (parent). Core." },
        { element: "Formato", source: "Hace falta una convención: una categoría madre «Formato» o etiquetas con prefijo. Decidir en S1.", risk: true },
        { element: "Serie y posición", source: "Etiqueta de serie; la posición no sale de la fecha (la lectura 2 es posterior a la 5), así que necesita un número en el título o el slug.", risk: true },
        { element: "Recuentos", source: "Cabecera x-wp-total de cada consulta filtrada." },
        { element: "Año", source: "Fecha de publicación del post." },
    ],
};
</script>

<template>
    <div>
        <SiteHeader
            current="Materias"
            :nav="navB"
        />

        <main>
            <section class="border-b border-default">
                <div class="mx-auto grid max-w-site gap-8 px-4 pt-6 pb-10 md:px-8 md:pt-10 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:pb-12">
                    <div class="lg:col-span-8">
                        <UBreadcrumb
                            :items="[{ label: 'Portada', to: '/lab/attempts/home-b' }, { label: 'Materias', to: '/lab/attempts/categorias-b' }, { label: subject.name }]"
                            :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                        />
                        <Kicker class="mt-6 md:mt-8">
                            Materia · {{ inSubject.length }} publicaciones
                        </Kicker>
                        <h1 class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted md:text-[3.5rem]">
                            {{ subject.name }}
                        </h1>
                        <p class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned">
                            {{ subject.description }}
                        </p>

                        <nav
                            aria-label="Subtemas"
                            class="mt-6 flex flex-wrap items-baseline gap-x-1 font-sans text-sm"
                        >
                            <span class="mr-2 text-muted">Subtemas:</span>
                            <ul class="contents">
                                <li
                                    v-for="name in subject.subtopics"
                                    :key="name"
                                >
                                    <a
                                        :href="hrefWith({ subtema: name })"
                                        :aria-current="subtopic === name ? 'true' : undefined"
                                        class="inline-flex min-h-11 items-center gap-1.5 px-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary aria-[current=true]:text-highlighted [&[aria-current=true]>span:first-child]:underline [&[aria-current=true]>span:first-child]:decoration-2"
                                        @click.prevent="setQuery({ subtema: subtopic === name ? undefined : name })"
                                    ><span>{{ name }}</span> <span class="font-medium tabular-nums text-dimmed">{{ inSubject.filter((item) => item.subtopic === name).length }}</span></a>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    <a
                        v-for="item in subjectSeries"
                        :key="item.slug"
                        href="/lab/attempts/serie-b"
                        class="group flex flex-col gap-2 self-end border-t-2 border-huella-slate-900 pt-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:col-span-4"
                    >
                        <Kicker>Serie · {{ seriesEntries(item.slug).length }} lecturas en orden</Kicker>
                        <span class="font-serif text-h3 text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ item.name }}</span>
                        <span class="font-serif text-base leading-relaxed text-muted">Si llegas nuevo a la materia, empieza aquí.</span>
                        <span class="mt-1 inline-flex min-h-11 items-center gap-1.5 font-sans text-sm font-semibold text-primary">
                            Empezar por la primera
                            <UIcon
                                name="i-lucide-arrow-right"
                                class="size-4 transition-transform group-hover:translate-x-0.5"
                            />
                        </span>
                    </a>
                </div>
            </section>

            <div class="mx-auto grid max-w-site grid-cols-1 gap-12 px-4 pt-6 pb-16 md:px-8 lg:grid-cols-12 lg:gap-x-12 lg:px-12 lg:pb-20">
                <section
                    aria-labelledby="listado"
                    class="min-w-0 lg:col-span-8"
                >
                    <h2
                        id="listado"
                        class="sr-only"
                    >
                        Publicaciones
                    </h2>

                    <!-- Format tabs: the same 2 px ink rule that marks the current page in the pager -->
                    <div class="flex flex-col gap-2 border-b border-default sm:flex-row sm:items-end sm:justify-between">
                        <nav
                            aria-label="Formato"
                            class="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
                        >
                            <ul class="-ml-3 flex">
                                <li
                                    v-for="tab in tabs"
                                    :key="tab.label"
                                >
                                    <a
                                        :href="hrefWith({ formato: tab.slug })"
                                        :aria-current="format === tab.slug ? 'true' : undefined"
                                        class="relative inline-flex min-h-12 items-center gap-1.5 px-3 font-sans text-sm font-semibold whitespace-nowrap text-muted transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 hover:text-highlighted hover:after:bg-ivory-400 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-[current=true]:text-highlighted aria-[current=true]:after:bg-huella-slate-900"
                                        :class="tab.count === 0 && 'pointer-events-none opacity-50'"
                                        :aria-disabled="tab.count === 0 || undefined"
                                        @click.prevent="setQuery({ formato: tab.slug })"
                                    >
                                        {{ tab.label }}
                                        <span class="font-medium tabular-nums text-dimmed">{{ tab.count }}</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                        <label class="flex shrink-0 items-center pb-0.5 font-sans text-meta text-muted sm:-mr-2">
                            <span aria-hidden="true">Ordenar:</span>
                            <USelect
                                v-model="sort"
                                aria-label="Ordenar publicaciones"
                                variant="ghost"
                                trailing-icon="i-lucide-chevron-down"
                                :items="['Más recientes', 'Más antiguas']"
                                :ui="{ base: 'bg-transparent ps-2 pe-8 font-sans text-sm font-semibold text-highlighted hover:bg-huella-slate-900/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary', trailing: 'pe-2', trailingIcon: 'size-4 text-muted' }"
                            />
                        </label>
                    </div>

                    <p
                        class="flex min-h-12 flex-wrap items-center gap-x-2 font-sans text-meta text-muted"
                        aria-live="polite"
                    >
                        <span><strong class="font-semibold text-highlighted tabular-nums">{{ results.length }}</strong> {{ results.length === 1 ? "publicación" : "publicaciones" }}</span>
                        <template v-if="subtopic">
                            <span>en {{ subtopic }}</span>
                            <UButton
                                variant="link"
                                size="xl"
                                label="Quitar subtema"
                                icon="i-lucide-x"
                                class="min-h-11 px-2"
                                @click="setQuery({ subtema: undefined })"
                            />
                        </template>
                    </p>

                    <!-- Year groups: the year hangs in the margin from md up, like a volume heading -->
                    <div
                        v-for="[year, items] in years"
                        :key="year"
                        class="grid border-t border-default md:grid-cols-[5.5rem_1fr]"
                    >
                        <h3 class="pt-6 font-serif text-2xl leading-none text-huella-teal-600 tabular-nums md:sticky md:top-6 md:self-start md:pt-8">
                            {{ year }}
                        </h3>
                        <ol class="flex flex-col divide-y divide-(--ui-border-muted)">
                            <li
                                v-for="item in items"
                                :key="item.slug"
                                class="py-6 md:py-8"
                            >
                                <ArchiveRow :entry="item" />
                            </li>
                        </ol>
                    </div>

                    <div
                        v-if="!results.length"
                        class="border-t border-default py-12"
                    >
                        <p class="font-serif text-xl text-highlighted">
                            Aún no hay {{ formats.find((item) => item.slug === format)?.plural.toLowerCase() ?? "publicaciones" }} en {{ subtopic ?? subject.name }}.
                        </p>
                        <UButton
                            variant="link"
                            label="Ver todos los formatos"
                            trailing-icon="i-lucide-arrow-right"
                            class="mt-2 -ml-3"
                            @click="setQuery({ formato: undefined })"
                        />
                    </div>

                    <nav
                        v-if="results.length"
                        aria-label="Paginación"
                        class="flex min-h-12 items-center justify-between border-t border-default font-sans text-meta text-muted tabular-nums"
                    >
                        <UButton
                            variant="link"
                            icon="i-lucide-arrow-left"
                            label="Anterior"
                            disabled
                            class="-ml-3"
                        />
                        <span>Página 1 de 1</span>
                        <UButton
                            variant="link"
                            trailing-icon="i-lucide-arrow-right"
                            label="Siguiente"
                            disabled
                            class="-mr-3"
                        />
                    </nav>
                </section>

                <aside
                    aria-label="Explorar la materia"
                    class="flex flex-col gap-10 lg:col-span-4 lg:pt-3"
                >
                    <div>
                        <h2 class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                            Temas frecuentes aquí
                        </h2>
                        <ul class="mt-3 flex flex-col border-t border-(--ui-border-muted)">
                            <li
                                v-for="[name, count] in frequentTags"
                                :key="name"
                                class="border-b border-(--ui-border-muted)"
                            >
                                <a
                                    href="/lab/attempts/category-c"
                                    class="group flex min-h-11 items-center justify-between gap-3 font-serif text-base text-highlighted focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                >
                                    <span class="decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ name }}</span>
                                    <span class="font-sans text-meta tabular-nums text-muted">{{ count }}</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                            Otras materias
                        </h2>
                        <p class="mt-2 font-serif text-base leading-8 text-toned">
                            <template
                                v-for="(item, index) in subjects.filter((entry) => entry !== subject)"
                                :key="item.slug"
                            >
                                <a
                                    :href="`/lab/attempts/category-b?materia=${item.slug}`"
                                    data-inline
                                    class="text-highlighted underline decoration-huella-slate-300 underline-offset-[0.2em] hover:decoration-current"
                                >{{ item.name }}</a><span v-if="index < subjects.length - 2"> · </span>
                            </template>
                        </p>
                    </div>
                </aside>
            </div>

            <NewsletterBand />
        </main>

        <SiteFooter />

        <VariantNotes
            label="Materia · variante B"
            compare="/lab/publicaciones"
            v-bind="notes"
        />
    </div>
</template>
