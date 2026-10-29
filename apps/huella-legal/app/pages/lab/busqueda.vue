<script setup lang="ts">
import ArticleCard from "~/lab/ArticleCard.vue";
import SearchPanel from "~/lab/SearchPanel.vue";
import SiteHeader from "~/lab/SiteHeader.vue";
import VariantNotes from "~/lab/VariantNotes.vue";
import Wordmark from "~/lab/Wordmark.vue";
import { articles } from "~/lab/fixtures";

type Variant = "a" | "b" | "c" | "d";

const route = useRoute();
const variant = computed<Variant>(
    () => (["a", "b", "c", "d"] as const).find((item) => item === route.query.variante) ?? "a",
);
const query = computed(() => (route.query.texto === "1" ? "delito" : ""));

useHead({ title: "Búsqueda · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const variants: { key: Variant; label: string }[] = [
    { key: "a", label: "A · Modal" },
    { key: "b", label: "B · Barra" },
    { key: "c", label: "C · Pantalla" },
    { key: "d", label: "D · Cabecera" },
];

const link = (key: Variant, texto: boolean) =>
    `/lab/busqueda?variante=${key}${texto ? "&texto=1" : ""}`;

const notes = {
    a: {
        label: "A · Modal de búsqueda",
        changes: [
            "La lupa abre un diálogo centrado, alineado arriba; en móvil ocupa toda la pantalla.",
            "Antes de escribir: materias y lo último, para que el diálogo nunca esté vacío.",
            "Al escribir: materias que coinciden y los cinco primeros artículos, en vivo.",
            "Intro abre /buscar/?query=… con la página de resultados actual; Esc cierra y devuelve el foco a la lupa.",
            "Atajo «/» o ⌘K en escritorio.",
        ],
        sources: [
            {
                element: "Diálogo",
                source: "UModal + UCommandPalette de Nuxt UI: foco atrapado, Esc y navegación con flechas incluidos.",
            },
            { element: "Materias", source: "count de wp/v2/categories. Core." },
            {
                element: "Resultados en vivo",
                source: "getArticleIndex ya guarda todas las entradas en caché; filtrar ~100 títulos con normalizeText no llama a WordPress.",
            },
        ],
    },
    b: {
        label: "B · Barra bajo la cabecera",
        changes: [
            "La lupa despliega una franja de papel bajo la cabecera; la página sigue visible, atenuada.",
            "Campo grande en Georgia: se lee como la revista, no como una aplicación.",
            "Mismo contenido antes y después de escribir que A.",
            "Intro abre /buscar/?query=…; Esc o la X pliegan la franja.",
        ],
        sources: [
            {
                element: "Franja",
                source: "Componente propio sobre UInput dentro del #bottom de UHeader; el foco y Esc hay que hacerlos a mano.",
            },
            { element: "Resultados en vivo", source: "getArticleIndex en caché, como en A." },
        ],
    },
    c: {
        label: "C · Pantalla completa",
        changes: [
            "La lupa cubre toda la pantalla con papel: campo enorme con filete de 2 px, como un titular.",
            "Antes de escribir, el índice completo de materias con recuentos, y lo último.",
            "Es la versión más editorial y la que más espacio da a los resultados en vivo.",
            "Intro abre /buscar/?query=….",
        ],
        sources: [
            { element: "Capa", source: "UModal fullscreen de Nuxt UI." },
            { element: "Resultados en vivo", source: "getArticleIndex en caché, como en A." },
        ],
    },
    d: {
        label: "D · Campo en la cabecera",
        changes: [
            "La lupa convierte la propia cabecera en un campo; la navegación se oculta mientras se busca.",
            "Un desplegable bajo el campo muestra materias, lo último o los resultados en vivo.",
            "En móvil el campo ocupa la fila entera con «Cancelar».",
            "Intro abre /buscar/?query=….",
        ],
        sources: [
            {
                element: "Campo y desplegable",
                source: "UInput + UPopover o UCommandPalette sin modal; foco y Esc a mano, y la cabecera de UHeader no tiene ranura para sustituirla entera.",
                risk: true,
            },
            { element: "Resultados en vivo", source: "getArticleIndex en caché, como en A." },
        ],
    },
};
</script>

<template>
    <div>
        <!-- D replaces the header row; every other variant opens over the real one -->
        <header v-if="variant === 'd'" class="relative z-30 border-b border-default bg-default">
            <div class="hidden border-b border-(--ui-border-muted) md:block">
                <div
                    class="mx-auto flex h-9 max-w-site items-center px-8 font-sans text-xs text-muted lg:px-12"
                >
                    Revista jurídica de acceso libre · ISSN 2696-7618
                </div>
            </div>
            <div
                class="mx-auto flex h-16 max-w-site items-center gap-3 px-4 md:h-20 md:gap-6 md:px-8 lg:px-12"
            >
                <span class="hidden md:block"><Wordmark /></span>
                <form role="search" class="relative flex-1 md:ml-auto md:max-w-xl" @submit.prevent>
                    <UInput
                        :model-value="query"
                        icon="i-lucide-search"
                        placeholder="Buscar en la revista"
                        size="xl"
                        autofocus
                        aria-label="Buscar en Huella Legal"
                        class="w-full"
                        :ui="{
                            base: 'ring-2 ring-primary [&::-webkit-search-cancel-button]:hidden',
                        }"
                    />
                    <div
                        class="fixed inset-x-0 top-16 bottom-0 md:absolute md:top-full md:bottom-auto md:mt-3 md:max-h-[calc(100dvh-8rem)] overflow-y-auto border-y border-default bg-ivory-50 p-5 shadow-xl md:inset-x-0 md:rounded-sm md:border-x"
                    >
                        <SearchPanel :query />
                    </div>
                </form>
                <UButton variant="ghost" color="neutral" label="Cancelar" class="md:hidden" />
                <UButton
                    square
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-x"
                    aria-label="Cerrar búsqueda"
                    class="hidden md:inline-flex"
                />
            </div>
        </header>
        <SiteHeader v-else />

        <!-- B: the band drops below the header, in flow -->
        <div
            v-if="variant === 'b'"
            class="relative z-20 border-b border-default bg-ivory-50 shadow-lg"
        >
            <div class="mx-auto max-w-site px-4 py-6 md:px-8 md:py-8 lg:px-12">
                <form
                    role="search"
                    class="flex items-center gap-3 border-b-2 border-huella-slate-900 pb-2"
                    @submit.prevent
                >
                    <UIcon name="i-lucide-search" class="size-6 shrink-0 text-muted" />
                    <input
                        :value="query"
                        type="search"
                        autofocus
                        aria-label="Buscar en Huella Legal"
                        placeholder="¿Qué quieres leer?"
                        class="min-h-12 w-full bg-transparent font-serif text-2xl text-highlighted outline-none placeholder:text-dimmed [&::-webkit-search-cancel-button]:hidden md:text-3xl"
                    />
                    <UButton
                        square
                        variant="ghost"
                        color="neutral"
                        icon="i-lucide-x"
                        aria-label="Cerrar búsqueda"
                    />
                </form>
                <div class="mt-6 max-w-3xl">
                    <SearchPanel :query />
                </div>
            </div>
        </div>

        <div class="relative">
            <div
                v-if="variant === 'b' || variant === 'd'"
                class="absolute inset-0 z-10 bg-huella-ink-900/40"
                aria-hidden="true"
            />
            <main class="mx-auto flex min-h-dvh max-w-site flex-col px-4 md:px-8 lg:px-12">
                <div class="border-b border-default pt-10 pb-8 md:pt-14">
                    <h1
                        class="max-w-3xl font-serif text-[2.125rem] leading-[1.08] tracking-[-0.02em] text-highlighted text-balance md:text-[3rem] lg:text-[3.5rem]"
                    >
                        Derecho riguroso, escrito para ser <em class="text-primary">leído</em>.
                    </h1>
                </div>
                <div class="grid gap-10 py-10 md:grid-cols-3">
                    <ArticleCard
                        v-for="article in articles.slice(0, 3)"
                        :key="article.slug"
                        :article
                    />
                </div>
            </main>
        </div>

        <!-- A: centered dialog, full screen below sm -->
        <div v-if="variant === 'a'" class="fixed inset-0 z-40 bg-huella-ink-900/50 sm:pt-[10vh]">
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Buscar en Huella Legal"
                class="mx-auto flex h-dvh w-full flex-col bg-ivory-50 sm:h-auto sm:max-h-[78vh] sm:max-w-2xl sm:rounded-sm sm:shadow-2xl sm:ring sm:ring-default"
            >
                <form
                    role="search"
                    class="flex items-center gap-3 border-b border-default px-4 sm:px-5"
                    @submit.prevent
                >
                    <UIcon name="i-lucide-search" class="size-5 shrink-0 text-muted" />
                    <input
                        :value="query"
                        type="search"
                        autofocus
                        aria-label="Buscar en Huella Legal"
                        placeholder="Buscar en la revista"
                        class="min-h-16 w-full bg-transparent font-serif text-xl text-highlighted outline-none placeholder:text-dimmed [&::-webkit-search-cancel-button]:hidden"
                    />
                    <UKbd value="Esc" class="hidden sm:inline-flex" />
                    <UButton variant="ghost" color="neutral" label="Cancelar" class="sm:hidden" />
                </form>
                <div class="overflow-y-auto p-4 sm:p-5">
                    <SearchPanel :query />
                </div>
                <div
                    class="hidden items-center gap-4 border-t border-default px-5 py-2.5 font-sans text-xs text-muted sm:flex"
                >
                    <span class="flex items-center gap-1"
                        ><UKbd value="arrowup" /><UKbd value="arrowdown" /> moverse</span
                    >
                    <span class="flex items-center gap-1"
                        ><UKbd value="enter" /> ver todos los resultados</span
                    >
                    <span class="ml-auto flex items-center gap-1"
                        ><UKbd value="/" /> abre la búsqueda</span
                    >
                </div>
            </div>
        </div>

        <!-- C: full-screen paper -->
        <div v-if="variant === 'c'" class="fixed inset-0 z-40 overflow-y-auto bg-default">
            <div
                class="mx-auto flex h-16 max-w-site items-center justify-between px-4 md:h-20 md:px-8 lg:px-12"
            >
                <Wordmark />
                <UButton variant="ghost" color="neutral" icon="i-lucide-x" label="Cerrar" />
            </div>
            <div class="mx-auto max-w-4xl px-4 pt-6 pb-16 md:px-8 md:pt-16">
                <form role="search" @submit.prevent>
                    <label
                        for="c-search"
                        class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-secondary"
                    >
                        Buscar en Huella Legal
                    </label>
                    <div
                        class="mt-3 flex items-center gap-3 border-b-2 border-huella-slate-900 pb-3"
                    >
                        <input
                            id="c-search"
                            :value="query"
                            type="search"
                            autofocus
                            placeholder="¿Qué quieres leer?"
                            class="w-full bg-transparent font-serif text-[2.25rem] leading-tight tracking-[-0.02em] text-highlighted outline-none placeholder:text-dimmed [&::-webkit-search-cancel-button]:hidden md:text-[3.5rem]"
                        />
                        <UButton
                            type="submit"
                            square
                            icon="i-lucide-arrow-right"
                            size="xl"
                            aria-label="Ver resultados"
                        />
                    </div>
                </form>
                <div class="mt-10">
                    <SearchPanel :query size="large" />
                </div>
            </div>
        </div>

        <!-- Review aid: switch variant and state -->
        <nav
            aria-label="Variantes de búsqueda"
            class="fixed bottom-16 left-3 z-50 sm:bottom-3 flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center gap-1 rounded-sm bg-huella-slate-900 p-1.5 font-sans text-xs text-ivory-50 shadow-xl"
        >
            <a
                v-for="item in variants"
                :key="item.key"
                :href="link(item.key, !!query)"
                class="rounded-xs px-2 py-1.5 font-semibold"
                :class="
                    item.key === variant
                        ? 'bg-ivory-50 text-huella-slate-900'
                        : 'hover:bg-huella-slate-700'
                "
                >{{ item.label }}</a
            >
            <span class="mx-1 h-4 w-px bg-huella-slate-600" />
            <a
                :href="link(variant, !query)"
                class="rounded-xs px-2 py-1.5 font-semibold underline underline-offset-2"
                >{{ query ? "Ver vacío" : "Ver escribiendo" }}</a
            >
        </nav>

        <VariantNotes v-bind="notes[variant]" />
    </div>
</template>
