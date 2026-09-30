<script setup lang="ts">
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import { tags } from "~/lab/fixtures";
import { formats, subjects, tagIndex } from "~/lab/fixtures-b";
import { archiveD, countIn } from "~/lab/fixtures-d";

useHead({ title: "Materias · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const publications = (total: number) => `${total} ${total === 1 ? "publicación" : "publicaciones"}`;
const tagCount = (name: string) => archiveD.filter((entry) => entry.tags.includes(name)).length || (tags.find(([tag]) => tag === name)?.[1] ?? 1);

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
        "Tres ejes separados: materia, formato y tema. «Ensayos» y «TFG y TFM» dejan de ser materias.",
        "Nueve materias que llenan una rejilla de tres, sin la fila huérfana de A. Toda la tarjeta es el enlace.",
        "Sin series, porque la ADR 0027 no encontró datos, y sin subtemas: serían categorías hijas en WP, pero exigen reclasificar las 105 entradas.",
        "Los temas, en índice alfabético como en B; cada uno abre el archivo con ese tema buscado.",
    ],
    sources: [
        { element: "Materias y recuentos", source: "wp/v2/categories con count. Core." },
        { element: "Formatos", source: "Mapa de términos de la ADR 0027." },
        { element: "Índice A–Z", source: "wp/v2/tags?per_page=100, con recuento. Core." },
    ],
};
</script>

<template>
    <div>
        <SiteHeader
            current="Materias"
        />

        <main>
            <section class="border-b border-default">
                <div class="mx-auto max-w-site px-4 pt-6 pb-10 md:px-8 md:pt-10 lg:px-12 lg:pb-12">
                    <UBreadcrumb
                        :items="[{ label: 'Portada', to: '/lab/home' }, { label: 'Materias' }]"
                        :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                    />
                    <Kicker class="mt-6 md:mt-8">
                        Índice
                    </Kicker>
                    <h1 class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted md:text-[3.5rem]">
                        Materias
                    </h1>
                    <p class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned text-pretty">
                        Cada texto pertenece a una materia y tiene un formato. Los temas cruzan todas las materias.
                    </p>
                    <nav
                        aria-label="En esta página"
                        class="-ml-3 mt-5 flex flex-wrap font-sans text-sm font-semibold"
                    >
                        <a
                            v-for="link in [['#materias', `${subjects.length} materias`], ['#formatos', `${formats.length} formatos`], ['#temas', `${tagIndex.length} temas`]]"
                            :key="link[0]"
                            :href="link[0]"
                            class="inline-flex min-h-11 items-center px-3 text-primary underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                        >{{ link[1] }}</a>
                    </nav>
                </div>
            </section>

            <section
                aria-labelledby="materias"
                class="mx-auto max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20"
            >
                <h2
                    id="materias"
                    class="scroll-mt-6 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                >
                    Materias
                </h2>
                <ol class="mt-4 -mb-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                    <li
                        v-for="item in subjects"
                        :key="item.slug"
                        class="group relative flex flex-col gap-2 border-t border-default pt-5 pb-10"
                    >
                        <span class="font-sans text-meta tabular-nums text-muted">{{ publications(countIn(item.slug)) }}</span>
                        <a
                            :href="`/lab/publicaciones?materia=${item.slug}`"
                            class="font-serif text-h3 text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] after:absolute after:inset-0 group-hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
                        >{{ item.name }}</a>
                        <p class="font-serif text-base leading-relaxed text-toned">
                            {{ item.description }}
                        </p>
                    </li>
                </ol>
            </section>

            <section
                aria-labelledby="formatos"
                class="border-y border-default bg-ivory-50"
            >
                <div class="mx-auto max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20">
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
                                :href="`/lab/publicaciones?formato=${item.slug}`"
                                class="group flex h-full flex-col gap-2 p-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary md:p-6"
                                :class="item.slug === 'tfg-tfm' ? 'hover:bg-huella-slate-800' : 'hover:bg-ivory-100'"
                            >
                                <Kicker :tone="item.slug === 'tfg-tfm' ? 'paper' : 'teal'">
                                    {{ item.slug === 'tfg-tfm' ? 'Archivo académico' : 'Formato' }} · {{ archiveD.filter((entry) => entry.format === item.slug).length }}
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
                    <p class="mt-6 font-serif text-base leading-relaxed text-toned">
                        ¿Tienes un TFG o un TFM con buena nota?
                        <a
                            href="/lab/publicar"
                            class="inline-flex min-h-11 items-center font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                        >Publícalo en Huella Legal</a>
                    </p>
                </div>
            </section>

            <section
                aria-labelledby="temas"
                class="mx-auto max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20"
            >
                <h2
                    id="temas"
                    class="scroll-mt-6 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                >
                    Temas de la A a la Z
                </h2>
                <p class="mt-2 max-w-measure font-serif text-base leading-relaxed text-toned text-pretty">
                    Etiquetas que cruzan varias materias: «Jurisprudencia» reúne comentarios de penal, civil y constitucional.
                </p>
                <div class="mt-6 gap-x-10 sm:columns-2 lg:columns-4">
                    <section
                        v-for="[letter, names] in letters"
                        :key="letter"
                        :aria-label="`Temas con ${letter}`"
                        class="mb-6 break-inside-avoid last:mb-0"
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
                                    :href="`/lab/publicaciones?q=${encodeURIComponent(name)}`"
                                    class="group flex min-h-11 items-center justify-between gap-3 font-serif text-base text-highlighted focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                >
                                    <span class="decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ name }}</span>
                                    <span class="font-sans text-meta tabular-nums text-muted">{{ tagCount(name) }}</span>
                                </a>
                            </li>
                        </ul>
                    </section>
                </div>
            </section>

            <NewsletterBand />
        </main>

        <SiteFooter />

        <VariantNotes
            label="Materias · notas"
            v-bind="notes"
        />
    </div>
</template>
