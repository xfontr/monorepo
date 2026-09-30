<script setup lang="ts">
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import { authors } from "~/lab/fixtures";

useHead({ title: "Colaboradores · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const query = ref("");
const people = Object.values(authors);
const visible = computed(() => people.filter((person) => person.name.toLowerCase().includes(query.value.trim().toLowerCase())));

const principles = [
    { title: "Rigor", body: "Cada entrada se apoya en fuentes verificables: legislación, jurisprudencia y doctrina citadas con precisión." },
    { title: "Accesibilidad", body: "Escribimos para que un lector sin formación jurídica pueda seguir el razonamiento sin perder el hilo." },
    { title: "Acceso libre", body: "Todo lo publicado se puede leer sin registro y sin muro de pago." },
];
</script>

<template>
    <div>
        <SiteHeader current="Colaboradores" />

        <main>
            <!-- About: the "Sobre" page lives here, as it does on the current site -->
            <section class="border-b border-default">
                <div class="mx-auto grid max-w-site grid-cols-1 gap-4 px-4 pt-6 pb-10 md:px-8 md:pt-10 lg:grid-cols-12 lg:gap-x-12 lg:px-12 lg:pb-12">
                    <div class="mb-2 md:mb-4 lg:col-span-12">
                        <UBreadcrumb
                            :items="[{ label: 'Portada', to: '/lab/home' }, { label: 'Colaboradores' }]"
                            :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                        />
                    </div>
                    <div class="lg:col-span-7">
                        <Kicker>Sobre Huella Legal</Kicker>
                        <h1 class="mt-2 font-serif text-[2.5rem] leading-[1.06] tracking-[-0.02em] text-highlighted text-balance md:text-[3.5rem]">
                            Una revista escrita por quienes practican, enseñan y estudian el Derecho.
                        </h1>
                    </div>
                    <div class="flex max-w-measure flex-col gap-5 font-serif text-[1.125rem] leading-relaxed text-toned lg:col-span-5 lg:pt-10">
                        <p>
                            Huella Legal nació para acercar el Derecho a cualquier lector sin rebajar el rigor. Hoy reúne a más de cuarenta colaboradores de España, Argentina, Chile, México, Cuba y Colombia: estudiantes, abogados, fiscales, jueces y profesores.
                        </p>
                        <p>
                            Valoramos enormemente cada aportación. Por eso cada colaborador tiene aquí su ficha, con su trayectoria y el enlace a todo lo que ha publicado.
                        </p>
                        <div class="flex flex-col gap-3 pt-1 sm:flex-row">
                            <UButton
                                label="Publicar un artículo"
                                to="/lab/publicar"
                                class="justify-center"
                            />
                            <UButton
                                variant="outline"
                                color="neutral"
                                label="Contactar"
                                class="justify-center"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section
                aria-label="Principios editoriales"
                class="mx-auto max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20"
            >
                <ol class="grid gap-x-10 gap-y-8 lg:grid-cols-3">
                    <li
                        v-for="(item, index) in principles"
                        :key="item.title"
                        class="border-t-2 border-huella-slate-900 pt-4"
                    >
                        <span class="font-serif text-2xl leading-none text-huella-teal-600 tabular-nums">{{ index + 1 }}</span>
                        <h2 class="mt-3 font-serif text-h3 text-highlighted">
                            {{ item.title }}
                        </h2>
                        <p class="mt-2 font-serif text-base leading-relaxed text-toned">
                            {{ item.body }}
                        </p>
                    </li>
                </ol>
            </section>

            <section
                aria-labelledby="directorio"
                class="border-t border-default bg-ivory-50"
            >
                <div class="mx-auto max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20">
                    <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2
                                id="directorio"
                                class="font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                            >
                                Colaboradores
                            </h2>
                            <p class="mt-1 font-sans text-meta text-muted">
                                45 autores · por número de publicaciones
                            </p>
                        </div>
                        <UFormField
                            label="Buscar por nombre"
                            class="w-full md:w-80"
                        >
                            <UInput
                                v-model="query"
                                icon="i-lucide-search"
                                placeholder="Por ejemplo, Crespo"
                                class="w-full"
                            />
                        </UFormField>
                    </div>

                    <ul
                        v-if="visible.length"
                        class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <li
                            v-for="person in visible"
                            :key="person.name"
                        >
                            <article class="group relative flex h-full flex-col gap-4 rounded-sm border border-default bg-ivory-100 p-5 transition-colors hover:border-(--ui-border-accented)">
                                <div class="flex items-start gap-4">
                                    <span
                                        class="flex size-14 shrink-0 items-center justify-center rounded-full bg-huella-slate-100 font-sans text-sm font-semibold text-primary"
                                        aria-hidden="true"
                                    >{{ person.initials }}</span>
                                    <div class="min-w-0">
                                        <h3 class="font-serif text-xl leading-snug text-highlighted text-balance">
                                            <a
                                                href="/lab/category?autor=1"
                                                class="decoration-huella-slate-300 underline-offset-[0.2em] after:absolute after:inset-0 group-hover:underline focus-visible:outline-none after:rounded-sm focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
                                            >{{ person.name }}</a>
                                        </h3>
                                        <p
                                            v-if="person.role"
                                            class="mt-0.5 font-sans text-meta text-muted"
                                        >
                                            {{ person.role }}
                                        </p>
                                    </div>
                                </div>
                                <p
                                    v-if="person.bio"
                                    class="line-clamp-3 font-serif text-[0.9375rem] leading-relaxed text-toned"
                                >
                                    {{ person.bio }}
                                </p>
                                <p class="mt-auto flex items-center justify-between border-t border-(--ui-border-muted) pt-3 font-sans text-meta text-muted">
                                    <span>{{ person.articles ?? 1 }} {{ (person.articles ?? 1) === 1 ? 'publicación' : 'publicaciones' }}</span>
                                    <UIcon
                                        name="i-lucide-arrow-right"
                                        class="size-4 text-dimmed transition-transform group-hover:translate-x-0.5"
                                    />
                                </p>
                            </article>
                        </li>
                    </ul>

                    <div
                        v-else
                        class="mt-8 flex flex-col items-center gap-3 rounded-sm border border-dashed border-(--ui-border-accented) px-6 py-14 text-center"
                    >
                        <UIcon
                            name="i-lucide-users"
                            class="size-6 text-dimmed"
                        />
                        <p class="font-serif text-xl text-highlighted">
                            Ningún colaborador se llama «{{ query }}»
                        </p>
                        <p class="max-w-sm font-serif text-base text-toned">
                            Prueba con el primer apellido o revisa los acentos.
                        </p>
                        <UButton
                            variant="link"
                            label="Ver todos"
                            @click="query = ''"
                        />
                    </div>

                    <div class="mt-10 flex justify-center">
                        <UButton
                            variant="outline"
                            color="neutral"
                            label="Mostrar los 45 colaboradores"
                            trailing-icon="i-lucide-chevron-down"
                        />
                    </div>
                </div>
            </section>

            <NewsletterBand />
        </main>

        <SiteFooter />
    </div>
</template>
