<script setup lang="ts">
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import { categories, tags } from "~/lab/fixtures";
import { provideVariant } from "~/lab/variant";

provideVariant("a");
useHead({ title: "Materias (A) · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const academic = categories.find((item) => item.slug === "trabajos-tfg-tfm")!;
const areas = categories.filter((item) => item !== academic);
</script>

<template>
    <div>
        <SiteHeader current="Materias" />

        <main>
            <section class="border-b border-default">
                <div
                    class="mx-auto grid max-w-site gap-6 px-4 pt-6 pb-10 md:px-8 md:pt-10 md:pb-14 lg:grid-cols-12 lg:items-end lg:gap-12 lg:px-12"
                >
                    <div class="lg:col-span-12">
                        <UBreadcrumb
                            :items="[
                                { label: 'Portada', to: '/lab/attempts/home-a' },
                                { label: 'Materias' },
                            ]"
                            :ui="{
                                link: 'font-sans text-meta min-h-11 inline-flex items-center',
                                separatorIcon: 'size-4',
                            }"
                        />
                    </div>
                    <div class="lg:col-span-8">
                        <Kicker>Índice</Kicker>
                        <h1
                            class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted md:text-[3.5rem]"
                        >
                            Materias
                        </h1>
                        <p
                            class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned"
                        >
                            Diez áreas del Derecho y un archivo de trabajos académicos publicados
                            íntegramente. Cada materia reúne sus artículos por orden de publicación.
                        </p>
                    </div>
                </div>
            </section>

            <section
                aria-label="Áreas del Derecho"
                class="mx-auto max-w-site px-4 py-12 md:px-8 lg:px-12 lg:py-16"
            >
                <ol class="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                    <li
                        v-for="(item, index) in areas"
                        :key="item.slug"
                        class="border-t border-default"
                    >
                        <a
                            href="/lab/category"
                            class="group flex h-full flex-col gap-3 pt-5 pb-10 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                        >
                            <span
                                class="flex items-baseline justify-between gap-4 font-sans text-xs font-semibold tabular-nums text-secondary"
                            >
                                <span>{{ String(index + 1).padStart(2, "0") }}</span>
                                <span class="font-medium text-muted"
                                    >{{ item.count }} publicaciones</span
                                >
                            </span>
                            <span
                                class="font-serif text-h3 text-highlighted decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline"
                                >{{ item.name }}</span
                            >
                            <span class="font-serif text-base leading-relaxed text-toned">{{
                                item.description
                            }}</span>
                        </a>
                    </li>
                </ol>

                <!-- The academic archive is a different kind of collection, so it gets its own band -->
                <a
                    href="/lab/category"
                    class="group mt-4 grid gap-6 rounded-sm bg-huella-slate-900 p-6 text-huella-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:grid-cols-[1fr_auto] md:items-center md:p-10"
                >
                    <span class="flex flex-col gap-3">
                        <Kicker tone="paper"
                            >Archivo académico · {{ academic.count }} trabajos</Kicker
                        >
                        <span
                            class="font-serif text-[1.75rem] leading-tight text-ivory-50 md:text-h2"
                            >{{ academic.name }}</span
                        >
                        <span class="max-w-2xl font-serif text-base leading-relaxed">{{
                            academic.description
                        }}</span>
                    </span>
                    <span
                        class="inline-flex min-h-11 items-center gap-2 self-start rounded-md bg-ivory-50 px-4 font-sans text-sm font-semibold text-highlighted transition-colors group-hover:bg-white md:self-center"
                    >
                        Ver trabajos
                        <UIcon name="i-lucide-arrow-right" class="size-4" />
                    </span>
                </a>
            </section>

            <section aria-labelledby="etiquetas" class="border-t border-default bg-ivory-50">
                <div
                    class="mx-auto grid max-w-site gap-8 px-4 py-12 md:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-16"
                >
                    <div class="lg:col-span-4">
                        <h2 id="etiquetas" class="font-serif text-h3 text-highlighted">
                            Etiquetas
                        </h2>
                        <p class="mt-2 font-serif text-base leading-relaxed text-toned">
                            Temas transversales que cruzan varias materias.
                        </p>
                    </div>
                    <ul class="flex flex-wrap gap-2 lg:col-span-8">
                        <li v-for="[name, count] in tags" :key="name">
                            <a
                                href="/lab/category"
                                class="inline-flex min-h-11 items-center gap-2 rounded-full border border-default bg-ivory-100 px-4 font-sans text-sm font-medium text-toned transition-colors hover:border-(--ui-border-accented) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >{{ name }}
                                <span class="text-xs tabular-nums text-dimmed">{{ count }}</span></a
                            >
                        </li>
                    </ul>
                </div>
            </section>

            <NewsletterBand />
        </main>

        <SiteFooter />
    </div>
</template>
