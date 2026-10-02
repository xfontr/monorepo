<script setup lang="ts">
import LabByline from "~/lab/Byline.vue";
import LabKicker from "~/lab/Kicker.vue";
import LabMediaFallback from "~/lab/MediaFallback.vue";
import LabSectionHeading from "~/lab/SectionHeading.vue";
import LabWordmark from "~/lab/Wordmark.vue";
import { author } from "~/lab/fixtures";

useHead({ title: "Primitivas · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const labAuthors = [author("María José Fernández de la Vega"), author("Luis Martín Ortega")];
const authors = labAuthors.map((person, index) => ({ id: String(index), name: person.name, to: "#" }));
const pills = [
    { label: "Derecho penal", count: 24, active: true },
    { label: "Derecho civil", count: 18 },
    { label: "Teoría del Derecho", count: 7 },
    { label: "Derecho internacional público y relaciones internacionales" },
];
</script>

<template>
    <main class="mx-auto flex max-w-site flex-col gap-12 px-4 py-10 md:px-8 lg:px-12">
        <p class="font-sans text-sm text-muted">
            <span class="rounded-full bg-huella-ink-900 px-2 py-0.5 text-xs font-semibold text-white">Laboratorio</span>
            Arriba el original del laboratorio, abajo el componente que lo sustituye.
        </p>

        <section class="flex flex-col gap-4">
            <LabKicker>Wordmark</LabKicker>
            <div class="flex flex-wrap items-end gap-8">
                <LabWordmark size="sm" />
                <LabWordmark tagline />
                <LabWordmark size="lg" />
                <span class="bg-huella-slate-900 p-4"><LabWordmark
                    tone="paper"
                    tagline
                /></span>
            </div>
            <div class="flex flex-wrap items-end gap-8">
                <BaseWordmark size="sm" />
                <BaseWordmark tagline />
                <BaseWordmark size="lg" />
                <span class="bg-huella-slate-900 p-4"><BaseWordmark
                    tone="paper"
                    tagline
                /></span>
            </div>
        </section>

        <section class="flex flex-col gap-4">
            <LabKicker>Kicker</LabKicker>
            <div class="flex flex-wrap gap-6">
                <LabKicker href="#">
                    Derecho penal
                </LabKicker>
                <LabKicker tone="muted">
                    Ensayo
                </LabKicker>
                <span class="bg-huella-slate-900 px-2"><LabKicker tone="paper">Materia</LabKicker></span>
            </div>
            <div class="flex flex-wrap gap-6">
                <BaseKicker to="#">
                    Derecho penal
                </BaseKicker>
                <BaseKicker tone="muted">
                    Ensayo
                </BaseKicker>
                <span class="bg-huella-slate-900 px-2"><BaseKicker tone="paper">Materia</BaseKicker></span>
            </div>
        </section>

        <section class="flex flex-col gap-4">
            <LabKicker>Byline</LabKicker>
            <LabByline
                :authors="labAuthors"
                date="12 de marzo de 2024"
                :reading-minutes="14"
                avatars
            />
            <Byline
                :authors
                published-at="2024-03-12T09:00:00Z"
                :reading-minutes="14"
                avatars
            />
        </section>

        <section class="flex flex-col gap-4">
            <LabKicker>SectionHeading</LabKicker>
            <LabSectionHeading
                title="Publicaciones recientes"
                kicker="Archivo"
                link="Ver todas"
            />
            <BaseSectionHeading
                title="Publicaciones recientes"
                kicker="Archivo"
                link="Ver todas"
                to="#"
            />
        </section>

        <section class="flex flex-col gap-4">
            <LabKicker>MediaFallback</LabKicker>
            <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div class="aspect-[3/2] @container">
                    <LabMediaFallback label="Imagen del artículo" />
                </div>
                <div class="aspect-[3/2] @container">
                    <LabMediaFallback tone="slate" />
                </div>
                <div class="aspect-[3/2] @container">
                    <BaseMediaFallback label="Imagen del artículo" />
                </div>
                <div class="aspect-[3/2] @container">
                    <BaseMediaFallback tone="slate" />
                </div>
            </div>
        </section>

        <section class="flex flex-col gap-4">
            <LabKicker>TagPill</LabKicker>
            <div class="flex flex-wrap gap-2">
                <a
                    href="#"
                    aria-current="page"
                    class="inline-flex min-h-11 items-center rounded-full bg-primary px-4 font-sans text-sm font-medium text-ivory-50"
                >Derecho penal</a>
                <a
                    href="#"
                    class="inline-flex min-h-11 items-center rounded-full border border-default px-4 font-sans text-sm font-medium text-toned transition-colors hover:border-(--ui-border-accented) hover:bg-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >Derecho civil</a>
            </div>
            <div class="flex flex-wrap gap-2">
                <BaseTagPill
                    v-for="pill in pills"
                    :key="pill.label"
                    :label="pill.label"
                    to="#"
                    :count="pill.count"
                    :active="pill.active"
                />
            </div>
        </section>

        <section class="flex flex-col gap-4">
            <LabKicker>UAvatar · UAvatarGroup</LabKicker>
            <div class="flex flex-wrap items-center gap-4">
                <UAvatar
                    v-for="size in (['lg', '2xl'] as const)"
                    :key="size"
                    :size
                    :text="initials(authors[0]!.name)"
                    alt=""
                />
                <UAvatar
                    class="size-14 text-sm md:size-18"
                    :text="initials(authors[0]!.name)"
                    alt=""
                />
                <UAvatar
                    class="size-20 text-lg md:size-24 lg:size-28"
                    :text="initials(authors[0]!.name)"
                    alt=""
                />
                <UAvatarGroup
                    size="lg"
                    :ui="{ base: '-me-2' }"
                >
                    <UAvatar
                        v-for="person in authors"
                        :key="person.id"
                        :text="initials(person.name)"
                        alt=""
                    />
                </UAvatarGroup>
            </div>
        </section>
    </main>
</template>
