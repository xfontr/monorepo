<script setup lang="ts">
import ArchiveRow from "~/lab/ArchiveRow.vue";
import FacetPanel, { type FacetGroup } from "~/lab/FacetPanel.vue";
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import { archive, formats, navB, series, subjects, type ArchiveEntry } from "~/lab/fixtures-b";
import { provideVariantB } from "~/lab/variant";

provideVariantB();
useHead({ title: "Publicaciones (C) · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const route = useRoute();
const router = useRouter();

const authorCounts = new Map<string, number>();

for (const item of archive)
    for (const person of item.authors)
        authorCounts.set(person.name, (authorCounts.get(person.name) ?? 0) + 1);

const facets: {
    key: string;
    label: string;
    limit?: number;
    options: { value: string; label: string }[];
    get: (entry: ArchiveEntry) => string[];
}[] = [
    {
        key: "materia",
        label: "Materia",
        options: subjects.map((item) => ({ value: item.slug, label: item.name })),
        get: (entry) => [entry.subject],
    },
    {
        key: "formato",
        label: "Formato",
        options: formats.map((item) => ({ value: item.slug, label: item.name })),
        get: (entry) => [entry.format],
    },
    {
        key: "serie",
        label: "Serie",
        options: series.map((item) => ({ value: item.slug, label: item.name })),
        get: (entry) => (entry.series ? [entry.series.slug] : []),
    },
    {
        key: "anio",
        label: "Año",
        options: [...new Set(archive.map((item) => String(item.year)))].map((year) => ({
            value: year,
            label: year,
        })),
        get: (entry) => [String(entry.year)],
    },
    {
        key: "autor",
        label: "Colaborador",
        limit: 5,
        options: [...authorCounts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
            .map(([name]) => ({ value: name, label: name })),
        get: (entry) => entry.authors.map((person) => person.name),
    },
];

const selected = (key: string) => {
    const value = route.query[key];

    return typeof value === "string" && value ? value.split(",") : [];
};

const search = computed({
    get: () => (typeof route.query.q === "string" ? route.query.q : ""),
    set: (value: string) => router.replace({ query: { ...route.query, q: value || undefined } }),
});

const normalise = (text: string) =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

const matches = (entry: ArchiveEntry, except?: string) => {
    const needle = normalise(search.value.trim());
    const haystack = normalise(
        [
            entry.title,
            entry.excerpt,
            ...entry.authors.map((person) => person.name),
            ...entry.tags,
        ].join(" "),
    );

    return (
        (!needle || haystack.includes(needle)) &&
        facets.every(
            (facet) =>
                facet.key === except ||
                !selected(facet.key).length ||
                facet.get(entry).some((value) => selected(facet.key).includes(value)),
        )
    );
};

const oldestFirst = computed(() => route.query.orden === "antiguas");
const sort = computed({
    get: () => (oldestFirst.value ? "Más antiguas" : "Más recientes"),
    set: (value: string) =>
        router.replace({
            query: { ...route.query, orden: value === "Más antiguas" ? "antiguas" : undefined },
        }),
});

const results = computed(() => {
    const list = archive.filter((entry) => matches(entry));

    return oldestFirst.value ? [...list].reverse() : list;
});

// Each option counts what it would add given every *other* active facet, so a count is never a dead end
const groups = computed<FacetGroup[]>(() =>
    facets.map((facet) => ({
        key: facet.key,
        label: facet.label,
        limit: facet.limit,
        options: facet.options.map((option) => ({
            ...option,
            checked: selected(facet.key).includes(option.value),
            count: archive.filter(
                (entry) => matches(entry, facet.key) && facet.get(entry).includes(option.value),
            ).length,
        })),
    })),
);

const active = computed(() =>
    facets.flatMap((facet) =>
        selected(facet.key).map((value) => ({
            key: facet.key,
            value,
            label: facet.options.find((option) => option.value === value)?.label ?? value,
        })),
    ),
);

const toggle = (key: string, value: string) => {
    const current = selected(key);
    const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

    router.replace({ query: { ...route.query, [key]: next.join(",") || undefined } });
};

const clear = () => router.replace({ query: { orden: route.query.orden } });

const filtersOpen = ref(false);

const notes = {
    changes: [
        "Una sola página de archivo con facetas; cada materia es un filtro guardado (?materia=derecho-penal) en lugar de una plantilla aparte.",
        "Facetas independientes: materia, formato, serie, año y colaborador, como Lawfare y el blog de LPE. Las etiquetas quedan en el artículo, no aquí.",
        "Cada recuento tiene en cuenta el resto de filtros activos, así que ninguna opción lleva a cero resultados; las que sí lo harían se desactivan.",
        "Búsqueda dentro del archivo sin acentos: «prision» encuentra «prisión».",
        "En móvil, las facetas van en un panel con «Ver N resultados» y los filtros activos se quitan de uno en uno.",
        "Todo el estado vive en la URL, así que un listado filtrado se puede enlazar y citar.",
    ],
    sources: [
        {
            element: "Materia, año, colaborador",
            source: "wp/v2/posts?categories=&after=&before=&author= y x-wp-total para los recuentos. Core.",
        },
        {
            element: "Recuentos cruzados",
            source: "Una consulta por opción visible, o un índice propio construido en el servidor (Nitro) y cacheado. Decidir en S2.",
            risk: true,
        },
        {
            element: "Formato y serie",
            source: "Dependen de la convención de categorías o etiquetas que fije S1.",
            risk: true,
        },
        {
            element: "Búsqueda",
            source: "wp/v2/posts?search= busca en título y contenido; no ignora acentos ni busca por autor. La versión de aquí necesita índice propio.",
            risk: true,
        },
    ],
};
</script>

<template>
    <div>
        <SiteHeader current="Publicaciones" :nav="navB" />

        <main>
            <section class="border-b border-default">
                <div class="mx-auto max-w-site px-4 pt-6 pb-10 md:px-8 md:pt-10 lg:px-12 lg:pb-12">
                    <UBreadcrumb
                        :items="[
                            { label: 'Portada', to: '/lab/attempts/home-b' },
                            { label: 'Publicaciones' },
                        ]"
                        :ui="{
                            link: 'font-sans text-meta min-h-11 inline-flex items-center',
                            separatorIcon: 'size-4',
                        }"
                    />
                    <div class="mt-6 grid gap-6 md:mt-8 lg:grid-cols-12 lg:items-end lg:gap-12">
                        <div class="lg:col-span-7">
                            <Kicker>Archivo · desde 2020</Kicker>
                            <h1
                                class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted md:text-[3.5rem]"
                            >
                                Publicaciones
                            </h1>
                            <p
                                class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned"
                            >
                                Todo lo publicado en Huella Legal: {{ archive.length }} textos en
                                {{ subjects.length }} materias, de artículos doctrinales a trabajos
                                de fin de grado.
                            </p>
                        </div>
                        <UFormField label="Buscar en el archivo" class="lg:col-span-5">
                            <UInput
                                v-model="search"
                                type="search"
                                icon="i-lucide-search"
                                placeholder="Título, autor o tema"
                                class="w-full"
                            />
                        </UFormField>
                    </div>
                </div>
            </section>

            <div
                class="mx-auto grid max-w-site grid-cols-1 gap-x-12 px-4 pt-6 pb-16 md:px-8 lg:grid-cols-12 lg:px-12 lg:pt-10 lg:pb-20"
            >
                <aside aria-label="Filtros" class="hidden lg:col-span-3 lg:block">
                    <div class="sticky top-6">
                        <FacetPanel :groups id-prefix="rail" @toggle="toggle" />
                    </div>
                </aside>

                <section aria-labelledby="resultados" class="min-w-0 lg:col-span-9">
                    <div
                        class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-default pb-2"
                    >
                        <h2
                            id="resultados"
                            class="font-sans text-meta text-muted"
                            aria-live="polite"
                        >
                            <strong class="font-semibold text-highlighted tabular-nums">{{
                                results.length
                            }}</strong>
                            de {{ archive.length }} publicaciones
                        </h2>
                        <div class="flex items-center gap-2">
                            <UButton
                                variant="outline"
                                color="neutral"
                                icon="i-lucide-sliders-horizontal"
                                :label="active.length ? `Filtrar · ${active.length}` : 'Filtrar'"
                                class="lg:hidden"
                                @click="filtersOpen = true"
                            />
                            <label
                                class="flex shrink-0 items-center font-sans text-meta text-muted sm:-mr-2"
                            >
                                <span aria-hidden="true" class="max-sm:sr-only">Ordenar:</span>
                                <USelect
                                    v-model="sort"
                                    aria-label="Ordenar publicaciones"
                                    variant="ghost"
                                    trailing-icon="i-lucide-chevron-down"
                                    :items="['Más recientes', 'Más antiguas']"
                                    :ui="{
                                        base: 'bg-transparent ps-2 pe-8 font-sans text-sm font-semibold text-highlighted hover:bg-huella-slate-900/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                                        trailing: 'pe-2',
                                        trailingIcon: 'size-4 text-muted',
                                    }"
                                />
                            </label>
                        </div>
                    </div>

                    <ul
                        v-if="active.length"
                        aria-label="Filtros activos"
                        class="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-(--ui-border-muted) py-2"
                    >
                        <li v-for="item in active" :key="`${item.key}-${item.value}`">
                            <button
                                type="button"
                                :aria-label="`Quitar filtro: ${item.label}`"
                                class="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-xs border border-default bg-ivory-50 px-3 text-left font-sans text-sm font-medium text-highlighted transition-colors hover:border-huella-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                @click="toggle(item.key, item.value)"
                            >
                                {{ item.label }}
                                <UIcon name="i-lucide-x" class="size-3.5 shrink-0 text-muted" />
                            </button>
                        </li>
                        <li>
                            <UButton
                                variant="link"
                                label="Borrar todo"
                                class="px-2"
                                @click="clear"
                            />
                        </li>
                    </ul>

                    <ol
                        v-if="results.length"
                        class="flex flex-col divide-y divide-(--ui-border-muted)"
                    >
                        <li v-for="item in results" :key="item.slug" class="py-6 md:py-7">
                            <ArchiveRow :entry="item" show-subject />
                        </li>
                    </ol>

                    <div v-else class="py-12">
                        <p class="font-serif text-xl text-highlighted">
                            Nada coincide con esta combinación.
                        </p>
                        <p
                            class="mt-2 max-w-measure font-serif text-base leading-relaxed text-toned"
                        >
                            Prueba a quitar un filtro o a buscar con menos palabras. Si echas en
                            falta un tema, quizá sea el artículo que tú puedes escribir.
                        </p>
                        <div class="-ml-3 mt-3 flex flex-wrap gap-1">
                            <UButton variant="link" label="Borrar filtros" @click="clear" />
                            <UButton
                                variant="link"
                                label="Proponer un artículo"
                                trailing-icon="i-lucide-arrow-right"
                                to="/lab/publicar"
                            />
                        </div>
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
            </div>

            <USlideover
                v-model:open="filtersOpen"
                side="right"
                title="Filtrar publicaciones"
                :ui="{
                    content: 'bg-ivory-50 max-w-sm',
                    header: 'border-b border-default min-h-16 px-4',
                    body: 'px-4 py-5',
                    footer: 'border-t border-default p-4 flex-col items-stretch',
                }"
            >
                <template #header>
                    <p class="font-serif text-xl text-highlighted">Filtrar</p>
                    <UButton
                        square
                        variant="ghost"
                        color="neutral"
                        icon="i-lucide-x"
                        aria-label="Cerrar filtros"
                        class="ml-auto"
                        @click="filtersOpen = false"
                    />
                </template>
                <template #body>
                    <FacetPanel :groups id-prefix="sheet" @toggle="toggle" />
                </template>
                <template #footer>
                    <UButton
                        block
                        :label="`Ver ${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`"
                        @click="filtersOpen = false"
                    />
                    <UButton
                        v-if="active.length"
                        block
                        variant="ghost"
                        color="neutral"
                        label="Borrar filtros"
                        @click="clear"
                    />
                </template>
            </USlideover>

            <NewsletterBand />
        </main>

        <SiteFooter />

        <VariantNotes label="Archivo · variante C" compare="/lab/publicaciones" v-bind="notes" />
    </div>
</template>
