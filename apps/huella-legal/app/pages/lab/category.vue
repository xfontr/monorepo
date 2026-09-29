<script setup lang="ts">
import ArticleCard from "~/lab/ArticleCard.vue";
import Kicker from "~/lab/Kicker.vue";
import NewsletterBand from "~/lab/NewsletterBand.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import { articles, authors, categories, tags } from "~/lab/fixtures";

// `?autor=1` swaps the category intro for a contributor profile: the same listing serves both
const route = useRoute();
const isAuthor = computed(() => route.query.autor === "1");
const author = authors.raquel;
const category = categories[0]!;

useHead({ title: "Derecho penal · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const listing = [articles[4]!, articles[6]!, articles[2]!, articles[0]!, articles[3]!, articles[1]!, articles[5]!];
const page = ref(1);
const sort = ref("Más recientes");

const subtags = tags.slice(0, 4);
</script>

<template>
    <div>
        <SiteHeader :current="isAuthor ? 'Colaboradores' : 'Publicaciones'" />

        <main>
            <!-- Intro: category or contributor -->
            <section class="border-b border-default">
                <div class="mx-auto max-w-site px-4 pt-6 pb-10 md:px-8 md:pt-10 md:pb-14 lg:px-12">
                    <UBreadcrumb
                        :items="isAuthor
                            ? [{ label: 'Portada', to: '/lab/home' }, { label: 'Colaboradores', to: '/lab/colaboradores' }, { label: author.name }]
                            : [{ label: 'Portada', to: '/lab/home' }, { label: 'Publicaciones', to: '/lab/category' }, { label: category.name }]"
                        :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                    />

                    <div
                        v-if="!isAuthor"
                        class="mt-6 grid gap-6 md:mt-8 lg:grid-cols-12 lg:items-end lg:gap-12"
                    >
                        <div class="lg:col-span-8">
                            <Kicker>Materia</Kicker>
                            <h1 class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted md:text-[3.5rem]">
                                {{ category.name }}
                            </h1>
                            <p class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned">
                                {{ category.description }}
                            </p>
                        </div>
                        <p class="font-sans text-meta text-muted lg:col-span-4 lg:pb-2 lg:text-right">
                            <span class="block font-serif text-[2rem] leading-none text-highlighted tabular-nums">{{ category.count }}</span>
                            publicaciones
                        </p>
                    </div>

                    <div
                        v-else
                        class="mt-6 grid gap-6 md:mt-8 md:grid-cols-[6rem_1fr] md:gap-8 lg:grid-cols-[7rem_1fr_16rem]"
                    >
                        <span
                            class="flex size-20 items-center justify-center rounded-full bg-huella-slate-100 font-sans text-lg font-semibold text-primary md:size-24 lg:size-28"
                            aria-hidden="true"
                        >{{ author.initials }}</span>
                        <div>
                            <Kicker>Colaboradora</Kicker>
                            <h1 class="mt-2 font-serif text-[2.375rem] leading-[1.08] tracking-[-0.02em] text-highlighted md:text-[3rem]">
                                {{ author.name }}
                            </h1>
                            <p class="mt-1 font-sans text-sm font-medium text-muted">
                                {{ author.role }}
                            </p>
                            <p class="mt-4 max-w-measure font-serif text-[1.125rem] leading-relaxed text-toned">
                                {{ author.bio }}
                            </p>
                            <div class="-ml-3 mt-3 flex flex-wrap gap-1">
                                <UButton
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-linkedin"
                                    label="LinkedIn"
                                />
                                <UButton
                                    variant="ghost"
                                    color="neutral"
                                    icon="i-lucide-globe"
                                    label="Web personal"
                                />
                            </div>
                        </div>
                        <dl class="grid grid-cols-2 self-end border-t border-default md:col-span-2 lg:col-span-1 lg:grid-cols-1">
                            <div class="flex flex-col-reverse gap-1 border-b border-default py-4">
                                <dt class="font-sans text-meta text-muted">
                                    publicaciones
                                </dt>
                                <dd class="font-serif text-[2rem] leading-none text-highlighted tabular-nums">
                                    {{ author.articles }}
                                </dd>
                            </div>
                            <div class="flex flex-col-reverse gap-1 border-b border-default py-4 pl-5 lg:pl-0">
                                <dt class="font-sans text-meta text-muted">
                                    colaboradora desde
                                </dt>
                                <dd class="font-serif text-[2rem] leading-none text-highlighted tabular-nums">
                                    2022
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </section>

            <div class="mx-auto grid max-w-site grid-cols-1 gap-12 px-4 py-10 md:px-8 md:py-12 lg:grid-cols-12 lg:gap-x-12 lg:px-12">
                <section
                    aria-label="Publicaciones"
                    class="min-w-0 lg:col-span-8"
                >
                    <!-- Toolbar: sub-topics and order -->
                    <div class="flex flex-col gap-4 border-b-2 border-huella-slate-900 pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <ul
                            v-if="!isAuthor"
                            aria-label="Temas"
                            class="-mb-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap"
                        >
                            <li>
                                <a
                                    href="#"
                                    aria-current="page"
                                    class="inline-flex min-h-11 shrink-0 items-center rounded-full bg-primary px-4 font-sans text-sm font-medium whitespace-nowrap text-ivory-50"
                                >Todo</a>
                            </li>
                            <li
                                v-for="[name, count] in subtags"
                                :key="name"
                            >
                                <a
                                    href="#"
                                    class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-default px-4 font-sans text-sm font-medium whitespace-nowrap text-toned hover:bg-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >{{ name }} <span class="text-xs tabular-nums text-dimmed">{{ count }}</span></a>
                            </li>
                        </ul>
                        <h2
                            v-else
                            class="font-serif text-h3 text-highlighted"
                        >
                            Publicaciones de {{ author.name.split(" ")[0] }}
                        </h2>
                        <UFormField
                            label="Ordenar"
                            orientation="horizontal"
                            class="shrink-0"
                            :ui="{ label: 'font-sans text-meta text-muted', container: 'mt-0' }"
                        >
                            <USelect
                                v-model="sort"
                                :items="['Más recientes', 'Más antiguas', 'Más leídas']"
                                class="w-44"
                            />
                        </UFormField>
                    </div>

                    <ol class="flex flex-col divide-y divide-(--ui-border-muted)">
                        <li
                            v-for="article in (isAuthor ? listing.slice(0, 4) : listing)"
                            :key="article.slug"
                            class="py-8"
                        >
                            <ArticleCard
                                :article="isAuthor ? { ...article, authors: [author] } : { ...article, category: category.name }"
                                variant="row"
                            />
                        </li>
                    </ol>

                    <nav
                        v-if="!isAuthor"
                        aria-label="Paginación"
                        class="flex flex-col items-center gap-3 border-t border-default pt-8 sm:flex-row sm:justify-between"
                    >
                        <p class="hidden font-sans text-meta whitespace-nowrap text-muted sm:block">
                            Página {{ page }} de 7
                        </p>
                        <!-- Phones get previous/next only; the numbered pager needs about 440 px -->
                        <div class="flex w-full items-center justify-between gap-2 sm:hidden">
                            <UButton
                                variant="outline"
                                color="neutral"
                                icon="i-lucide-arrow-left"
                                label="Anterior"
                                disabled
                            />
                            <span class="font-sans text-meta tabular-nums text-muted">1 / 7</span>
                            <UButton
                                variant="outline"
                                color="neutral"
                                trailing-icon="i-lucide-arrow-right"
                                label="Siguiente"
                            />
                        </div>
                        <UPagination
                            v-model:page="page"
                            class="hidden sm:block"
                            :total="48"
                            :items-per-page="7"
                            :sibling-count="1"
                            show-edges
                            size="xl"
                            color="neutral"
                            variant="ghost"
                            active-color="primary"
                            active-variant="solid"
                            :ui="{ item: 'min-w-11 min-h-11 justify-center', first: 'min-h-11 min-w-11', last: 'min-h-11 min-w-11', prev: 'min-h-11 min-w-11', next: 'min-h-11 min-w-11' }"
                        />
                    </nav>
                </section>

                <aside
                    aria-label="Explorar"
                    class="flex flex-col gap-10 lg:col-span-4"
                >
                    <div class="border-t-2 border-huella-slate-900 pt-4">
                        <h2 class="font-serif text-xl text-highlighted">
                            {{ isAuthor ? 'Escribe sobre' : 'Otras materias' }}
                        </h2>
                        <ul class="mt-3 flex flex-col">
                            <li
                                v-for="item in (isAuthor ? [categories[0]!, categories[1]!] : categories.slice(1))"
                                :key="item.slug"
                                class="border-b border-(--ui-border-muted)"
                            >
                                <a
                                    href="/lab/category"
                                    class="group flex min-h-11 items-center justify-between gap-3 py-1 font-serif text-base text-highlighted focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary"
                                >
                                    <span class="decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline">{{ item.name }}</span>
                                    <span class="font-sans text-meta tabular-nums text-muted">{{ item.count }}</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div
                        v-if="!isAuthor"
                        class="rounded-sm border border-default bg-ivory-50 p-5"
                    >
                        <p class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                            Boletín mensual
                        </p>
                        <p class="mt-2 font-serif text-lg leading-snug text-highlighted">
                            {{ isAuthor ? `Recibe sus próximos artículos, y los del resto de colaboradores, una vez al mes.` : `Lo nuevo en ${category.name.toLowerCase()} y el resto de materias, una vez al mes.` }}
                        </p>
                        <form
                            class="mt-4 flex flex-col gap-3"
                            @submit.prevent
                        >
                            <UFormField label="Correo electrónico">
                                <UInput
                                    type="email"
                                    placeholder="nombre@ejemplo.es"
                                    class="w-full"
                                />
                            </UFormField>
                            <UButton
                                type="submit"
                                block
                                label="Suscribirme"
                            />
                        </form>
                    </div>
                </aside>
            </div>

            <NewsletterBand v-if="isAuthor" />
        </main>

        <SiteFooter />
    </div>
</template>
