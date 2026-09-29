<script setup lang="ts">
import ArchiveRow from "~/lab/ArchiveRow.vue";
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import Wordmark from "~/lab/Wordmark.vue";
import { bibliography, body, notes, toc } from "~/lab/article-body";
import { issn } from "~/lab/fixtures";
import { archive, navB, series, seriesEntries } from "~/lab/fixtures-b";
import { provideVariantB } from "~/lab/variant";

provideVariantB();
useHead({ title: "La teoría jurídica del delito (B) · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const article = archive.find((item) => item.slug === "la-teoria-juridica-del-delito")!;
const author = article.authors[0]!;
const inSeries = seriesEntries("fundamentos");
const position = article.series!.position;
const previous = inSeries[position - 2];
const next = inSeries[position];
const alsoIn = archive.filter((item) => item.subject === article.subject && item !== article && !item.series).slice(0, 3);

const permalink = "huellalegal.com/la-teoria-juridica-del-delito";
const citations = [
    { label: "Huella Legal", value: `FONT, X., «${article.title}», Huella Legal, ${article.issue}, 12 de marzo de 2024. ${issn}. Disponible en: ${permalink}` },
    { label: "APA 7", value: `Font, X. (2024, 12 de marzo). ${article.title}. Huella Legal, ${article.issue}. ${permalink}` },
    { label: "BibTeX", value: `@article{font2024teoria,\n  author  = {Font, Xifré},\n  title   = {${article.title}},\n  journal = {Huella Legal},\n  number  = {${article.issue}},\n  year    = {2024},\n  issn    = {2696-7618},\n  url     = {${permalink}}\n}` },
];
const citationTab = ref("0");

const cited = [
    { kind: "Norma", label: "Código Penal, artículo 10", detail: "Ley Orgánica 10/1995, de 23 de noviembre" },
    { kind: "Norma", label: "Código Penal, artículo 12", detail: "Imprudencia punible" },
    { kind: "Norma", label: "Código Penal, artículo 14.3", detail: "Error de prohibición" },
    { kind: "Resolución", label: "STC 76/2019, de 22 de mayo", detail: "Tribunal Constitucional, Pleno, FJ 5" },
];

const meta = [
    { term: "Formato", value: "Artículo" },
    { term: "Materia", value: `${article.category} · ${article.subtopic}` },
    { term: "Número", value: article.issue },
    { term: "Publicado", value: "12 mar. 2024" },
    { term: "Revisado", value: "3 feb. 2025" },
    { term: "Extensión", value: `${article.words.toLocaleString("es-ES")} palabras` },
];

// Margin notes from 1280 px: each note sits level with its call and pushes the next one down
const layout = useTemplateRef<HTMLElement>("layout");
const noteTops = ref<Record<number, number>>({});
const wide = ref(false);
const active = ref<string>(toc[0].id);
const pastHeader = ref(false);

// The rail lists sections only, so a subsection lights up the section it belongs to
const activeSection = computed(() => toc.slice(0, toc.findIndex((item) => item.id === active.value) + 1).findLast((item) => item.level === 2)?.id);
const progress = ref(0);

function placeNotes() {
    wide.value = window.matchMedia("(min-width: 80rem)").matches;
    if (!wide.value || !layout.value) return;

    const origin = layout.value.querySelector<HTMLElement>("[data-notes]")!.getBoundingClientRect().top;
    let floor = 0;
    const tops: Record<number, number> = {};

    for (const note of notes) {
        const call = document.getElementById(`ref-${note.id}`);
        const item = document.getElementById(`nota-${note.id}`);

        if (!call || !item) continue;

        const top = Math.max(call.getBoundingClientRect().top - origin - 4, floor);

        tops[note.id] = top;
        floor = top + item.offsetHeight + 16;
    }

    noteTops.value = tops;
}

function onScroll() {
    const header = document.getElementById("cabecera");
    const main = layout.value;

    pastHeader.value = !!header && header.getBoundingClientRect().bottom < 0;
    if (main) {
        const box = main.getBoundingClientRect();

        progress.value = Math.min(1, Math.max(0, -box.top / Math.max(1, box.height - window.innerHeight)));
    }
}

onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target.id);

        if (visible[0]) active.value = visible[0];
    }, { rootMargin: "0px 0px -70% 0px" });

    toc.forEach((item) => document.getElementById(item.id) && observer.observe(document.getElementById(item.id)!));

    const resize = new ResizeObserver(() => placeNotes());

    if (layout.value) resize.observe(layout.value);
    window.addEventListener("scroll", onScroll, { passive: true });
    nextTick(placeNotes);

    onBeforeUnmount(() => {
        observer.disconnect();
        resize.disconnect();
        window.removeEventListener("scroll", onScroll);
    });
});

const notesForVariant = {
    changes: [
        "Sin imagen de cabecera: el título, la entradilla entre filetes y la firma bastan. La imagen, si la hay, va dentro del texto con su pie.",
        "Notas al margen desde 1280 px, cada una a la altura de su llamada, como Asterisk o la Yale Law Journal; por debajo siguen al final del texto.",
        "Una columna de datos a la izquierda: formato, materia, número, fechas de publicación y revisión, extensión en palabras. El índice va debajo.",
        "Una barra fina aparece al pasar la cabecera, con el título y el progreso de lectura, como la de The New Atlantis.",
        "«Cómo citar» con tres formatos, enlace estable y PDF, como la Stanford Encyclopedia y la revista Issues.",
        "Nuevo bloque «Normas y resoluciones citadas»: la versión jurídica del «Take a deeper dive» de Knowable.",
        "Invitación a publicar réplicas, como los foros de Boston Review o Issues.",
        "La serie se navega con anterior y siguiente, no con cinco casillas; los temas son texto, no píldoras.",
        "El retorno de cada nota es su número, con 44 px de alto; en A es una flecha de 12 × 16 px.",
    ],
    sources: [
        { element: "Notas", source: "Bloque core de notas al pie (wp-block-footnotes) si los textos lo usan; si no, se parsean los <sup> del HTML. S1." },
        { element: "Revisado", source: "Campo modified del post. Core, pero cambia con cualquier corrección menor.", risk: false },
        { element: "Extensión", source: "Recuento de palabras del contenido, en el servidor. Derivado." },
        { element: "Normas y resoluciones citadas", source: "Enlaces del texto al BOE y al CENDOJ, extraídos del HTML. Solo funciona si los autores enlazan.", risk: true },
        { element: "PDF", source: "No existe en WP. Habría que generarlo (CSS de impresión o servicio) o quitar el botón.", risk: true },
        { element: "Réplicas", source: "Un formato más, con enlace al texto que responde. Convención de S1.", risk: true },
    ],
};
</script>

<template>
    <div>
        <SiteHeader
            current="Publicaciones"
            :nav="navB"
        />

        <!-- Running head: title and reading progress once the article header has scrolled away -->
        <div
            class="fixed inset-x-0 top-0 z-40 border-b border-default bg-ivory-100/95 backdrop-blur-sm transition-transform duration-200"
            :class="pastHeader ? 'translate-y-0' : '-translate-y-full'"
            :aria-hidden="!pastHeader"
        >
            <div class="mx-auto flex h-12 max-w-site items-center gap-4 px-4 md:px-8 lg:px-12">
                <a
                    href="/lab/home-b"
                    class="shrink-0"
                    :tabindex="pastHeader ? 0 : -1"
                    aria-label="Huella Legal, portada"
                ><Wordmark size="sm" /></a>
                <span
                    class="hidden h-5 w-px bg-(--ui-border) sm:block"
                    aria-hidden="true"
                />
                <p class="hidden min-w-0 truncate font-serif text-base text-highlighted sm:block">
                    {{ article.title }}
                </p>
                <span class="ml-auto shrink-0 font-sans text-meta text-muted tabular-nums">{{ Math.max(1, Math.round(article.readingMinutes * (1 - progress))) }} min restantes</span>
            </div>
            <div
                class="h-0.5 origin-left bg-huella-teal-400"
                :style="{ transform: `scaleX(${progress})` }"
            />
        </div>

        <main>
            <article>
                <div
                    ref="layout"
                    class="mx-auto grid max-w-site grid-cols-1 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-x-12 lg:px-12 lg:pb-20 xl:grid-cols-[11rem_minmax(0,40rem)_12.5rem] xl:gap-x-10"
                >
                    <header
                        id="cabecera"
                        class="lg:col-start-2 xl:col-span-2"
                    >
                        <UBreadcrumb
                            :items="[{ label: 'Portada', to: '/lab/home-b' }, { label: 'Publicaciones', to: '/lab/category-c' }, { label: article.category, to: '/lab/category-b' }]"
                            :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                        />
                        <p class="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs md:mt-8">
                            <span class="font-semibold uppercase tracking-[0.12em] text-secondary">Artículo</span>
                            <span
                                class="text-dimmed"
                                aria-hidden="true"
                            >·</span>
                            <a
                                href="/lab/category-b"
                                class="inline-flex min-h-6 items-center font-medium text-muted underline-offset-4 hover:underline"
                            >{{ article.category }}</a>
                            <span
                                class="text-dimmed"
                                aria-hidden="true"
                            >·</span>
                            <a
                                href="#serie"
                                class="inline-flex min-h-6 items-center font-semibold text-primary underline-offset-4 hover:underline"
                            >Fundamentos · {{ position }} de {{ inSeries.length }}</a>
                        </p>
                        <h1 class="mt-4 max-w-[18ch] font-serif text-[2.375rem] leading-[1.08] tracking-[-0.02em] text-highlighted text-balance md:text-[3.25rem] lg:text-[3.75rem]">
                            {{ article.title }}
                        </h1>
                        <p class="mt-6 max-w-measure border-y border-default py-5 font-serif text-[1.1875rem] leading-relaxed text-toned italic md:text-[1.3125rem]">
                            {{ article.excerpt }}
                        </p>
                        <div class="mt-5 flex max-w-measure flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p class="font-sans text-meta text-muted">
                                Por <a
                                    href="#autor"
                                    data-inline
                                    class="font-semibold text-highlighted underline-offset-3 hover:underline"
                                >{{ author.name }}</a>, {{ author.role?.toLowerCase() }} de Huella Legal
                                <span class="block">{{ article.date }} · {{ article.readingMinutes }} min de lectura</span>
                            </p>
                            <div class="-ml-3 flex items-center sm:ml-0 sm:-mr-3">
                                <UButton
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-quote"
                                    label="Citar"
                                    to="#citar"
                                />
                                <UButton
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-file-down"
                                    label="PDF"
                                />
                                <UButton
                                    square
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-link"
                                    aria-label="Copiar enlace"
                                />
                                <UButton
                                    square
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-share"
                                    aria-label="Compartir"
                                />
                            </div>
                        </div>
                    </header>

                    <!-- Left rail: the record first, then the contents -->
                    <aside
                        aria-label="Sobre este artículo"
                        class="mt-10 lg:col-start-1 lg:row-span-4 lg:row-start-2 lg:mt-14"
                    >
                        <dl class="hidden border-t-2 border-huella-slate-900 pt-3 font-sans text-meta lg:block">
                            <div
                                v-for="item in meta"
                                :key="item.term"
                                class="border-b border-(--ui-border-muted) py-2"
                            >
                                <dt class="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                    {{ item.term }}
                                </dt>
                                <dd class="mt-0.5 text-highlighted">
                                    {{ item.value }}
                                </dd>
                            </div>
                        </dl>

                        <UAccordion
                            class="mb-10 rounded-xs border border-default bg-ivory-50 px-4 lg:hidden"
                            :items="[{ label: 'En este artículo', slot: 'toc' as const }]"
                            :ui="{ trigger: 'min-h-12 font-sans text-sm font-semibold text-highlighted', body: 'pb-4' }"
                        >
                            <template #toc-body>
                                <ol class="flex flex-col border-l border-default">
                                    <li
                                        v-for="item in toc"
                                        :key="item.id"
                                    >
                                        <a
                                            :href="`#${item.id}`"
                                            class="-ml-px flex min-h-11 items-center border-l-2 border-transparent font-sans text-sm text-toned"
                                            :class="item.level === 3 ? 'pl-7 text-[0.8125rem]' : 'pl-4'"
                                        >{{ item.label }}</a>
                                    </li>
                                </ol>
                            </template>
                        </UAccordion>

                        <nav
                            aria-label="En este artículo"
                            class="sticky top-16 mt-8 hidden lg:block"
                        >
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
                                        class="-ml-px flex min-h-9 items-center border-l-2 border-transparent py-1 pl-3 font-sans text-[0.8125rem] leading-snug text-muted transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary aria-[current=location]:border-primary aria-[current=location]:font-semibold aria-[current=location]:text-highlighted"
                                    >{{ item.label }}</a>
                                </li>
                            </ol>
                        </nav>
                    </aside>

                    <div class="min-w-0 lg:col-start-2 lg:mt-14 xl:row-start-2">
                        <!-- eslint-disable-next-line vue/no-v-html -- fixture HTML stands in for WordPress content -->
                        <div
                            class="hl-prose max-w-measure"
                            v-html="body"
                        />
                    </div>

                    <!-- One list: margin notes from xl, endnotes below it -->
                    <section
                        aria-labelledby="notas"
                        data-notes
                        class="mt-16 max-w-measure border-t border-default pt-6 lg:col-start-2 xl:relative xl:col-start-3 xl:row-start-2 xl:mt-14 xl:border-t-0 xl:pt-0"
                    >
                        <h2
                            id="notas"
                            class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted xl:sr-only"
                        >
                            Notas
                        </h2>
                        <ol class="mt-4 flex flex-col gap-3 xl:mt-0 xl:block">
                            <li
                                v-for="note in notes"
                                :id="`nota-${note.id}`"
                                :key="note.id"
                                class="grid grid-cols-[1.75rem_1fr] font-serif text-citation text-toned xl:absolute xl:inset-x-0 xl:grid-cols-[1.25rem_1fr] xl:text-[0.8125rem] xl:leading-[1.5] xl:text-muted xl:transition-[top]"
                                :style="wide && noteTops[note.id] !== undefined ? { top: `${noteTops[note.id]}px` } : undefined"
                            >
                                <a
                                    :href="`#ref-${note.id}`"
                                    :aria-label="`Nota ${note.id}, volver al texto`"
                                    class="-mt-2.5 flex min-h-11 items-start pt-2.5 font-sans text-xs font-semibold leading-5 text-secondary hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary xl:-mt-3 xl:pt-3"
                                >{{ note.id }}</a>
                                <span>{{ note.text }}</span>
                            </li>
                        </ol>
                    </section>

                    <div class="mt-12 flex max-w-measure flex-col gap-12 lg:col-start-2">
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
                            aria-labelledby="citadas"
                            class="border-t border-default pt-6"
                        >
                            <h2
                                id="citadas"
                                class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                            >
                                Normas y resoluciones citadas
                            </h2>
                            <ul class="mt-2 flex flex-col divide-y divide-(--ui-border-muted)">
                                <li
                                    v-for="item in cited"
                                    :key="item.label"
                                >
                                    <a
                                        href="#"
                                        class="group grid min-h-12 grid-cols-[5.5rem_1fr_auto] items-baseline gap-x-3 py-2.5 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                    >
                                        <span class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-secondary">{{ item.kind }}</span>
                                        <span class="font-serif text-base text-highlighted">
                                            <span class="decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ item.label }}</span>
                                            <span class="block font-sans text-meta text-muted">{{ item.detail }}</span>
                                        </span>
                                        <UIcon
                                            name="i-lucide-arrow-up-right"
                                            class="size-4 self-center text-muted"
                                        />
                                    </a>
                                </li>
                            </ul>
                        </section>

                        <section
                            id="citar"
                            aria-labelledby="citar-titulo"
                            class="scroll-mt-16 rounded-sm border border-default bg-ivory-50 p-5 md:p-6"
                        >
                            <div class="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2
                                        id="citar-titulo"
                                        class="font-serif text-xl text-highlighted"
                                    >
                                        Cómo citar este artículo
                                    </h2>
                                    <p class="mt-1 font-sans text-meta text-muted">
                                        Publicado el 12 de marzo de 2024 · revisado el 3 de febrero de 2025
                                    </p>
                                </div>
                                <UButton
                                    variant="outline"
                                    color="neutral"
                                    icon="i-lucide-file-down"
                                    label="Descargar PDF"
                                    class="shrink-0"
                                />
                            </div>
                            <UTabs
                                v-model="citationTab"
                                :items="citations.map((item, index) => ({ label: item.label, value: String(index) }))"
                                :content="false"
                                variant="link"
                                class="mt-4"
                                :ui="{ list: 'border-b border-default', trigger: 'min-h-11 px-3 font-sans text-sm font-semibold data-[state=active]:text-highlighted', indicator: 'bg-huella-slate-900 h-0.5' }"
                            />
                            <pre
                                class="mt-4 font-serif text-citation break-words whitespace-pre-wrap text-toned"
                                :class="citationTab === '2' && 'font-mono text-[0.8125rem]'"
                            >{{ citations[Number(citationTab)]!.value }}</pre>
                            <div class="-ml-3 mt-3 flex flex-wrap items-center gap-1">
                                <UButton
                                    variant="link"
                                    icon="i-lucide-copy"
                                    label="Copiar cita"
                                />
                                <UButton
                                    variant="link"
                                    icon="i-lucide-link"
                                    label="Copiar enlace estable"
                                />
                            </div>
                        </section>

                        <p class="font-sans text-sm text-muted">
                            <span class="font-semibold text-highlighted">Temas:</span>
                            <template
                                v-for="(tag, index) in [...article.tags, 'Culpabilidad', 'Código Penal']"
                                :key="tag"
                            >
                                <a
                                    href="/lab/category-c"
                                    data-inline
                                    class="ml-1 text-primary underline decoration-huella-slate-300 underline-offset-4 hover:decoration-current"
                                >{{ tag }}</a>{{ index < article.tags.length + 1 ? " ·" : "" }}
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
                            <div>
                                <p class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                    Sobre el autor
                                </p>
                                <h2
                                    id="autor-titulo"
                                    class="mt-1 font-serif text-h3 text-highlighted"
                                >
                                    {{ author.name }}
                                </h2>
                                <p class="font-sans text-meta text-muted">
                                    {{ author.role }}
                                </p>
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
                                    class="mt-2 -ml-3"
                                />
                            </div>
                        </section>

                        <section
                            aria-labelledby="replica"
                            class="border-l-2 border-huella-teal-400 pl-5"
                        >
                            <h2
                                id="replica"
                                class="font-serif text-xl text-highlighted"
                            >
                                ¿Discrepas?
                            </h2>
                            <p class="mt-1 font-serif text-base leading-relaxed text-toned">
                                Publicamos réplicas razonadas a nuestros artículos, enlazadas desde el original. Pasan la misma revisión que cualquier otro texto.
                            </p>
                            <UButton
                                variant="link"
                                label="Proponer una réplica"
                                trailing-icon="i-lucide-arrow-right"
                                to="/lab/publicar"
                                class="mt-1 -ml-3"
                            />
                        </section>
                    </div>
                </div>
            </article>

            <nav
                id="serie"
                aria-labelledby="serie-titulo"
                class="scroll-mt-12 border-y border-default bg-ivory-50"
            >
                <div class="mx-auto max-w-site px-4 py-10 md:px-8 lg:px-12">
                    <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <p
                            id="serie-titulo"
                            class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-secondary"
                        >
                            {{ series[0]!.name }} · {{ position }} de {{ inSeries.length }}
                        </p>
                        <UButton
                            variant="link"
                            label="Ver la serie completa"
                            to="/lab/serie-b"
                            class="-ml-3 sm:-mr-3 sm:ml-0"
                        />
                    </div>
                    <div class="mt-3 grid gap-px overflow-hidden rounded-xs border border-default bg-(--ui-border) md:grid-cols-2">
                        <a
                            v-if="previous"
                            href="/lab/article-b"
                            class="group flex flex-col gap-1 bg-ivory-50 p-5 transition-colors hover:bg-ivory-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                        >
                            <span class="inline-flex items-center gap-1.5 font-sans text-meta font-semibold text-muted"><UIcon
                                name="i-lucide-arrow-left"
                                class="size-4"
                            /> Anterior · {{ previous.series!.position }}</span>
                            <span class="font-serif text-xl leading-snug text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ previous.title }}</span>
                        </a>
                        <a
                            v-if="next"
                            href="/lab/article-b"
                            class="group flex flex-col gap-1 bg-ivory-50 p-5 text-right transition-colors hover:bg-ivory-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary md:col-start-2"
                        >
                            <span class="inline-flex items-center justify-end gap-1.5 font-sans text-meta font-semibold text-muted">Siguiente · {{ next.series!.position }} <UIcon
                                name="i-lucide-arrow-right"
                                class="size-4"
                            /></span>
                            <span class="font-serif text-xl leading-snug text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ next.title }}</span>
                        </a>
                    </div>
                </div>
            </nav>

            <section
                aria-labelledby="mas-materia"
                class="mx-auto max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20"
            >
                <div class="flex flex-col gap-2 border-t-2 border-huella-slate-900 pt-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Kicker>{{ article.category }}</Kicker>
                        <h2
                            id="mas-materia"
                            class="mt-1 font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                        >
                            También en la materia
                        </h2>
                    </div>
                    <UButton
                        variant="link"
                        label="Toda la materia"
                        trailing-icon="i-lucide-arrow-right"
                        to="/lab/category-b"
                        class="-ml-3 self-start sm:-mr-3 sm:ml-0 sm:self-auto"
                    />
                </div>
                <ol class="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-3">
                    <li
                        v-for="item in alsoIn"
                        :key="item.slug"
                    >
                        <ArchiveRow :entry="item" />
                    </li>
                </ol>
            </section>

            <NewsletterBand />
        </main>

        <SiteFooter />

        <VariantNotes
            label="Artículo · variante B"
            compare="/lab/article"
            v-bind="notesForVariant"
        />
    </div>
</template>

<style src="~/lab/prose.css"></style>
