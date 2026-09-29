<script setup lang="ts">
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import { authors } from "~/lab/fixtures";
import { navB, series, seriesEntries, subjects } from "~/lab/fixtures-b";
import { provideVariantB } from "~/lab/variant";

provideVariantB();
useHead({ title: "Fundamentos del Derecho penal (B) · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const current = series[0]!;
const entries = seriesEntries(current.slug);
const subject = subjects.find((item) => item.slug === current.subject)!;
const totalMinutes = entries.reduce((sum, item) => sum + item.readingMinutes, 0);
const duration = `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min`;

const notes = {
    changes: [
        "Página propia para cada serie, que en A no existe: introducción, lecturas numeradas con entradilla y tiempo total.",
        "Nota de la redacción firmada que explica para quién es la serie, como las de Lawfare o Just Security.",
        "El estado de la serie queda a la vista (completa o en curso), para que nadie espere una sexta entrega.",
        "Sin cifras grandes: número de lecturas, tiempo total y estado van en una sola línea, y así no se desbordan en móvil.",
    ],
    sources: [
        { element: "Serie", source: "Etiqueta de WP; nombre y descripción del término. Core." },
        { element: "Orden", source: "No puede ser la fecha: la lectura 2 se publicó en 2024, después de la 5. Hace falta un número en el título o el slug, o un orden fijado a mano.", risk: true },
        { element: "Nota de la redacción", source: "Descripción del término, o una entrada fija de la serie.", risk: false },
        { element: "Estado «completa»", source: "No hay campo: se escribe en la descripción del término.", risk: true },
    ],
};
</script>

<template>
    <div>
        <SiteHeader
            current="Series"
            :nav="navB"
        />

        <main>
            <section class="border-b border-default">
                <div class="mx-auto grid max-w-site gap-8 px-4 pt-6 pb-10 md:px-8 md:pt-10 lg:grid-cols-12 lg:items-end lg:gap-12 lg:px-12 lg:pb-14">
                    <div class="lg:col-span-8">
                        <UBreadcrumb
                            :items="[{ label: 'Portada', to: '/lab/home-b' }, { label: 'Series' }, { label: current.name }]"
                            :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                        />
                        <Kicker class="mt-6 md:mt-8">
                            Serie · {{ subject.name }}
                        </Kicker>
                        <h1 class="mt-2 max-w-[16ch] font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted text-balance md:text-[3.5rem]">
                            {{ current.name }}
                        </h1>
                        <p class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned">
                            {{ current.description }}
                        </p>
                    </div>
                    <div class="flex flex-col gap-4 lg:col-span-4">
                        <p class="border-y border-default py-4 font-sans text-meta text-muted">
                            <strong class="font-semibold text-highlighted">{{ entries.length }} lecturas</strong> · {{ duration }} en total · serie completa
                        </p>
                        <UButton
                            label="Empezar por la primera"
                            trailing-icon="i-lucide-arrow-right"
                            to="/lab/article-b"
                            class="justify-center self-start"
                        />
                    </div>
                </div>
            </section>

            <div class="mx-auto grid max-w-site gap-12 px-4 py-12 md:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-16">
                <ol class="flex flex-col lg:col-span-8">
                    <li
                        v-for="item in entries"
                        :key="item.slug"
                        class="group relative grid grid-cols-[3rem_1fr] border-t border-default py-7 first:border-t-2 first:border-huella-slate-900 md:grid-cols-[5rem_1fr]"
                    >
                        <span class="font-serif text-[2.5rem] leading-none text-huella-teal-600 tabular-nums md:text-[3.25rem]">{{ item.series!.position }}</span>
                        <div class="flex flex-col gap-2">
                            <h2 class="font-serif text-[1.5rem] leading-tight text-highlighted md:text-h2">
                                <a
                                    href="/lab/article-b"
                                    class="decoration-huella-slate-300 decoration-1 underline-offset-[0.2em] group-hover:underline after:absolute after:inset-0 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                                >{{ item.title }}</a>
                            </h2>
                            <p class="max-w-measure font-serif text-base leading-relaxed text-toned md:text-lg">
                                {{ item.excerpt }}
                            </p>
                            <p class="font-sans text-meta text-muted">
                                {{ item.readingMinutes }} min de lectura · {{ item.date }}
                            </p>
                        </div>
                    </li>
                </ol>

                <aside
                    aria-labelledby="nota-redaccion"
                    class="lg:col-span-4"
                >
                    <div class="border-l-2 border-huella-teal-400 pl-5 lg:sticky lg:top-6">
                        <h2
                            id="nota-redaccion"
                            class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                        >
                            Nota de la redacción
                        </h2>
                        <p class="mt-3 font-serif text-base leading-relaxed text-toned">
                            Escribimos esta serie para quien empieza Derecho penal o vuelve a él después de años. Cada texto se sostiene solo, pero el orden importa: la teoría del delito se entiende mejor después de saber qué es el Derecho penal, y las escuelas se entienden mejor después de la teoría.
                        </p>
                        <p class="mt-3 font-sans text-meta text-muted">
                            — {{ authors.xifre.name }}, {{ authors.xifre.role?.toLowerCase() }}
                        </p>
                    </div>
                </aside>
            </div>

            <NewsletterBand />
        </main>

        <SiteFooter />

        <VariantNotes
            label="Serie · nueva en B"
            v-bind="notes"
        />
    </div>
</template>
