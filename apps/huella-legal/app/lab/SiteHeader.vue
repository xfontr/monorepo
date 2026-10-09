<script setup lang="ts">
import { issn, nav as defaultNav } from "./fixtures";
import { useLabHref } from "./variant";
import Wordmark from "./Wordmark.vue";

interface Props {
    current?: string;
    menuOpen?: boolean;
    nav?: { label: string; to: string }[];
}

const props = withDefaults(defineProps<Props>(), {
    menuOpen: false,
    nav: () => defaultNav,
});

const href = useLabHref();

const open = ref(props.menuOpen);
</script>

<template>
    <header class="border-b border-default">
        <!-- Journal strip: what this is, before what it contains -->
        <div class="hidden border-b border-(--ui-border-muted) md:block">
            <div
                class="mx-auto flex h-9 max-w-site items-center justify-between px-8 font-sans text-xs text-muted lg:px-12"
            >
                <span>Revista jurídica de acceso libre · {{ issn }}</span>
                <a
                    href="#newsletter"
                    class="relative inline-flex h-9 items-center gap-1.5 font-semibold text-primary after:absolute after:inset-x-0 after:top-0 after:-bottom-2 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    <UIcon name="i-lucide-mail" class="size-3.5" />
                    Un correo al mes con lo nuevo
                </a>
            </div>
        </div>

        <div
            class="mx-auto flex h-16 max-w-site items-center justify-between gap-6 px-4 md:h-20 md:px-8 lg:px-12"
        >
            <a
                :href="href('/lab/home')"
                aria-label="Huella Legal, portada"
                class="flex min-h-11 items-center focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
                <Wordmark />
            </a>

            <nav aria-label="Principal" class="hidden lg:block">
                <ul class="flex items-center gap-1">
                    <li v-for="item in nav" :key="item.label">
                        <a
                            :href="href(item.to)"
                            :aria-current="item.label === current ? 'page' : undefined"
                            class="relative inline-flex min-h-11 items-center px-3 font-sans text-sm font-semibold text-toned transition-colors hover:text-highlighted focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary aria-[current=page]:text-highlighted aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:-bottom-[1.1875rem] aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-primary"
                            >{{ item.label }}</a
                        >
                    </li>
                </ul>
            </nav>

            <div class="flex items-center gap-1 md:gap-2">
                <UButton
                    square
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-search"
                    aria-label="Buscar"
                />
                <UButton label="Suscribirse" class="hidden md:inline-flex" to="#newsletter" />
                <UButton
                    square
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-menu"
                    aria-label="Abrir menú"
                    class="lg:hidden"
                    @click="open = true"
                />
            </div>
        </div>

        <USlideover
            v-model:open="open"
            side="right"
            title="Menú"
            :ui="{
                content: 'bg-ivory-50 max-w-sm',
                header: 'border-b border-default min-h-16 px-4',
                body: 'p-0',
            }"
        >
            <template #header>
                <Wordmark size="sm" />
                <UButton
                    square
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-x"
                    aria-label="Cerrar menú"
                    class="ml-auto"
                    @click="open = false"
                />
            </template>
            <template #body>
                <nav aria-label="Principal">
                    <ul class="divide-y divide-(--ui-border-muted) border-b border-default">
                        <li v-for="item in nav" :key="item.label">
                            <a
                                :href="href(item.to)"
                                :aria-current="item.label === current ? 'page' : undefined"
                                class="flex min-h-14 items-center justify-between px-4 font-serif text-xl text-highlighted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-[current=page]:text-primary"
                            >
                                {{ item.label }}
                                <UIcon name="i-lucide-chevron-right" class="size-5 text-dimmed" />
                            </a>
                        </li>
                    </ul>
                </nav>
                <div class="flex flex-col gap-3 p-4">
                    <UButton block label="Suscribirse al boletín" to="#newsletter" />
                    <UButton
                        block
                        variant="outline"
                        color="neutral"
                        label="Publicar un artículo"
                        :to="href('/lab/publicar')"
                    />
                    <p class="pt-2 font-sans text-xs text-muted">
                        Revista jurídica de acceso libre · {{ issn }}
                    </p>
                </div>
            </template>
        </USlideover>
    </header>
</template>
