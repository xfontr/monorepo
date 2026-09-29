<script setup lang="ts">
import ArticleCard from "~/lab/ArticleCard.vue";
import Byline from "~/lab/Byline.vue";
import Kicker from "~/lab/Kicker.vue";
import MediaFallback from "~/lab/MediaFallback.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SectionHeading from "~/lab/SectionHeading.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import { articles, categories, fundamentals } from "~/lab/fixtures";

const route = useRoute();
const menuOpen = route.query.menu === "1";

useHead({ title: "Portada · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const lead = articles[0]!;
const recent = articles.slice(1, 7);

const participation = [
    {
        icon: "i-lucide-feather",
        title: "Publica tu artículo",
        body: "Gratis y con revisión editorial: respondemos en un máximo de cinco días con una decisión razonada.",
        action: "Cómo publicar",
    },
    {
        icon: "i-lucide-graduation-cap",
        title: "Publica tu TFG o TFM",
        body: "Tu trabajo de fin de grado o de máster, publicado íntegramente y enlazado desde su materia.",
        action: "Publicar un TFG o TFM",
    },
];

const facts = [
    { value: "6.000+", label: "lectores en redes" },
    { value: "45", label: "colaboradores" },
    { value: "10", label: "áreas del Derecho" },
    { value: "ISSN", label: "2696-7618" },
];
</script>

<template>
    <div>
        <SiteHeader :menu-open="menuOpen" />

        <main class="flex flex-col">
            <section class="mx-auto w-full max-w-site px-4 md:px-8 lg:px-12">
                <div class="flex flex-col gap-4 border-b border-default pt-10 pb-8 md:pt-14 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pb-10">
                    <h1 class="max-w-3xl font-serif text-[2.125rem] leading-[1.08] tracking-[-0.02em] text-highlighted text-balance md:text-[3rem] lg:text-[3.5rem]">
                        Derecho riguroso, escrito para ser <em class="text-primary">leído</em>.
                    </h1>
                    <p class="max-w-sm font-serif text-base leading-relaxed text-muted lg:pb-2 lg:text-right">
                        Revista jurídica de acceso libre. Artículos revisados de profesionales, docentes y estudiantes de todo el ámbito hispanohablante.
                    </p>
                </div>
            </section>

            <section
                aria-label="Destacado"
                class="mx-auto grid w-full max-w-site grid-cols-1 gap-12 px-4 pt-8 pb-16 md:px-8 md:pt-10 lg:grid-cols-12 lg:gap-0 lg:px-12"
            >
                <article class="group flex flex-col gap-5 lg:col-span-8 lg:pr-12">
                    <div class="@container aspect-[16/10] overflow-hidden rounded-xs">
                        <MediaFallback
                            tone="slate"
                            label="Imagen del artículo"
                        />
                    </div>
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Kicker href="#">
                            {{ lead.category }}
                        </Kicker>
                        <span class="font-sans text-xs tabular-nums text-dimmed">{{ lead.issue }}</span>
                    </div>
                    <h2 class="font-serif text-[2rem] leading-[1.12] tracking-[-0.02em] text-highlighted text-balance md:text-h1 lg:text-[2.875rem]">
                        <a
                            href="/lab/article"
                            class="decoration-huella-slate-300 decoration-2 underline-offset-[0.14em] group-hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                        >{{ lead.title }}</a>
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
                    aria-labelledby="fundamentos"
                    class="border-t-2 border-huella-slate-900 pt-4 lg:col-span-4 lg:border-t-0 lg:border-l lg:border-default lg:pt-0 lg:pl-10"
                >
                    <Kicker>Serie</Kicker>
                    <h2
                        id="fundamentos"
                        class="mt-1 font-serif text-h3 text-highlighted"
                    >
                        Fundamentos del Derecho penal
                    </h2>
                    <p class="mt-2 font-serif text-base leading-relaxed text-muted">
                        Cinco lecturas, en orden, para entender cómo razona un penalista.
                    </p>
                    <ol class="mt-6 flex flex-col divide-y divide-(--ui-border-muted)">
                        <li
                            v-for="(item, index) in fundamentals"
                            :key="item.slug"
                            class="group/item grid grid-cols-[2.25rem_1fr] py-4"
                        >
                            <span class="font-serif text-2xl leading-none text-huella-teal-400 tabular-nums">{{ index + 1 }}</span>
                            <span>
                                <a
                                    href="/lab/article"
                                    class="font-serif text-lg leading-snug text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >{{ item.title }}</a>
                                <span class="mt-1 block font-serif text-[0.9375rem] leading-normal text-muted">{{ item.excerpt }}</span>
                            </span>
                        </li>
                    </ol>
                </aside>
            </section>

            <section
                aria-labelledby="recientes"
                class="mx-auto w-full max-w-site px-4 pb-20 md:px-8 lg:px-12"
            >
                <SectionHeading
                    id="recientes"
                    title="Publicaciones recientes"
                    link="Ver todas"
                    link-to="/lab/category"
                />
                <div class="mt-8 grid gap-x-10 md:grid-cols-2 lg:grid-cols-3">
                    <ArticleCard
                        v-for="article in recent"
                        :key="article.slug"
                        :article="article"
                        class="border-b border-(--ui-border-muted) py-8 md:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:nth-last-child(-n+3)]:border-b-0"
                    />
                </div>
            </section>

            <section
                aria-labelledby="materias"
                class="border-y border-default bg-ivory-50"
            >
                <div class="mx-auto grid max-w-site gap-10 px-4 py-16 md:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-20">
                    <div class="lg:col-span-4">
                        <Kicker>Índice</Kicker>
                        <h2
                            id="materias"
                            class="mt-1 font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                        >
                            Materias
                        </h2>
                        <p class="mt-3 max-w-sm font-serif text-base leading-relaxed text-toned">
                            Diez áreas del Derecho, del penal a la teoría jurídica, y un archivo de trabajos académicos publicados íntegramente.
                        </p>
                        <UButton
                            variant="outline"
                            color="neutral"
                            label="Todas las materias"
                            to="/lab/categorias"
                            class="mt-6"
                        />
                    </div>
                    <ul class="grid gap-x-10 sm:grid-cols-2 lg:col-span-8">
                        <li
                            v-for="category in categories"
                            :key="category.slug"
                            class="border-b border-(--ui-border-muted)"
                        >
                            <a
                                href="/lab/category"
                                class="group flex min-h-14 items-baseline gap-3 py-3 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                            >
                                <span class="font-serif text-lg text-highlighted underline-offset-[0.2em] decoration-huella-slate-300 group-hover:underline">{{ category.name }}</span>
                                <span
                                    class="flex-1 translate-y-[-0.2em] border-b border-dotted border-ivory-400"
                                    aria-hidden="true"
                                />
                                <span class="font-sans text-meta tabular-nums text-muted">{{ category.count }}<span class="sr-only"> artículos</span></span>
                            </a>
                        </li>
                    </ul>
                </div>
            </section>

            <section
                aria-labelledby="calidad"
                class="mx-auto grid w-full max-w-site gap-10 px-4 py-20 md:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-24"
            >
                <div class="lg:col-span-7">
                    <Kicker>Criterio editorial</Kicker>
                    <h2
                        id="calidad"
                        class="mt-2 font-serif text-[2rem] leading-[1.15] tracking-[-0.015em] text-highlighted text-balance md:text-h1"
                    >
                        Calidad frente a cantidad: centenares de horas de documentación detrás de cada entrada.
                    </h2>
                </div>
                <dl class="grid grid-cols-2 self-end border-t border-default lg:col-span-5">
                    <div
                        v-for="fact in facts"
                        :key="fact.label"
                        class="flex flex-col-reverse gap-1 border-b border-default py-5 odd:pr-4 even:border-l even:pl-5"
                    >
                        <dt class="font-sans text-meta text-muted">
                            {{ fact.label }}
                        </dt>
                        <dd class="font-serif text-[2rem] leading-none text-highlighted tabular-nums">
                            {{ fact.value }}
                        </dd>
                    </div>
                </dl>
            </section>

            <section
                aria-label="Participa"
                class="mx-auto grid w-full max-w-site gap-6 px-4 pb-20 md:grid-cols-2 md:px-8 lg:px-12"
            >
                <div
                    v-for="item in participation"
                    :key="item.title"
                    class="flex flex-col items-start gap-4 rounded-sm border border-default bg-ivory-50 p-6 md:p-8"
                >
                    <span class="flex size-11 items-center justify-center rounded-full bg-huella-teal-100 text-huella-teal-700">
                        <UIcon
                            :name="item.icon"
                            class="size-5"
                        />
                    </span>
                    <h2 class="font-serif text-h3 text-highlighted">
                        {{ item.title }}
                    </h2>
                    <p class="max-w-md font-serif text-base leading-relaxed text-toned">
                        {{ item.body }}
                    </p>
                    <UButton
                        variant="link"
                        :label="item.action"
                        trailing-icon="i-lucide-arrow-right"
                        to="/lab/publicar"
                        class="mt-auto -ml-3"
                    />
                </div>
            </section>

            <NewsletterBand />
        </main>

        <SiteFooter />
    </div>
</template>
