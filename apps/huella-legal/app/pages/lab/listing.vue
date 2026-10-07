<script setup lang="ts">
import LabKicker from "~/lab/Kicker.vue";

useHead({ title: "Listados · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const route = useRoute();
const page = computed(() => Number(route.query.page ?? 1));
const pageLink = (target: number) => ({ query: { ...route.query, page: target > 1 ? String(target) : undefined } });

const sort = ref<"newest" | "oldest">("newest");

const formats = [
    { label: "Todo", slug: undefined, count: 29 },
    { label: "Artículos", slug: "articulo", count: 17 },
    { label: "Ensayos", slug: "ensayo", count: 6 },
    { label: "TFG y TFM", slug: "tfg", count: 4 },
    { label: "Comentarios de jurisprudencia", slug: "comentario", count: 2 },
];
const pills = computed(() => formats.map((item) => ({
    label: item.label,
    count: item.count,
    to: { query: { ...route.query, formato: item.slug } },
    active: route.query.formato === item.slug,
})));

const subjects = ["Derecho penal", "Derecho civil", "Derecho constitucional", "Teoría del Derecho"].map((label) => ({ label, to: "/lab/publicaciones" }));
</script>

<template>
    <main class="mx-auto flex max-w-site flex-col gap-12 px-4 py-10 md:px-8 lg:px-12">
        <p class="font-sans text-sm text-muted">
            <span class="rounded-full bg-huella-ink-900 px-2 py-0.5 text-xs font-semibold text-white">Laboratorio</span>
            Cada componente enlaza a la página del laboratorio de la que sale, para compararlos.
        </p>

        <section class="flex flex-col gap-4">
            <LabKicker href="/lab/category">
                Pagination · /lab/category
            </LabKicker>
            <ListingPagination
                :page
                :total="48"
                :per-page="7"
                :to="pageLink"
            />
            <ListingPagination
                :page="10"
                :total="140"
                :per-page="7"
                :to="pageLink"
            />
        </section>

        <section class="flex flex-col gap-4">
            <LabKicker href="/lab/publicaciones">
                FilterPills · /lab/publicaciones · SortSelect · /lab/category
            </LabKicker>
            <div class="flex flex-wrap items-center justify-between gap-x-6">
                <ListingFilterPills
                    label="Formato"
                    :items="pills"
                    class="-mx-4 basis-[calc(100%+2rem)] px-4 sm:mx-0 sm:basis-full sm:px-0"
                />
                <h2 class="flex min-h-12 items-center font-sans text-meta text-muted">
                    <span><strong class="font-semibold text-highlighted tabular-nums">29</strong> publicaciones</span>
                </h2>
                <ListingSortSelect v-model="sort" />
            </div>
        </section>

        <section class="flex flex-col gap-4">
            <LabKicker href="/lab/estados">
                NoResults · EmptyState · SkeletonList · /lab/estados
            </LabKicker>
            <div class="grid gap-6 lg:grid-cols-2">
                <ListingNoResults
                    query="kardashov"
                    :subjects
                />
                <ListingEmptyState
                    subject="Derecho administrativo"
                    publish-to="/lab/publicar"
                    browse-to="/lab/categorias"
                />
                <div class="rounded-sm border border-default px-5 py-10 md:px-12">
                    <ListingSkeletonList />
                </div>
            </div>
        </section>
    </main>
</template>
