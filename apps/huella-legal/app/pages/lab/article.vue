<script setup lang="ts">
import ArchiveRow from "~/lab/ArchiveRow.vue";
import MediaFallback from "~/lab/MediaFallback.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import { bibliography, body, notes, toc } from "~/lab/article-body";
import { issn } from "~/lab/fixtures";
import { formats } from "~/lab/fixtures-b";
import { archiveD } from "~/lab/fixtures-d";

useHead({ title: "La teoría jurídica del delito · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

// `?sin-imagen=1` and `?sin-notas=1` preview the common case: 101 of 105 posts have no notes
const route = useRoute();
const withImage = route.query["sin-imagen"] !== "1";
const withNotes = route.query["sin-notas"] !== "1";
const html = withNotes ? body : body.replace(/<sup><a href="#nota-\d+" id="ref-\d+">\d+<\/a><\/sup>/g, "");

// The image follows the first paragraph, so a reader starts the text at the same height either way
const split = html.indexOf("</p>") + "</p>".length;
const opening = html.slice(0, split);
const remainder = html.slice(split);

const article = archiveD.find((item) => item.slug === "la-teoria-juridica-del-delito")!;
const author = article.authors[0]!;
const format = formats.find((item) => item.slug === article.format)!;
const alsoIn = archiveD.filter((item) => item.subject === article.subject && item !== article).slice(0, 3);

const permalink = "huellalegal.com/la-teoria-juridica-del-delito";
const citations = [
    { label: "APA 7", value: `Font, X. (2024, 12 de marzo). ${article.title}. Huella Legal. ${permalink}` },
    { label: "Huella Legal", value: `FONT, X., «${article.title}», Huella Legal, 12 de marzo de 2024. ${issn}. Disponible en: ${permalink}` },
];
const citationTab = ref("0");
const copied = ref(false);

async function copyCitation() {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(citations[Number(citationTab.value)]!.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
}

async function share() {
    if (navigator.share) await navigator.share({ title: article.title, url: location.href }).catch(() => {});
    else await navigator.clipboard?.writeText(location.href);
}

const printPage = () => window.print();

const active = ref<string>(toc[0].id);

// The rail lists sections only, so a subsection lights up the section it belongs to
const activeSection = computed(() => toc.slice(0, toc.findIndex((item) => item.id === active.value) + 1).findLast((item) => item.level === 2)?.id);

onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target.id);

        if (visible[0]) active.value = visible[0];
    }, { rootMargin: "0px 0px -70% 0px" });

    toc.forEach((item) => document.getElementById(item.id) && observer.observe(document.getElementById(item.id)!));
    onBeforeUnmount(() => observer.disconnect());
});

const notesForVariant = {
    changes: [
        "La imagen se queda, porque casi todas las entradas tienen una, pero va tras el primer párrafo, a 16:9 y en la columna de lectura: el texto empieza a la misma altura que en B y la imagen deja de ser el LCP.",
        "Sin número de ejemplar, sin serie y sin cargo del autor: la ADR 0027 no encontró datos para ninguno.",
        "Entradilla entre filetes, como en B. El índice lateral muestra solo las secciones.",
        "«Cómo citar» en APA 7, que es lo que entrega un estudiante, y en el formato de Huella. Sin BibTeX.",
        "Imprimir en lugar de PDF: una hoja de impresión oculta la cabecera, los carriles y las bandas, y escribe la dirección de cada enlace externo.",
        "Las notas solo aparecen si el texto las tiene (4 de 105), y su número es el enlace de vuelta, con 44 px de alto.",
        "«También en la materia» sustituye a la serie y a «Sigue leyendo». Sin notas al margen, sin barra de progreso, sin normas citadas y sin réplicas.",
    ],
    sources: [
        { element: "Imagen", source: "wp:featuredmedia, tamaño large, con srcset; el pipeline la inserta tras el primer párrafo." },
        { element: "Índice", source: "h2 del cuerpo, en el pipeline de la ADR 0027." },
        { element: "Notas", source: "Solo en 4 entradas (anclas _ftn o <sup> sueltos). Se muestran tal cual.", risk: true },
        { element: "Bibliografía", source: "Del último encabezado «Bibliografía», «Fuentes» o «Referencias» al final (56 entradas)." },
        { element: "Citas", source: "Autor, título, fecha y nueva URL, en un mapper de la app." },
        { element: "Biografía del autor", source: "description del usuario de WP (33 de 42)." },
    ],
};
</script>

<template>
    <div>
        <SiteHeader
            current="Publicaciones"
            class="print:hidden"
        />

        <main>
            <article>
                <!-- Header aligns with the reading column, so the page has one left edge -->
                <header class="mx-auto grid max-w-site grid-cols-1 px-4 pt-6 md:px-8 md:pt-10 lg:grid-cols-12 lg:gap-x-8 lg:px-12">
                    <div class="lg:col-span-9 lg:col-start-4">
                        <UBreadcrumb
                            :items="[{ label: 'Portada', to: '/lab/home' }, { label: 'Publicaciones', to: '/lab/publicaciones' }, { label: article.category, to: `/lab/publicaciones?materia=${article.subject}` }]"
                            :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                            class="print:hidden"
                        />
                        <p class="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs md:mt-8">
                            <span class="font-semibold uppercase tracking-[0.12em] text-secondary">{{ format.name }}</span>
                            <span
                                class="text-dimmed"
                                aria-hidden="true"
                            >·</span>
                            <a
                                :href="`/lab/publicaciones?materia=${article.subject}`"
                                data-inline
                                class="font-medium text-muted underline-offset-4 hover:underline"
                            >{{ article.category }}</a>
                        </p>
                        <h1 class="mt-4 max-w-[18ch] font-serif text-[2.375rem] leading-[1.08] tracking-[-0.02em] text-highlighted text-balance md:text-[3.25rem] lg:text-[3.75rem]">
                            {{ article.title }}
                        </h1>
                        <p class="mt-6 max-w-measure border-y border-default py-5 font-serif text-[1.1875rem] leading-relaxed text-toned italic md:text-[1.3125rem]">
                            {{ article.excerpt }}
                        </p>

                        <div class="mt-5 flex max-w-measure flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div class="flex items-center gap-3">
                                <span
                                    class="flex size-11 shrink-0 items-center justify-center rounded-full bg-huella-slate-100 font-sans text-xs font-semibold text-primary"
                                    aria-hidden="true"
                                >{{ author.initials }}</span>
                                <p class="font-sans text-meta leading-snug text-muted">
                                    <a
                                        href="#autor"
                                        data-inline
                                        class="font-semibold text-highlighted underline-offset-3 hover:underline"
                                    >{{ author.name }}</a>
                                    <span class="block"><time>{{ article.date }}</time> · {{ article.readingMinutes }} min de lectura</span>
                                </p>
                            </div>
                            <div class="-ml-3 flex items-center sm:ml-0 sm:-mr-3 print:hidden">
                                <UButton
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-quote"
                                    label="Citar"
                                    to="#citar"
                                    class="px-3"
                                />
                                <UButton
                                    square
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-share"
                                    aria-label="Compartir"
                                    @click="share"
                                />
                                <UButton
                                    square
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-printer"
                                    aria-label="Imprimir"
                                    @click="printPage"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div class="mx-auto grid max-w-site grid-cols-1 px-4 pt-10 pb-16 md:px-8 md:pt-12 lg:grid-cols-12 lg:gap-x-8 lg:px-12 lg:pb-20">
                    <nav
                        aria-label="En este artículo"
                        class="lg:col-span-3 print:hidden"
                    >
                        <UAccordion
                            class="mb-10 max-w-measure rounded-xs border border-default bg-ivory-50 px-4 lg:hidden"
                            :items="[{ label: 'En este artículo', slot: 'toc' as const }]"
                            :ui="{ trigger: 'min-h-12 font-sans text-sm font-semibold text-highlighted', body: 'pb-4' }"
                        >
                            <template #toc-body>
                                <ol class="flex flex-col border-l border-default">
                                    <li
                                        v-for="item in toc.filter((entry) => entry.level === 2)"
                                        :key="item.id"
                                    >
                                        <a
                                            :href="`#${item.id}`"
                                            class="-ml-px flex min-h-11 items-center border-l-2 border-transparent pl-4 font-sans text-sm text-toned"
                                        >{{ item.label }}</a>
                                    </li>
                                </ol>
                            </template>
                        </UAccordion>

                        <div class="sticky top-8 hidden lg:block">
                            <p class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                En este artículo
                            </p>
                            <ol class="mt-3 flex flex-col border-l border-default">
                                <li
                                    v-for="item in toc.filter((entry) => entry.level === 2)"
                                    :key="item.id"
                                >
                                    <a
                                        :href="`#${item.id}`"
                                        :aria-current="activeSection === item.id ? 'location' : undefined"
                                        class="-ml-px flex min-h-11 items-center border-l-2 border-transparent py-1 pl-4 font-sans text-sm leading-snug text-muted transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary aria-[current=location]:border-primary aria-[current=location]:font-semibold aria-[current=location]:text-highlighted"
                                    >{{ item.label }}</a>
                                </li>
                            </ol>
                        </div>
                    </nav>

                    <div class="min-w-0 lg:col-span-9">
                        <!-- eslint-disable-next-line vue/no-v-html -- fixture HTML stands in for WordPress content -->
                        <div
                            class="hl-prose hl-print max-w-measure"
                            v-html="opening"
                        />
                        <figure
                            v-if="withImage"
                            class="my-10 max-w-measure md:my-11"
                        >
                            <div class="@container aspect-[16/9] overflow-hidden rounded-xs">
                                <MediaFallback
                                    tone="slate"
                                    label="Imagen del artículo"
                                />
                            </div>
                            <figcaption class="mt-3 font-sans text-meta text-muted">
                                Alegoría de la Justicia, óleo sobre lienzo. <span class="whitespace-nowrap text-dimmed">Dominio público.</span>
                            </figcaption>
                        </figure>
                        <!-- eslint-disable-next-line vue/no-v-html -- fixture HTML stands in for WordPress content -->
                        <div
                            class="hl-prose hl-print mt-[1.25em] max-w-measure"
                            v-html="remainder"
                        />

                        <div class="mt-12 flex max-w-measure flex-col gap-12 lg:mt-16">
                            <section
                                v-if="withNotes"
                                aria-labelledby="notas"
                                class="border-t border-default pt-6"
                            >
                                <h2
                                    id="notas"
                                    class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                                >
                                    Notas
                                </h2>
                                <ol class="mt-4 flex flex-col gap-3">
                                    <li
                                        v-for="note in notes"
                                        :id="`nota-${note.id}`"
                                        :key="note.id"
                                        class="grid grid-cols-[1.75rem_1fr] font-serif text-citation text-toned"
                                    >
                                        <a
                                            :href="`#ref-${note.id}`"
                                            :aria-label="`Nota ${note.id}, volver al texto`"
                                            class="-my-2.5 flex min-h-11 items-start pt-2.5 font-sans text-xs font-semibold leading-5 text-secondary hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                        >{{ note.id }}</a>
                                        <span>{{ note.text }}</span>
                                    </li>
                                </ol>
                            </section>

                            <section
                                aria-labelledby="bibliografia"
                                class="border-t border-default pt-6"
                            >
                                <h2
                                    id="bibliografia"
                                    class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                                >
                                    Bibliografía
                                </h2>
                                <ul class="mt-4 flex flex-col gap-3">
                                    <li
                                        v-for="entry in bibliography"
                                        :key="entry"
                                        class="pl-6 -indent-6 font-serif text-citation text-toned"
                                    >
                                        {{ entry }}
                                    </li>
                                </ul>
                            </section>

                            <section
                                id="citar"
                                aria-labelledby="citar-titulo"
                                class="rounded-sm border border-default bg-ivory-50 p-5 md:p-6"
                            >
                                <h2
                                    id="citar-titulo"
                                    class="font-serif text-xl text-highlighted"
                                >
                                    Cómo citar este artículo
                                </h2>
                                <UTabs
                                    v-model="citationTab"
                                    :items="citations.map((item, index) => ({ label: item.label, value: String(index) }))"
                                    :content="false"
                                    variant="link"
                                    class="mt-3 print:hidden"
                                    :ui="{ list: 'gap-6 border-b border-default px-0', trigger: 'min-h-11 min-w-11 px-0 font-sans text-sm font-semibold data-[state=active]:text-highlighted', indicator: 'bg-huella-slate-900 h-0.5' }"
                                />
                                <p class="mt-4 font-serif text-citation break-words text-toned">
                                    {{ citations[Number(citationTab)]!.value }}
                                </p>
                                <UButton
                                    variant="outline"
                                    color="neutral"
                                    :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                                    :label="copied ? 'Cita copiada' : 'Copiar cita'"
                                    class="mt-4 print:hidden"
                                    @click="copyCitation"
                                />
                            </section>

                            <p class="font-sans text-sm text-muted print:hidden">
                                <span class="mr-1 font-semibold text-highlighted">Temas:</span>
                                <template
                                    v-for="(tag, index) in article.tags"
                                    :key="tag"
                                >
                                    <a
                                        :href="`/lab/publicaciones?q=${encodeURIComponent(tag)}`"
                                        class="inline-flex min-h-11 items-center px-1 text-primary underline decoration-huella-slate-300 underline-offset-4 hover:decoration-current"
                                    >{{ tag }}</a>{{ index < article.tags.length - 1 ? " · " : "" }}
                                </template>
                            </p>

                            <section
                                id="autor"
                                aria-labelledby="autor-titulo"
                                class="grid grid-cols-[3.5rem_1fr] gap-x-5 gap-y-3 border-t-2 border-huella-slate-900 pt-6 md:grid-cols-[4.5rem_1fr]"
                            >
                                <span
                                    class="flex size-14 items-center justify-center rounded-full bg-huella-slate-100 font-sans text-sm font-semibold text-primary md:size-18"
                                    aria-hidden="true"
                                >{{ author.initials }}</span>
                                <div class="self-center">
                                    <p class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                        Sobre el autor
                                    </p>
                                    <h2
                                        id="autor-titulo"
                                        class="mt-1 font-serif text-h3 text-highlighted"
                                    >
                                        {{ author.name }}
                                    </h2>
                                </div>
                                <div class="col-span-2 md:col-start-2 md:col-span-1">
                                    <p class="font-serif text-base leading-relaxed text-toned">
                                        {{ author.bio }}
                                    </p>
                                    <UButton
                                        variant="link"
                                        :label="`Ver sus ${author.articles} publicaciones`"
                                        trailing-icon="i-lucide-arrow-right"
                                        to="/lab/category?autor=1"
                                        class="mt-2 -ml-3 print:hidden"
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </article>

            <section
                aria-labelledby="mas-materia"
                class="border-t border-default bg-ivory-50 print:hidden"
            >
                <div class="mx-auto grid max-w-site grid-cols-1 px-4 py-16 md:px-8 lg:grid-cols-12 lg:gap-x-8 lg:px-12 lg:py-20">
                    <div class="lg:col-span-9 lg:col-start-4">
                        <div class="flex flex-col gap-2 border-t-2 border-huella-slate-900 pt-4 sm:flex-row sm:items-end sm:justify-between">
                            <h2
                                id="mas-materia"
                                class="font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                            >
                                También en {{ article.category.toLowerCase() }}
                            </h2>
                            <UButton
                                variant="link"
                                label="Toda la materia"
                                trailing-icon="i-lucide-arrow-right"
                                :to="`/lab/publicaciones?materia=${article.subject}`"
                                class="-ml-3 self-start sm:-mr-3 sm:ml-0 sm:self-auto"
                            />
                        </div>
                        <ol class="flex flex-col divide-y divide-(--ui-border-muted)">
                            <li
                                v-for="item in alsoIn"
                                :key="item.slug"
                                class="py-6 md:py-8 last:pb-0"
                            >
                                <ArchiveRow
                                    :entry="item"
                                    media
                                />
                            </li>
                        </ol>
                    </div>
                </div>
            </section>

            <NewsletterBand class="print:hidden" />
        </main>

        <SiteFooter class="print:hidden" />

        <VariantNotes
            label="Artículo · notas"
            class="print:hidden"
            v-bind="notesForVariant"
        />
    </div>
</template>

<style src="~/lab/prose.css"></style>

<style>
@media print {
    .hl-print a[href^="http"]::after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        word-break: break-all;
    }
}
</style>
