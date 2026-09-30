<script setup lang="ts">
import ArchiveRow from "~/lab/ArchiveRow.vue";
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import { formats, subjects, type FormatSlug } from "~/lab/fixtures-b";
import { archiveD, countIn } from "~/lab/fixtures-d";

const route = useRoute();
const router = useRouter();
const one = (value: unknown) => (typeof value === "string" && value ? value : undefined);
const tabHref = (slug?: string) => (slug ? `?formato=${slug}` : "?");
const setQuery = (patch: Record<string, string | undefined>) => router.replace({ query: { ...route.query, ...patch } });

const subject = computed(() => subjects.find((item) => item.slug === one(route.query.materia)));
const format = computed(() => one(route.query.formato) as FormatSlug | undefined);
const oldestFirst = computed(() => route.query.orden === "antiguas");

useHead({ title: () => `${subject.value?.name ?? "Publicaciones"} · Laboratorio Huella Legal`, htmlAttrs: { lang: "es" } });

const search = computed({
    get: () => one(route.query.q) ?? "",
    set: (value: string) => setQuery({ q: value || undefined }),
});

const sort = computed({
    get: () => (oldestFirst.value ? "Más antiguas" : "Más recientes"),
    set: (value: string) => setQuery({ orden: value === "Más antiguas" ? "antiguas" : undefined }),
});

const normalise = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const scoped = computed(() => {
    const needle = normalise(search.value.trim());

    return archiveD.filter((entry) => (!subject.value || entry.subject === subject.value.slug)
      && (!needle || normalise([entry.title, entry.excerpt, entry.category, ...entry.authors.map((person) => person.name), ...entry.tags].join(" ")).includes(needle)));
});

// A tab with nothing behind it is noise, and one format alone needs no tabs at all
const tabs = computed(() => {
    const present = formats
        .map((item) => ({ slug: item.slug, label: item.plural, count: scoped.value.filter((entry) => entry.format === item.slug).length }))
        .filter((item) => item.count > 0 || item.slug === format.value);

    return present.length > 1 ? [{ slug: undefined, label: "Todo", count: scoped.value.length }, ...present] : [];
});

const results = computed(() => {
    const list = scoped.value.filter((entry) => subject.value || !format.value || entry.format === format.value);

    return oldestFirst.value ? [...list].reverse() : list;
});

const perPage = 20;
const page = ref(1);
const pageCount = computed(() => Math.max(1, Math.ceil(results.value.length / perPage)));
const visible = computed(() => results.value.slice((page.value - 1) * perPage, page.value * perPage));

watch(() => route.query, () => (page.value = 1));

const notes = {
    changes: [
        "Una sola plantilla para el archivo y para cada materia (?materia=): un único listado que aprender.",
        "Filas de texto con miniatura a la derecha desde 640 px; en móvil, solo texto. Más pequeña que la de A (11rem frente a 13rem).",
        "El antetítulo dice el formato, nunca la materia de la página; en el archivo general añade la materia.",
        "En el archivo, búsqueda sin acentos y una fila de formatos que solo muestra los que tienen textos. Sin facetas cruzadas: con unas 7 entradas por materia no hacen falta.",
        "En la materia, lista simple por fecha, como la Harvard Law Review o la Yale Law Journal.",
        "Paginador de 20 en 20, que solo aparece si hay más de una página. «Más leídas» desaparece: no hay datos.",
    ],
    sources: [
        { element: "Materia y recuentos", source: "wp/v2/posts?categories= y x-wp-total. Core." },
        { element: "Formato", source: "Mapa de términos de la ADR 0027." },
        { element: "Miniatura", source: "wp:featuredmedia, tamaño medium, en diferido." },
        { element: "Búsqueda sin acentos", source: "wp/v2/posts?search= no ignora acentos. Con 105 entradas basta un índice de títulos y extractos construido en Nitro y cacheado.", risk: true },
    ],
};
</script>

<template>
    <div>
        <SiteHeader
            current="Publicaciones"
        />

        <main>
            <section class="border-b border-default">
                <div class="mx-auto max-w-site px-4 pt-6 pb-10 md:px-8 md:pt-10 lg:px-12 lg:pb-12">
                    <UBreadcrumb
                        :items="subject
                            ? [{ label: 'Portada', to: '/lab/home' }, { label: 'Publicaciones', to: '/lab/publicaciones' }, { label: subject.name }]
                            : [{ label: 'Portada', to: '/lab/home' }, { label: 'Publicaciones' }]"
                        :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                    />
                    <div class="mt-6 grid gap-6 md:mt-8 lg:grid-cols-12 lg:items-end lg:gap-12">
                        <div class="lg:col-span-7">
                            <Kicker>{{ subject ? "Materia" : "Archivo" }} · {{ scoped.length }} publicaciones</Kicker>
                            <h1 class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted md:text-[3.5rem]">
                                {{ subject?.name ?? "Publicaciones" }}
                            </h1>
                            <p class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned text-pretty">
                                {{ subject?.description ?? `Todo lo publicado en Huella Legal, de artículos doctrinales a trabajos de fin de grado, en ${subjects.length} materias.` }}
                            </p>
                        </div>
                        <UFormField
                            v-if="!subject"
                            label="Buscar en el archivo"
                            class="lg:col-span-5"
                        >
                            <UInput
                                v-model="search"
                                type="search"
                                size="xl"
                                icon="i-lucide-search"
                                placeholder="Título, autor o tema"
                                class="w-full"
                            />
                        </UFormField>
                    </div>
                </div>
            </section>

            <div class="mx-auto grid max-w-site grid-cols-1 gap-12 px-4 pt-6 pb-16 md:px-8 lg:grid-cols-12 lg:gap-x-12 lg:px-12 lg:pb-20">
                <section
                    aria-labelledby="listado"
                    class="min-w-0 lg:col-span-8"
                >
                    <div
                        class="flex flex-wrap items-center justify-between gap-x-6"
                        :class="(subject || !tabs.length) && 'border-b border-default'"
                    >
                        <nav
                            v-if="!subject && tabs.length"
                            aria-label="Formato"
                            class="-mx-4 basis-[calc(100%+2rem)] overflow-x-auto border-b border-default px-4 [scrollbar-width:none] sm:mx-0 sm:basis-full sm:px-0"
                        >
                            <ul class="-ml-3 flex">
                                <li
                                    v-for="tab in tabs"
                                    :key="tab.label"
                                >
                                    <a
                                        :href="tabHref(tab.slug)"
                                        :aria-current="format === tab.slug ? 'true' : undefined"
                                        class="relative inline-flex min-h-12 items-center gap-1.5 px-3 font-sans text-sm font-semibold whitespace-nowrap text-muted transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 hover:text-highlighted hover:after:bg-ivory-400 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-[current=true]:text-highlighted aria-[current=true]:after:bg-huella-slate-900"
                                        @click.prevent="setQuery({ formato: tab.slug })"
                                    >
                                        {{ tab.label }}
                                        <span class="font-medium tabular-nums text-dimmed">{{ tab.count }}</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                        <h2
                            id="listado"
                            class="flex min-h-12 items-center font-sans text-meta text-muted"
                            aria-live="polite"
                        >
                            <span><strong class="font-semibold text-highlighted tabular-nums">{{ results.length }}</strong> {{ results.length === 1 ? "publicación" : "publicaciones" }}{{ search ? ` para «${search}»` : "" }}</span>
                        </h2>
                        <label class="-mr-2 flex shrink-0 items-center font-sans text-meta text-muted">
                            <span aria-hidden="true">Ordenar:</span>
                            <USelect
                                v-model="sort"
                                aria-label="Ordenar publicaciones"
                                variant="ghost"
                                trailing-icon="i-lucide-chevron-down"
                                :items="['Más recientes', 'Más antiguas']"
                                :ui="{ base: 'min-h-11 bg-transparent ps-2 pe-8 font-sans text-sm font-semibold text-highlighted hover:bg-huella-slate-900/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary', trailing: 'pe-2', trailingIcon: 'size-4 text-muted' }"
                            />
                        </label>
                    </div>

                    <ol
                        v-if="visible.length"
                        class="flex flex-col divide-y divide-(--ui-border-muted)"
                    >
                        <li
                            v-for="item in visible"
                            :key="item.slug"
                            class="py-6 md:py-8"
                        >
                            <ArchiveRow
                                :entry="item"
                                :show-subject="!subject"
                                media
                            />
                        </li>
                    </ol>

                    <div
                        v-else
                        class="py-12"
                    >
                        <p class="font-serif text-xl text-highlighted">
                            {{ search ? `Nada coincide con «${search}».` : "Aún no hay publicaciones aquí." }}
                        </p>
                        <p class="mt-2 max-w-measure font-serif text-base leading-relaxed text-toned">
                            Prueba con menos palabras o con otro formato. Si echas en falta un tema, quizá sea el artículo que tú puedes escribir.
                        </p>
                        <div class="-ml-3 mt-3 flex flex-wrap gap-1">
                            <UButton
                                variant="link"
                                label="Ver todo el archivo"
                                @click="router.replace({ query: {} })"
                            />
                            <UButton
                                variant="link"
                                label="Proponer un artículo"
                                trailing-icon="i-lucide-arrow-right"
                                to="/lab/publicar"
                            />
                        </div>
                    </div>

                    <nav
                        v-if="pageCount > 1"
                        aria-label="Paginación"
                        class="flex min-h-12 items-center justify-between border-t border-default font-sans text-meta text-muted tabular-nums"
                    >
                        <UButton
                            variant="link"
                            icon="i-lucide-arrow-left"
                            label="Anterior"
                            :disabled="page === 1"
                            class="-ml-3 min-h-12"
                            @click="page--"
                        />
                        <span>Página {{ page }} de {{ pageCount }}</span>
                        <UButton
                            variant="link"
                            trailing-icon="i-lucide-arrow-right"
                            label="Siguiente"
                            :disabled="page === pageCount"
                            class="-mr-3 min-h-12"
                            @click="page++"
                        />
                    </nav>
                </section>

                <aside
                    aria-label="Explorar"
                    class="lg:col-span-4"
                >
                    <h2 class="flex min-h-12 items-center font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                        {{ subject ? "Otras materias" : "Materias" }}
                    </h2>
                    <ul class="flex flex-col border-t border-(--ui-border-muted)">
                        <li
                            v-for="item in subjects.filter((entry) => entry !== subject)"
                            :key="item.slug"
                            class="border-b border-(--ui-border-muted)"
                        >
                            <a
                                :href="`/lab/publicaciones?materia=${item.slug}`"
                                class="group flex min-h-11 items-center justify-between gap-3 py-1 font-serif text-base text-highlighted focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                            >
                                <span class="decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ item.name }}</span>
                                <span class="font-sans text-meta tabular-nums text-muted">{{ countIn(item.slug) }}</span>
                            </a>
                        </li>
                    </ul>
                    <UButton
                        v-if="subject"
                        variant="link"
                        label="Todo el archivo"
                        trailing-icon="i-lucide-arrow-right"
                        to="/lab/publicaciones"
                        class="mt-2 -ml-3"
                    />
                </aside>
            </div>

            <NewsletterBand />
        </main>

        <SiteFooter />

        <VariantNotes
            :label="subject ? 'Materia · notas' : 'Archivo · notas'"
            v-bind="notes"
        />
    </div>
</template>
