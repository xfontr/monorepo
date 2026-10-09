<script setup lang="ts">
import ArticleCard from "~/lab/ArticleCard.vue";
import Byline from "~/lab/Byline.vue";
import Kicker from "~/lab/Kicker.vue";
import MediaFallback from "~/lab/MediaFallback.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import { formats, subjects } from "~/lab/fixtures-b";
import { archiveD, countIn } from "~/lab/fixtures-d";

const route = useRoute();
const menuOpen = route.query.menu === "1";

useHead({ title: "Portada · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const lead = archiveD.find((item) => item.slug === "la-teoria-juridica-del-delito")!;
const rest = archiveD.filter((item) => item !== lead);
const latest = rest.slice(0, 5);
const recent = rest.slice(5, 8);
const academic = archiveD.filter((item) => item.format === "tfg-tfm").slice(0, 3);
const formatName = (slug: string) => formats.find((item) => item.slug === slug)!.name;

const notes = {
    changes: [
        "Abre con la frase aprobada en la puerta B: quien llega por primera vez sabe qué es Huella antes de ver un titular.",
        "El destacado conserva su imagen, porque casi todas las entradas tienen una; a su lado, «Lo último» numerado sustituye a la serie Fundamentos, que no tiene datos.",
        "Tres tarjetas con imagen siguen a «Lo último» sin repetir ninguna entrada.",
        "El índice de materias se queda, con nueve materias que llenan la rejilla; los formatos van aparte, en una línea, porque «Ensayos» y «TFG» no son materias.",
        "Los TFG y TFM tienen franja propia: para un estudiante es a la vez lectura y motivo para publicar.",
        "Fuera las cifras (el ISSN no es una cifra) y las dos tarjetas de «Publica»: queda una línea con un botón.",
        "Dos ritmos verticales: 64/80 px entre bandas y 48/64 px dentro.",
    ],
    sources: [
        {
            element: "Destacado",
            source: "Entrada fijada (sticky) en WP, con su imagen destacada. Core.",
        },
        {
            element: "Imágenes",
            source: "wp:featuredmedia con sus tamaños; la del destacado con fetchpriority alta y el resto en diferido.",
        },
        { element: "Lo último y tarjetas", source: "wp/v2/posts por fecha. Core." },
        { element: "Recuentos por materia", source: "count de wp/v2/categories. Core." },
        {
            element: "Formato y TFG/TFM",
            source: "Mapa de términos de la ADR 0027: categoría «ensayos», etiqueta de TFG, etiquetas jurisprudencia-*.",
        },
    ],
};
</script>

<template>
    <div>
        <SiteHeader :menu-open />

        <main class="flex flex-col">
            <section class="mx-auto w-full max-w-site px-4 md:px-8 lg:px-12">
                <div
                    class="flex flex-col gap-4 border-b border-default pt-10 pb-8 md:pt-14 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pb-10"
                >
                    <h1
                        class="max-w-3xl font-serif text-[2.125rem] leading-[1.08] tracking-[-0.02em] text-highlighted text-balance md:text-[3rem] lg:text-[3.5rem]"
                    >
                        Derecho riguroso, escrito para ser <em class="text-primary">leído</em>.
                    </h1>
                    <p
                        class="max-w-sm font-serif text-base leading-relaxed text-muted lg:pb-2 lg:text-right"
                    >
                        Revista jurídica de acceso libre. Artículos revisados de profesionales,
                        docentes y estudiantes de todo el ámbito hispanohablante.
                    </p>
                </div>
            </section>

            <section
                aria-label="Destacado y últimas publicaciones"
                class="mx-auto grid w-full max-w-site grid-cols-1 gap-12 px-4 pt-8 pb-16 md:px-8 lg:grid-cols-12 lg:pt-10 lg:gap-0 lg:px-12 lg:pb-20"
            >
                <article class="group flex flex-col gap-5 lg:col-span-8 lg:pr-12">
                    <div class="@container aspect-[16/10] overflow-hidden rounded-xs">
                        <MediaFallback tone="slate" label="Imagen del artículo" />
                    </div>
                    <p class="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs">
                        <span class="font-semibold uppercase tracking-[0.12em] text-secondary">{{
                            formatName(lead.format)
                        }}</span>
                        <span class="text-dimmed" aria-hidden="true">·</span>
                        <a
                            :href="`/lab/publicaciones?materia=${lead.subject}`"
                            data-inline
                            class="font-medium text-muted underline-offset-4 hover:underline"
                            >{{ lead.category }}</a
                        >
                    </p>
                    <h2
                        class="font-serif text-[2rem] leading-[1.12] tracking-[-0.02em] text-highlighted text-balance md:text-h1 lg:text-[2.875rem]"
                    >
                        <a
                            href="/lab/article"
                            class="decoration-huella-slate-300 decoration-2 underline-offset-[0.14em] group-hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                            >{{ lead.title }}</a
                        >
                    </h2>
                    <p class="max-w-measure font-serif text-reading text-toned">
                        {{ lead.excerpt }}
                    </p>
                    <Byline
                        :authors="lead.authors"
                        :date="lead.date"
                        :reading-minutes="lead.readingMinutes"
                        avatars
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
                            class="relative grid grid-cols-[2rem_1fr] py-4"
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
                                    href="/lab/article"
                                    class="font-serif text-lg leading-snug text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] after:absolute after:inset-0 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
                        to="/lab/publicaciones"
                        class="-ml-3"
                    />
                </aside>
            </section>

            <section
                aria-labelledby="recientes"
                class="mx-auto w-full max-w-site px-4 pb-16 md:px-8 lg:px-12 lg:pb-20"
            >
                <div
                    class="flex flex-col gap-2 border-t-2 border-huella-slate-900 pt-4 sm:flex-row sm:items-end sm:justify-between"
                >
                    <h2
                        id="recientes"
                        class="font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                    >
                        Publicaciones recientes
                    </h2>
                    <UButton
                        variant="link"
                        label="Ver todas"
                        trailing-icon="i-lucide-arrow-right"
                        to="/lab/publicaciones"
                        class="-ml-3 self-start sm:-mr-3 sm:ml-0 sm:self-auto"
                    />
                </div>
                <div class="mt-8 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                    <ArticleCard
                        v-for="(article, index) in recent"
                        :key="article.slug"
                        :article
                        variant="media"
                        :class="index === 2 && 'md:hidden lg:flex'"
                    />
                </div>
            </section>

            <section aria-labelledby="materias" class="border-y border-default bg-ivory-50">
                <div
                    class="mx-auto grid max-w-site gap-12 px-4 py-16 md:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-20"
                >
                    <div class="lg:col-span-4">
                        <Kicker>Índice</Kicker>
                        <h2
                            id="materias"
                            class="mt-2 font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                        >
                            Materias
                        </h2>
                        <p
                            class="mt-3 max-w-sm font-serif text-base leading-relaxed text-toned text-pretty"
                        >
                            {{ subjects.length }} áreas del Derecho, del penal a la teoría jurídica.
                            Cada texto pertenece a una y tiene un formato.
                        </p>
                        <UButton
                            variant="outline"
                            color="neutral"
                            label="Todas las materias"
                            to="/lab/categorias"
                            class="mt-6"
                        />
                    </div>
                    <div class="lg:col-span-8">
                        <ul class="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3 xl:gap-x-8">
                            <li
                                v-for="subject in subjects"
                                :key="subject.slug"
                                class="border-b border-(--ui-border-muted)"
                            >
                                <a
                                    :href="`/lab/publicaciones?materia=${subject.slug}`"
                                    class="group flex min-h-14 items-baseline gap-3 py-3 xl:gap-2 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                >
                                    <span
                                        class="font-serif text-lg text-highlighted xl:text-base underline-offset-[0.2em] decoration-huella-slate-300 group-hover:underline"
                                        >{{ subject.name }}</span
                                    >
                                    <span
                                        class="flex-1 translate-y-[-0.2em] border-b border-dotted border-ivory-400"
                                        aria-hidden="true"
                                    />
                                    <span class="font-sans text-meta tabular-nums text-muted"
                                        >{{ countIn(subject.slug)
                                        }}<span class="sr-only"> publicaciones</span></span
                                    >
                                </a>
                            </li>
                        </ul>
                        <nav
                            aria-label="Formatos"
                            class="mt-6 -ml-2 flex flex-wrap items-center gap-x-1 font-sans text-sm"
                        >
                            <span class="mr-2 pl-2 text-muted">Por formato:</span>
                            <a
                                v-for="format in formats"
                                :key="format.slug"
                                :href="`/lab/publicaciones?formato=${format.slug}`"
                                class="inline-flex min-h-11 items-center px-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                >{{ format.plural }}</a
                            >
                        </nav>
                    </div>
                </div>
            </section>

            <section aria-labelledby="academicos" class="bg-huella-slate-900 text-huella-slate-200">
                <div
                    class="mx-auto grid max-w-site gap-12 px-4 py-16 md:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-20"
                >
                    <div class="lg:col-span-4 lg:pt-4">
                        <Kicker tone="paper"> Archivo académico </Kicker>
                        <h2
                            id="academicos"
                            class="mt-2 font-serif text-[1.75rem] leading-tight text-ivory-50 text-balance md:text-h2"
                        >
                            Trabajos de fin de grado y de máster
                        </h2>
                        <p class="mt-3 font-serif text-base leading-relaxed text-pretty">
                            Publicados íntegramente y enlazados desde su materia, para que un buen
                            trabajo no acabe en un cajón.
                        </p>
                        <div class="-ml-3 mt-4 flex flex-wrap gap-1">
                            <UButton
                                variant="link"
                                label="Ver los trabajos"
                                trailing-icon="i-lucide-arrow-right"
                                to="/lab/publicaciones?formato=tfg-tfm"
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
                            class="relative border-t border-huella-slate-700 py-5"
                        >
                            <p
                                class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-huella-teal-300"
                            >
                                {{ item.category }}
                            </p>
                            <a
                                href="/lab/article"
                                class="mt-2 block font-serif text-lg leading-snug text-ivory-50 decoration-huella-slate-500 underline-offset-[0.2em] after:absolute after:inset-0 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory-50"
                                >{{ item.title }}</a
                            >
                            <p class="mt-2 font-sans text-meta text-huella-slate-300">
                                {{ item.authors[0]!.name }} · {{ item.readingMinutes }}&nbsp;min
                            </p>
                        </li>
                    </ol>
                </div>
            </section>

            <section
                aria-label="Publicar en Huella Legal"
                class="mx-auto w-full max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20"
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

        <VariantNotes label="Portada · notas" v-bind="notes" />
    </div>
</template>
