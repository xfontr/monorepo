<script setup lang="ts">
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import { tags } from "~/lab/fixtures";
import { archive, formats, navB, series, seriesEntries, subjects, tagIndex } from "~/lab/fixtures-b";
import { provideVariantB } from "~/lab/variant";

provideVariantB();
useHead({ title: "Materias (B) · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const count = (predicate: (entry: typeof archive[number]) => boolean) => archive.filter(predicate).length;
const publications = (total: number) => `${total} ${total === 1 ? "publicación" : "publicaciones"}`;
const tagCount = (name: string) => count((entry) => entry.tags.includes(name)) || (tags.find(([tag]) => tag === name)?.[1] ?? 1);

const letters = computed(() => {
    const groups = new Map<string, string[]>();

    for (const name of tagIndex) {
        const letter = name[0]!.normalize("NFD")[0]!.toUpperCase();

        groups.set(letter, [...(groups.get(letter) ?? []), name]);
    }

    return [...groups.entries()];
});

const notes = {
    changes: [
        "Cuatro ejes separados en una sola página: materia, formato, serie y tema. En A, «Ensayos jurídicos» y «TFG y TFM» eran materias; aquí son formatos.",
        "Materias a dos niveles: cada una enseña sus subtemas, como las secciones de Aeon o los temas de Just Security.",
        "Los TFG y TFM dejan de ser una materia más y pasan a formato con su propia entrada, como la «Student Writing» de la Harvard Law Review.",
        "Los temas pasan de nube de píldoras a índice alfabético con letras, como el de la Yale Law Journal: se escanea mejor cuando crezcan.",
    ],
    sources: [
        { element: "Subtemas", source: "Categorías hijas en WP (parent). Core, pero exige reclasificar lo publicado." },
        { element: "Formatos", source: "Sin convención todavía: categoría madre «Formato» o etiquetas con prefijo. S1.", risk: true },
        { element: "Series", source: "Etiqueta por serie; la descripción sale de la descripción del término. Core." },
        { element: "Índice A–Z", source: "wp/v2/tags?per_page=100, con recuento incluido. Core." },
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
                <div class="mx-auto max-w-site px-4 pt-6 pb-10 md:px-8 md:pt-10 lg:px-12 lg:pb-12">
                    <UBreadcrumb
                        :items="[{ label: 'Portada', to: '/lab/attempts/home-b' }, { label: 'Materias' }]"
                        :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                    />
                    <Kicker class="mt-6 md:mt-8">
                        Índice
                    </Kicker>
                    <h1 class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted md:text-[3.5rem]">
                        Materias
                    </h1>
                    <p class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned">
                        Cada texto pertenece a una materia y tiene un formato. Las series los ordenan para leerlos seguidos, y los temas cruzan todas las materias.
                    </p>
                    <nav
                        aria-label="En esta página"
                        class="-ml-3 mt-5 flex flex-wrap font-sans text-sm font-semibold"
                    >
                        <a
                            v-for="link in [['#materias', `${subjects.length} materias`], ['#formatos', `${formats.length} formatos`], ['#series', `${series.length} serie`], ['#temas', `${tagIndex.length} temas`]]"
                            :key="link[0]"
                            :href="link[0]"
                            class="inline-flex min-h-11 items-center px-3 text-primary underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                        >{{ link[1] }}</a>
                    </nav>
                </div>
            </section>

            <section
                aria-labelledby="materias"
                class="mx-auto max-w-site px-4 py-12 md:px-8 lg:px-12 lg:py-16"
            >
                <h2
                    id="materias"
                    class="scroll-mt-6 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                >
                    Materias
                </h2>
                <ol class="mt-4 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                    <li
                        v-for="(item, index) in subjects"
                        :key="item.slug"
                        class="flex flex-col gap-2 border-t border-default pt-5 pb-10"
                    >
                        <span class="flex items-baseline justify-between gap-4 font-sans text-xs font-semibold tabular-nums text-secondary">
                            <span>{{ String(index + 1).padStart(2, "0") }}</span>
                            <span class="font-medium text-muted">{{ publications(count((entry) => entry.subject === item.slug)) }}</span>
                        </span>
                        <a
                            :href="`/lab/attempts/category-b?materia=${item.slug}`"
                            class="font-serif text-h3 text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                        >{{ item.name }}</a>
                        <p class="font-serif text-base leading-relaxed text-toned">
                            {{ item.description }}
                        </p>
                        <ul class="mt-1 flex flex-col border-t border-(--ui-border-muted)">
                            <li
                                v-for="name in item.subtopics"
                                :key="name"
                                class="border-b border-(--ui-border-muted)"
                            >
                                <a
                                    :href="`/lab/attempts/category-b?materia=${item.slug}&subtema=${encodeURIComponent(name)}`"
                                    class="group flex min-h-11 items-center justify-between gap-3 py-1 font-sans text-sm font-medium text-toned focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                >
                                    <span class="decoration-huella-slate-300 underline-offset-4 group-hover:text-highlighted group-hover:underline">{{ name }}</span>
                                    <span class="text-meta tabular-nums text-dimmed">{{ count((entry) => entry.subtopic === name) }}</span>
                                </a>
                            </li>
                        </ul>
                    </li>
                </ol>
            </section>

            <section
                aria-labelledby="formatos"
                class="border-y border-default bg-ivory-50"
            >
                <div class="mx-auto max-w-site px-4 py-12 md:px-8 lg:px-12 lg:py-16">
                    <h2
                        id="formatos"
                        class="scroll-mt-6 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                    >
                        Formatos
                    </h2>
                    <ul class="mt-4 grid gap-px overflow-hidden rounded-xs border border-default bg-(--ui-border) sm:grid-cols-2 lg:grid-cols-4">
                        <li
                            v-for="item in formats"
                            :key="item.slug"
                            class="bg-ivory-50"
                            :class="item.slug === 'tfg-tfm' && 'bg-huella-slate-900!'"
                        >
                            <a
                                :href="`/lab/attempts/category-c?formato=${item.slug}`"
                                class="group flex h-full flex-col gap-2 p-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary md:p-6"
                                :class="item.slug === 'tfg-tfm' ? 'hover:bg-huella-slate-800' : 'hover:bg-ivory-100'"
                            >
                                <Kicker :tone="item.slug === 'tfg-tfm' ? 'paper' : 'teal'">
                                    {{ item.slug === 'tfg-tfm' ? 'Archivo académico' : 'Formato' }} · {{ count((entry) => entry.format === item.slug) }}
                                </Kicker>
                                <span
                                    class="font-serif text-h3 group-hover:underline decoration-1 underline-offset-[0.2em]"
                                    :class="item.slug === 'tfg-tfm' ? 'text-ivory-50' : 'text-highlighted decoration-huella-slate-300'"
                                >{{ item.plural }}</span>
                                <span
                                    class="font-serif text-base leading-relaxed"
                                    :class="item.slug === 'tfg-tfm' ? 'text-huella-slate-200' : 'text-toned'"
                                >{{ item.description }}</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </section>

            <section
                aria-labelledby="series"
                class="mx-auto grid max-w-site gap-8 px-4 py-12 md:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-16"
            >
                <div class="lg:col-span-4">
                    <h2
                        id="series"
                        class="scroll-mt-6 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                    >
                        Series
                    </h2>
                    <a
                        v-for="item in series"
                        :key="item.slug"
                        href="/lab/attempts/serie-b"
                        class="mt-4 block font-serif text-h2 text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                    >{{ item.name }}</a>
                    <p class="mt-3 font-serif text-base leading-relaxed text-toned">
                        {{ series[0]!.description }}
                    </p>
                </div>
                <ol class="flex flex-col border-t-2 border-huella-slate-900 lg:col-span-8">
                    <li
                        v-for="entry in seriesEntries('fundamentos')"
                        :key="entry.slug"
                        class="border-b border-(--ui-border-muted)"
                    >
                        <a
                            href="/lab/attempts/article-b"
                            class="group grid min-h-14 grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-2 py-3 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            <span class="font-serif text-2xl leading-none text-huella-teal-600 tabular-nums">{{ entry.series!.position }}</span>
                            <span class="font-serif text-lg leading-snug text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ entry.title }}</span>
                            <span class="font-sans text-meta tabular-nums text-muted">{{ entry.readingMinutes }} min</span>
                        </a>
                    </li>
                </ol>
            </section>

            <section
                aria-labelledby="temas"
                class="border-t border-default"
            >
                <div class="mx-auto max-w-site px-4 py-12 md:px-8 lg:px-12 lg:py-16">
                    <div class="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2
                                id="temas"
                                class="scroll-mt-6 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                            >
                                Temas de la A a la Z
                            </h2>
                            <p class="mt-2 max-w-measure font-serif text-base leading-relaxed text-toned">
                                Etiquetas que cruzan varias materias: «Jurisprudencia» reúne comentarios de penal, civil y constitucional.
                            </p>
                        </div>
                    </div>
                    <div class="mt-6 gap-x-10 sm:columns-2 lg:columns-4">
                        <section
                            v-for="[letter, names] in letters"
                            :key="letter"
                            :aria-label="`Temas con ${letter}`"
                            class="mb-6 break-inside-avoid"
                        >
                            <p
                                class="border-b border-default pb-1 font-serif text-2xl text-huella-teal-600"
                                aria-hidden="true"
                            >
                                {{ letter }}
                            </p>
                            <ul>
                                <li
                                    v-for="name in names"
                                    :key="name"
                                >
                                    <a
                                        href="/lab/attempts/category-c"
                                        class="group flex min-h-11 items-center justify-between gap-3 font-serif text-base text-highlighted focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                    >
                                        <span class="decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ name }}</span>
                                        <span class="font-sans text-meta tabular-nums text-muted">{{ tagCount(name) }}</span>
                                    </a>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
            </section>

            <NewsletterBand />
        </main>

        <SiteFooter />

        <VariantNotes
            label="Materias · variante B"
            compare="/lab/categorias"
            v-bind="notes"
        />
    </div>
</template>
