<script setup lang="ts">
import ArticleCard from "~/lab/ArticleCard.vue";
import Kicker from "~/lab/Kicker.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import { articles, categories } from "~/lab/fixtures";

useHead({ title: "Estados · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const found = [articles[0]!, articles[4]!];
</script>

<template>
    <div>
        <SiteHeader />

        <main class="mx-auto flex max-w-site flex-col gap-6 px-4 py-10 md:px-8 lg:px-12">
            <p class="font-sans text-sm text-muted">
                <span class="rounded-full bg-huella-ink-900 px-2 py-0.5 text-xs font-semibold text-white">Laboratorio</span>
                Cada bloque es el contenido principal de una página; cabecera y pie no cambian.
            </p>

            <!-- 404 -->
            <section
                aria-label="Página no encontrada"
                class="rounded-sm border border-default px-5 py-12 md:px-12 md:py-20"
            >
                <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
                    <div class="lg:col-span-7">
                        <Kicker>Error 404</Kicker>
                        <h1 class="mt-3 font-serif text-[2.25rem] leading-[1.08] tracking-[-0.02em] text-highlighted text-balance md:text-[3rem]">
                            Esta página no existe o ha cambiado de dirección.
                        </h1>
                        <p class="mt-4 max-w-measure font-serif text-[1.125rem] leading-relaxed text-toned">
                            Puede que el artículo se haya movido al reorganizar las materias. Búscalo por su título o empieza por la portada.
                        </p>
                        <form
                            class="mt-8 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end"
                            role="search"
                            @submit.prevent
                        >
                            <UFormField
                                label="Buscar en Huella Legal"
                                class="flex-1"
                            >
                                <UInput
                                    icon="i-lucide-search"
                                    placeholder="Título, autor o materia"
                                    class="w-full"
                                />
                            </UFormField>
                            <UButton
                                type="submit"
                                label="Buscar"
                                class="justify-center"
                            />
                        </form>
                        <UButton
                            variant="link"
                            label="Ir a la portada"
                            trailing-icon="i-lucide-arrow-right"
                            to="/lab/home"
                            class="mt-4 -ml-3"
                        />
                    </div>
                    <div class="lg:col-span-5">
                        <p class="border-t-2 border-huella-slate-900 pt-4 font-serif text-xl text-highlighted">
                            Lo más leído
                        </p>
                        <ul class="mt-2 flex flex-col divide-y divide-(--ui-border-muted)">
                            <li
                                v-for="article in articles.slice(0, 3)"
                                :key="article.slug"
                                class="py-4"
                            >
                                <ArticleCard
                                    :article="article"
                                    variant="compact"
                                />
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Search results -->
            <section
                aria-label="Resultados de búsqueda"
                class="rounded-sm border border-default px-5 py-10 md:px-12 md:py-14"
            >
                <form
                    class="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end"
                    role="search"
                    @submit.prevent
                >
                    <UFormField
                        label="Buscar"
                        class="flex-1"
                    >
                        <UInput
                            icon="i-lucide-search"
                            model-value="culpabilidad"
                            class="w-full"
                        />
                    </UFormField>
                    <UButton
                        type="submit"
                        label="Buscar"
                        class="justify-center"
                    />
                </form>
                <p
                    role="status"
                    class="mt-6 border-b-2 border-huella-slate-900 pb-3 font-sans text-sm text-muted"
                >
                    <span class="font-semibold text-highlighted">12 resultados</span> para «culpabilidad»
                </p>
                <ol class="flex max-w-3xl flex-col divide-y divide-(--ui-border-muted)">
                    <li
                        v-for="article in found"
                        :key="article.slug"
                        class="py-7"
                    >
                        <ArticleCard :article="article" />
                    </li>
                </ol>
            </section>

            <div class="grid gap-6 lg:grid-cols-2">
                <!-- No results -->
                <section
                    aria-label="Búsqueda sin resultados"
                    class="flex flex-col items-start gap-4 rounded-sm border border-default px-5 py-10 md:px-10"
                >
                    <UIcon
                        name="i-lucide-search-x"
                        class="size-7 text-dimmed"
                    />
                    <h2 class="font-serif text-h3 text-highlighted">
                        Ningún resultado para «kardashov»
                    </h2>
                    <ul class="list-disc pl-5 font-serif text-base leading-relaxed text-toned marker:text-huella-teal-500">
                        <li>
Revisa la ortografía: ¿quizá <a
                            href="#"
                            class="text-primary underline underline-offset-2"
                        >«Kardashev»</a>?
</li>
                        <li>Prueba con una palabra más general o con el apellido del autor.</li>
                    </ul>
                    <p class="mt-2 font-sans text-meta font-semibold text-highlighted">
                        O explora por materia
                    </p>
                    <ul class="flex flex-wrap gap-2">
                        <li
                            v-for="item in categories.slice(0, 4)"
                            :key="item.slug"
                        >
                            <a
                                href="/lab/category"
                                class="inline-flex min-h-11 items-center rounded-full border border-default px-4 font-sans text-sm font-medium text-toned hover:bg-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >{{ item.name }}</a>
                        </li>
                    </ul>
                </section>

                <!-- Empty listing: the empty state doubles as a call for contributors -->
                <section
                    aria-label="Materia sin publicaciones"
                    class="flex flex-col items-start gap-4 rounded-sm border border-dashed border-(--ui-border-accented) bg-ivory-50 px-5 py-10 md:px-10"
                >
                    <UIcon
                        name="i-lucide-feather"
                        class="size-7 text-huella-teal-500"
                    />
                    <h2 class="font-serif text-h3 text-highlighted">
                        Todavía no hay publicaciones en Derecho administrativo
                    </h2>
                    <p class="max-w-md font-serif text-base leading-relaxed text-toned">
                        Es una materia nueva en la revista. Si trabajas en ella, tu artículo puede ser el primero.
                    </p>
                    <div class="flex flex-col gap-3 sm:flex-row">
                        <UButton
                            label="Publicar en esta materia"
                            to="/lab/publicar"
                            class="justify-center"
                        />
                        <UButton
                            variant="outline"
                            color="neutral"
                            label="Ver otras materias"
                            to="/lab/categorias"
                            class="justify-center"
                        />
                    </div>
                </section>

                <!-- Server error -->
                <section
                    aria-label="Error del servidor"
                    class="flex flex-col items-start gap-4 rounded-sm border border-default px-5 py-10 md:px-10"
                >
                    <Kicker tone="muted">
                        Error 500
                    </Kicker>
                    <h2 class="font-serif text-h3 text-highlighted">
                        No hemos podido cargar esta página
                    </h2>
                    <p class="max-w-md font-serif text-base leading-relaxed text-toned">
                        El fallo es nuestro y ya está registrado. Vuelve a intentarlo en unos minutos; si continúa, escríbenos.
                    </p>
                    <div class="flex flex-col gap-3 sm:flex-row">
                        <UButton
                            icon="i-lucide-rotate-cw"
                            label="Reintentar"
                            class="justify-center"
                        />
                        <UButton
                            variant="outline"
                            color="neutral"
                            label="Contactar"
                            class="justify-center"
                        />
                    </div>
                </section>

                <!-- Loading -->
                <section
                    aria-label="Cargando publicaciones"
                    aria-busy="true"
                    class="rounded-sm border border-default px-5 py-10 md:px-10"
                >
                    <p class="sr-only">
                        Cargando publicaciones…
                    </p>
                    <ul class="flex flex-col divide-y divide-(--ui-border-muted)">
                        <li
                            v-for="n in 3"
                            :key="n"
                            class="flex gap-6 py-5 first:pt-0"
                        >
                            <div class="flex flex-1 flex-col gap-3">
                                <USkeleton class="h-3 w-28 bg-ivory-200" />
                                <USkeleton class="h-6 w-11/12 bg-ivory-200" />
                                <USkeleton class="h-6 w-3/5 bg-ivory-200" />
                                <USkeleton class="h-3 w-48 bg-ivory-200" />
                            </div>
                            <USkeleton class="hidden aspect-[4/3] w-32 bg-ivory-200 sm:block" />
                        </li>
                    </ul>
                </section>
            </div>
        </main>

        <SiteFooter />
    </div>
</template>
