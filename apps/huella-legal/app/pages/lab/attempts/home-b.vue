<script setup lang="ts">
import ArchiveRow from "~/lab/ArchiveRow.vue";
import Byline from "~/lab/Byline.vue";
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import { archive, formats, navB, series, seriesEntries, subjects } from "~/lab/fixtures-b";
import { provideVariantB } from "~/lab/variant";

provideVariantB();

const route = useRoute();
const menuOpen = route.query.menu === "1";

useHead({ title: "Portada (B) · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const lead = archive.find((item) => item.slug === "la-teoria-juridica-del-delito")!;
const latest = archive.filter((item) => item !== lead).slice(0, 5);
const fundamentos = seriesEntries("fundamentos");
const formatName = (slug: string) => formats.find((item) => item.slug === slug)!.name;

const shelves = ["derecho-penal", "derechos-fundamentales", "derecho-tecnologico"].map((slug) => {
    const subject = subjects.find((item) => item.slug === slug)!;
    const items = archive.filter(
        (item) => item.subject === slug && item !== lead && !latest.includes(item),
    );

    return {
        subject,
        items: items.slice(0, 3),
        total: archive.filter((item) => item.subject === slug).length,
    };
});

const academic = archive.filter((item) => item.format === "tfg-tfm").slice(0, 3);
const fromArchive = ["tedh-jueces", "prueba-ilicita", "positivismo-incluyente"].map((slug) =>
    archive.find((item) => item.slug === slug)!,
);

const notes = {
    changes: [
        "Portada sin imagen de cabecera: el destacado es tipografía, como Asterisk o Issues. Huella no tiene imágenes propias y el § de relleno no puede sostener el primer pantallazo.",
        "El destacado lo elige la redacción; al lado, «Lo último» numerado. Las dos preguntas de quien llega: qué es lo importante y qué es lo nuevo.",
        "La serie pasa de columna lateral a franja propia con las cinco lecturas en fila.",
        "Tres materias con sus últimos textos, como los bloques por canal de Nautilus o JSTOR Daily, sin tarjetas ni imágenes.",
        "Los TFG y TFM tienen franja propia: es lo que distingue a Huella de otras revistas.",
        "«Del archivo» recupera textos antiguos que siguen vigentes, como el «Best of the Archive» de Noema.",
        "Fuera las cifras (el ISSN no es una cifra) y las dos tarjetas de «Publica»: queda una sola línea con un enlace.",
    ],
    sources: [
        { element: "Destacado", source: "Entrada fijada (sticky) en WP. Core." },
        {
            element: "Lo último y bloques por materia",
            source: "wp/v2/posts ordenado por fecha, filtrado por categoría. Core.",
        },
        {
            element: "Del archivo",
            source: "Una etiqueta editorial, p. ej. «vigente», puesta a mano. Core, pero es trabajo de redacción.",
            risk: false,
        },
        { element: "Formato en los antetítulos", source: "Convención de S1.", risk: true },
    ],
};
</script>

<template>
    <div>
        <SiteHeader :menu-open :nav="navB" />

        <main class="flex flex-col">
            <section
                aria-label="Destacado y últimas publicaciones"
                class="mx-auto grid w-full max-w-site grid-cols-1 gap-12 px-4 pt-10 pb-16 md:px-8 md:pt-14 lg:grid-cols-12 lg:gap-0 lg:px-12 lg:pb-20"
            >
                <article class="group flex flex-col lg:col-span-8 lg:pr-12">
                    <p class="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs">
                        <span class="font-semibold uppercase tracking-[0.12em] text-secondary"
                            >Destacado</span
                        >
                        <span class="text-dimmed" aria-hidden="true">·</span>
                        <a
                            :href="`/lab/attempts/category-b?materia=${lead.subject}`"
                            data-inline
                            class="font-medium text-muted underline-offset-4 hover:underline"
                            >{{ lead.category }}</a
                        >
                        <span class="text-dimmed" aria-hidden="true">·</span>
                        <span class="text-dimmed tabular-nums">{{ lead.issue }}</span>
                    </p>
                    <h1
                        class="mt-4 max-w-[16ch] font-serif text-[2.625rem] leading-[1.04] tracking-[-0.025em] text-highlighted text-balance md:text-[4rem] lg:text-[4.5rem]"
                    >
                        <a
                            href="/lab/attempts/article-b"
                            class="decoration-huella-slate-300 decoration-2 underline-offset-[0.12em] group-hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                            >{{ lead.title }}</a
                        >
                    </h1>
                    <p
                        class="mt-6 max-w-measure border-y border-default py-5 font-serif text-[1.1875rem] leading-relaxed text-toned italic md:text-[1.3125rem]"
                    >
                        {{ lead.excerpt }}
                    </p>
                    <Byline
                        :authors="lead.authors"
                        :date="lead.date"
                        :reading-minutes="lead.readingMinutes"
                        avatars
                        class="mt-5"
                    />
                </article>

                <aside
                    aria-labelledby="lo-ultimo"
                    class="border-t-2 border-huella-slate-900 pt-4 lg:col-span-4 lg:border-t-0 lg:border-l lg:border-default lg:pt-0 lg:pl-10"
                >
                    <h2
                        id="lo-ultimo"
                        class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                    >
                        Lo último
                    </h2>
                    <ol class="mt-2 flex flex-col divide-y divide-(--ui-border-muted)">
                        <li
                            v-for="(item, index) in latest"
                            :key="item.slug"
                            class="grid grid-cols-[2rem_1fr] py-4"
                        >
                            <span
                                class="font-serif text-xl leading-snug text-huella-teal-600 tabular-nums"
                                >{{ index + 1 }}</span
                            >
                            <span class="flex flex-col gap-1">
                                <span
                                    class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-secondary"
                                    >{{ formatName(item.format) }}</span
                                >
                                <a
                                    href="/lab/attempts/article-b"
                                    class="font-serif text-lg leading-snug text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                    >{{ item.title }}</a
                                >
                                <span class="font-sans text-meta text-muted">{{
                                    item.authors.map((person) => person.name).join(", ")
                                }}</span>
                            </span>
                        </li>
                    </ol>
                    <UButton
                        variant="link"
                        label="Todas las publicaciones"
                        trailing-icon="i-lucide-arrow-right"
                        to="/lab/attempts/category-c"
                        class="-ml-3"
                    />
                </aside>
            </section>

            <section aria-labelledby="serie" class="border-y border-default bg-ivory-50">
                <div
                    class="mx-auto grid max-w-site gap-8 px-4 py-12 md:px-8 lg:grid-cols-12 lg:gap-x-12 lg:px-12 lg:py-16"
                >
                    <div class="lg:col-span-3">
                        <Kicker>Serie · {{ fundamentos.length }} lecturas</Kicker>
                        <h2 id="serie" class="mt-1 font-serif text-h3 text-highlighted">
                            <a
                                href="/lab/attempts/serie-b"
                                class="decoration-huella-slate-300 underline-offset-[0.2em] hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >{{ series[0]!.name }}</a
                            >
                        </h2>
                        <p class="mt-2 font-serif text-base leading-relaxed text-muted">
                            Para leer en orden. Empieza por la primera aunque sepas Derecho.
                        </p>
                    </div>
                    <ol class="grid gap-x-6 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-5">
                        <li
                            v-for="item in fundamentos"
                            :key="item.slug"
                            class="border-t border-(--ui-border-muted) first:border-huella-slate-900 sm:border-huella-slate-900"
                        >
                            <a
                                href="/lab/attempts/article-b"
                                class="group grid h-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-2 py-3 focus-visible:rounded-xs sm:flex sm:flex-col sm:gap-2 sm:pb-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                                <span
                                    class="font-serif text-2xl leading-none text-huella-teal-600 tabular-nums sm:text-[2rem]"
                                    >{{ item.series!.position }}</span
                                >
                                <span
                                    class="font-serif text-lg leading-snug text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline"
                                    >{{ item.title }}</span
                                >
                                <span class="font-sans text-meta tabular-nums text-muted sm:mt-auto"
                                    >{{ item.readingMinutes }} min</span
                                >
                            </a>
                        </li>
                    </ol>
                </div>
            </section>

            <section
                aria-labelledby="por-materia"
                class="mx-auto w-full max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20"
            >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <h2
                        id="por-materia"
                        class="font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                    >
                        Por materia
                    </h2>
                    <UButton
                        variant="link"
                        :label="`Las ${subjects.length} materias`"
                        trailing-icon="i-lucide-arrow-right"
                        to="/lab/attempts/categorias-b"
                        class="-ml-3 self-start sm:-mr-3 sm:ml-0 sm:self-auto"
                    />
                </div>
                <div class="mt-6 grid gap-x-10 gap-y-12 md:grid-cols-3">
                    <section
                        v-for="shelf in shelves"
                        :key="shelf.subject.slug"
                        :aria-labelledby="`materia-${shelf.subject.slug}`"
                        class="border-t-2 border-huella-slate-900 pt-3"
                    >
                        <h3
                            :id="`materia-${shelf.subject.slug}`"
                            class="flex items-baseline justify-between gap-4"
                        >
                            <a
                                :href="`/lab/attempts/category-b?materia=${shelf.subject.slug}`"
                                class="inline-flex min-h-11 items-center font-sans text-xs font-semibold uppercase tracking-[0.12em] text-secondary underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                >{{ shelf.subject.name }}</a
                            >
                            <span class="font-sans text-meta tabular-nums text-muted">{{
                                shelf.total
                            }}</span>
                        </h3>
                        <ol class="flex flex-col divide-y divide-(--ui-border-muted)">
                            <li
                                v-for="item in shelf.items"
                                :key="item.slug"
                                class="py-4 first:pt-2"
                            >
                                <ArchiveRow :entry="item" density="compact" />
                            </li>
                        </ol>
                    </section>
                </div>
            </section>

            <section aria-labelledby="academicos" class="bg-huella-slate-900 text-huella-slate-200">
                <div
                    class="mx-auto grid max-w-site gap-10 px-4 py-14 md:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-16"
                >
                    <div class="lg:col-span-4">
                        <Kicker tone="paper"> Archivo académico </Kicker>
                        <h2
                            id="academicos"
                            class="mt-2 font-serif text-[1.75rem] leading-tight text-ivory-50 md:text-h2"
                        >
                            Trabajos de fin de grado y de máster
                        </h2>
                        <p class="mt-3 font-serif text-base leading-relaxed">
                            Publicados íntegramente y enlazados desde su materia, para que un buen
                            trabajo no acabe en un cajón.
                        </p>
                        <div class="-ml-3 mt-4 flex flex-wrap gap-1">
                            <UButton
                                variant="link"
                                label="Ver los trabajos"
                                trailing-icon="i-lucide-arrow-right"
                                to="/lab/attempts/category-c?formato=tfg-tfm"
                                class="text-ivory-50 hover:text-ivory-50"
                            />
                            <UButton
                                variant="link"
                                label="Publicar el tuyo"
                                to="/lab/publicar"
                                class="text-huella-teal-200 hover:text-huella-teal-100"
                            />
                        </div>
                    </div>
                    <ol class="grid gap-x-8 md:grid-cols-3 lg:col-span-8">
                        <li
                            v-for="item in academic"
                            :key="item.slug"
                            class="border-t border-huella-slate-700 py-5"
                        >
                            <p
                                class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-huella-teal-300"
                            >
                                {{ item.category }}
                            </p>
                            <a
                                href="/lab/attempts/article-b"
                                class="mt-2 block font-serif text-lg leading-snug text-ivory-50 decoration-huella-slate-500 underline-offset-[0.2em] hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory-50"
                                >{{ item.title }}</a
                            >
                            <p class="mt-2 font-sans text-meta text-huella-slate-300">
                                {{ item.authors[0]!.name }} · {{ item.readingMinutes }} min
                            </p>
                        </li>
                    </ol>
                </div>
            </section>

            <section
                aria-labelledby="archivo"
                class="mx-auto w-full max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20"
            >
                <div class="grid gap-8 lg:grid-cols-12 lg:gap-12">
                    <div class="lg:col-span-4">
                        <Kicker>Del archivo</Kicker>
                        <h2
                            id="archivo"
                            class="mt-1 font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                        >
                            Escritos hace años, vigentes hoy
                        </h2>
                    </div>
                    <ol
                        class="flex flex-col divide-y divide-(--ui-border-muted) border-y border-default lg:col-span-8"
                    >
                        <li
                            v-for="item in fromArchive"
                            :key="item.slug"
                            class="grid gap-x-6 py-5 sm:grid-cols-[4.5rem_1fr]"
                        >
                            <span
                                class="font-serif text-2xl leading-tight text-huella-teal-600 tabular-nums"
                                >{{ item.year }}</span
                            >
                            <ArchiveRow :entry="item" show-subject density="compact" />
                        </li>
                    </ol>
                </div>
            </section>

            <section
                aria-label="Publicar en Huella Legal"
                class="mx-auto w-full max-w-site px-4 pb-16 md:px-8 lg:px-12 lg:pb-20"
            >
                <div
                    class="flex flex-col gap-4 border-t-2 border-huella-slate-900 pt-5 md:flex-row md:items-center md:justify-between md:gap-10"
                >
                    <p
                        class="max-w-3xl font-serif text-xl leading-snug text-highlighted md:text-h3"
                    >
                        ¿Escribes sobre Derecho? Publicamos artículos, comentarios, ensayos y
                        trabajos académicos, con revisión editorial y respuesta en cinco días.
                    </p>
                    <UButton
                        variant="outline"
                        color="neutral"
                        label="Cómo publicar"
                        trailing-icon="i-lucide-arrow-right"
                        to="/lab/publicar"
                        class="shrink-0 self-start md:self-auto"
                    />
                </div>
            </section>

            <NewsletterBand />
        </main>

        <SiteFooter />

        <VariantNotes label="Portada · variante B" compare="/lab/home" v-bind="notes" />
    </div>
</template>
