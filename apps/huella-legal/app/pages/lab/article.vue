<script setup lang="ts">
import ArticleCard from "~/lab/ArticleCard.vue";
import Kicker from "~/lab/Kicker.vue";
import MediaFallback from "~/lab/MediaFallback.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import { bibliography, body, notes, toc } from "~/lab/article-body";
import { articles, authors, fundamentals, issn } from "~/lab/fixtures";

useHead({ title: "La teoría jurídica del delito · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const article = articles[0]!;
const author = authors.xifre;
const related = [articles[4]!, articles[2]!, articles[1]!];
const seriesIndex = 1;

const breadcrumb = [
    { label: "Portada", to: "/lab/home" },
    { label: "Publicaciones", to: "/lab/category" },
    { label: article.category, to: "/lab/category" },
];

const citation = `FONT, X. (2024). «${article.title}». Huella Legal, ${article.issue}. ${issn}. Disponible en huellalegal.com/la-teoria-juridica-del-delito`;

const share = [
    { icon: "i-lucide-link", label: "Copiar enlace" },
    { icon: "i-lucide-linkedin", label: "Compartir en LinkedIn" },
    { icon: "i-lucide-twitter", label: "Compartir en X" },
    { icon: "i-lucide-mail", label: "Enviar por correo" },
];

const active = ref<string>(toc[0].id);

onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target.id);

        if (visible[0]) active.value = visible[0];
    }, { rootMargin: "0px 0px -70% 0px" });

    toc.forEach((item) => document.getElementById(item.id) && observer.observe(document.getElementById(item.id)!));
    onBeforeUnmount(() => observer.disconnect());
});
</script>

<template>
    <div>
        <SiteHeader current="Publicaciones" />

        <main>
            <article>
                <!-- Header aligns with the reading column, so the page has one left edge -->
                <header class="mx-auto grid max-w-site grid-cols-1 px-4 pt-6 md:px-8 md:pt-10 lg:grid-cols-12 lg:gap-x-8 lg:px-12">
                    <div class="lg:col-span-9 lg:col-start-4">
                        <UBreadcrumb
                            :items="breadcrumb"
                            :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                        />
                        <div class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 md:mt-8">
                            <Kicker href="/lab/category">
                                {{ article.category }}
                            </Kicker>
                            <span class="font-sans text-xs tabular-nums text-dimmed">{{ article.issue }}</span>
                            <a
                                href="#serie"
                                class="inline-flex min-h-6 items-center font-sans text-xs font-semibold text-primary hover:underline"
                            >Serie Fundamentos · {{ seriesIndex + 1 }} de {{ fundamentals.length }}</a>
                        </div>
                        <h1 class="mt-4 max-w-[18ch] font-serif text-[2.375rem] leading-[1.08] tracking-[-0.02em] text-highlighted text-balance md:text-[3.25rem] lg:text-[3.75rem]">
                            {{ article.title }}
                        </h1>
                        <p class="mt-5 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned md:text-[1.3125rem]">
                            {{ article.excerpt }}
                        </p>

                        <div class="mt-8 flex max-w-measure flex-col gap-4 border-y border-default py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div class="flex items-center gap-3">
                                <span
                                    class="flex size-11 shrink-0 items-center justify-center rounded-full bg-huella-slate-100 font-sans text-xs font-semibold text-primary"
                                    aria-hidden="true"
                                >{{ author.initials }}</span>
                                <div class="font-sans text-meta leading-snug">
                                    <a
                                        href="#autor"
                                        class="inline-flex min-h-6 items-center font-semibold text-highlighted hover:underline"
                                    >{{ author.name }}</a>
                                    <span class="text-muted"> · {{ author.role }}</span>
                                    <p class="text-muted">
                                        <time>{{ article.date }}</time> · {{ article.readingMinutes }} min de lectura
                                    </p>
                                </div>
                            </div>
                            <div class="-ml-3 flex items-center gap-1 sm:ml-0 sm:-mr-3">
                                <UButton
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-quote"
                                    label="Citar"
                                    to="#citar"
                                />
                                <UButton
                                    v-for="item in share"
                                    :key="item.label"
                                    square
                                    variant="ghost"
                                    color="neutral"
                                    :icon="item.icon"
                                    :aria-label="item.label"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <figure class="mx-auto mt-8 max-w-site px-4 md:mt-10 md:px-8 lg:px-12">
                    <div class="@container aspect-[16/9] overflow-hidden rounded-xs lg:aspect-[21/9]">
                        <MediaFallback
                            tone="slate"
                            label="Imagen del artículo"
                        />
                    </div>
                    <figcaption class="mt-3 font-sans text-meta text-muted lg:ml-[calc(25%+0.5rem)]">
                        Alegoría de la Justicia, óleo sobre lienzo. <span class="text-dimmed">Dominio público.</span>
                    </figcaption>
                </figure>

                <div class="mx-auto grid max-w-site grid-cols-1 px-4 pt-10 pb-20 md:px-8 md:pt-14 lg:grid-cols-12 lg:gap-x-8 lg:px-12">
                    <!-- Table of contents: side rail on desktop, disclosure on mobile -->
                    <nav
                        aria-label="En este artículo"
                        class="lg:col-span-3"
                    >
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

                        <div class="sticky top-8 hidden lg:block">
                            <p class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                En este artículo
                            </p>
                            <ol class="mt-4 flex flex-col border-l border-default">
                                <li
                                    v-for="item in toc"
                                    :key="item.id"
                                >
                                    <a
                                        :href="`#${item.id}`"
                                        :aria-current="active === item.id ? 'location' : undefined"
                                        class="-ml-px flex min-h-9 items-center border-l-2 border-transparent py-1 font-sans leading-snug text-muted transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary aria-[current=location]:border-primary aria-[current=location]:font-semibold aria-[current=location]:text-highlighted"
                                        :class="item.level === 3 ? 'pl-7 text-[0.8125rem]' : 'pl-4 text-sm'"
                                    >{{ item.label }}</a>
                                </li>
                            </ol>
                        </div>
                    </nav>

                    <div class="min-w-0 lg:col-span-9">
                        <!-- eslint-disable-next-line vue/no-v-html -- fixture HTML stands in for WordPress content -->
                        <div
                            class="hl-prose max-w-measure"
                            v-html="body"
                        />

                        <!-- End matter -->
                        <div class="mt-16 flex max-w-measure flex-col gap-12">
                            <section
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
                                        <span class="font-sans text-xs font-semibold leading-6 text-secondary">{{ note.id }}</span>
                                        <span>
                                            {{ note.text }}
                                            <a
                                                :href="`#ref-${note.id}`"
                                                class="ml-1 inline-flex font-sans text-xs font-semibold text-secondary hover:underline"
                                                :aria-label="`Volver a la llamada ${note.id}`"
                                            >↩</a>
                                        </span>
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
                                <div class="flex items-start justify-between gap-4">
                                    <h2
                                        id="citar-titulo"
                                        class="font-serif text-xl text-highlighted"
                                    >
                                        Cómo citar este artículo
                                    </h2>
                                    <UButton
                                        variant="outline"
                                        color="neutral"
                                        icon="i-lucide-copy"
                                        label="Copiar"
                                        class="shrink-0"
                                    />
                                </div>
                                <p class="mt-3 font-serif text-citation break-words text-toned">
                                    {{ citation }}
                                </p>
                            </section>

                            <ul
                                aria-label="Etiquetas"
                                class="flex flex-wrap gap-2"
                            >
                                <li
                                    v-for="tag in ['Dogmática penal', 'Teoría del delito', 'Culpabilidad', 'Código Penal']"
                                    :key="tag"
                                >
                                    <a
                                        href="/lab/category"
                                        class="inline-flex min-h-11 items-center rounded-full border border-default px-4 font-sans text-sm font-medium text-toned transition-colors hover:border-(--ui-border-accented) hover:bg-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                    >{{ tag }}</a>
                                </li>
                            </ul>

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
                                        to="/lab/colaboradores"
                                        class="mt-2 -ml-3"
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </article>

            <!-- Series navigation, then related reading -->
            <section
                id="serie"
                aria-labelledby="serie-titulo"
                class="border-y border-default bg-ivory-50"
            >
                <div class="mx-auto grid max-w-site grid-cols-1 gap-8 px-4 py-12 md:px-8 lg:grid-cols-12 lg:gap-x-8 lg:px-12">
                    <div class="lg:col-span-3">
                        <Kicker>Serie</Kicker>
                        <h2
                            id="serie-titulo"
                            class="mt-1 font-serif text-h3 text-highlighted"
                        >
                            Fundamentos del Derecho penal
                        </h2>
                    </div>
                    <ol class="grid gap-px overflow-hidden rounded-xs border border-default bg-(--ui-border) sm:grid-cols-2 lg:col-span-9 lg:grid-cols-5">
                        <li
                            v-for="(item, index) in fundamentals"
                            :key="item.slug"
                            class="bg-ivory-50"
                        >
                            <a
                                href="/lab/article"
                                :aria-current="index === seriesIndex ? 'page' : undefined"
                                class="flex h-full min-h-24 flex-col gap-2 p-4 transition-colors hover:bg-ivory-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-[current=page]:bg-primary aria-[current=page]:text-ivory-50"
                            >
                                <span
                                    class="font-sans text-xs font-semibold tabular-nums"
                                    :class="index === seriesIndex ? 'text-huella-teal-200' : 'text-secondary'"
                                >{{ index === seriesIndex ? 'Estás leyendo' : `${index + 1} de ${fundamentals.length}` }}</span>
                                <span
                                    class="font-serif text-base leading-snug"
                                    :class="index === seriesIndex ? 'text-ivory-50' : 'text-highlighted'"
                                >{{ item.title }}</span>
                            </a>
                        </li>
                    </ol>
                </div>
            </section>

            <section
                aria-labelledby="sigue-leyendo"
                class="mx-auto max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20"
            >
                <div class="border-t-2 border-huella-slate-900 pt-4">
                    <h2
                        id="sigue-leyendo"
                        class="font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                    >
                        Sigue leyendo
                    </h2>
                </div>
                <div class="mt-8 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                    <ArticleCard
                        v-for="(item, index) in related"
                        :key="item.slug"
                        :article="item"
                        :class="index === 2 && 'md:hidden lg:flex'"
                    />
                </div>
            </section>

            <NewsletterBand />
        </main>

        <SiteFooter />
    </div>
</template>

<style src="~/lab/prose.css"></style>
