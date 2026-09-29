<script setup lang="ts">
import { issn } from "./fixtures";
import Wordmark from "./Wordmark.vue";

const groups = [
    { title: "Revista", links: ["Publicaciones", "Materias", "Colaboradores", "Sobre Huella Legal"] },
    { title: "Participa", links: ["Publicar un artículo", "Publicar un TFG o TFM", "Boletín mensual", "Contacto"] },
    { title: "Legal", links: ["Aviso legal", "Política de privacidad", "Política de cookies"] },
];

const social = [
    { icon: "i-lucide-instagram", label: "Instagram" },
    { icon: "i-lucide-linkedin", label: "LinkedIn" },
    { icon: "i-lucide-twitter", label: "X (Twitter)" },
];
</script>

<template>
    <footer class="bg-huella-slate-900 text-huella-slate-200">
        <div class="mx-auto grid max-w-site gap-12 px-4 py-16 md:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:py-20">
            <div class="flex flex-col gap-5 lg:col-span-4">
                <Wordmark
                    tone="paper"
                    tagline
                />
                <p class="max-w-xs font-serif text-base leading-relaxed text-huella-slate-200">
                    Divulgación jurídica rigurosa y de acceso libre, escrita por profesionales, docentes y estudiantes de todo el ámbito hispanohablante.
                </p>
            </div>

            <nav
                aria-label="Pie de página"
                class="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6"
            >
                <div
                    v-for="group in groups"
                    :key="group.title"
                >
                    <p class="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-huella-teal-300">
                        {{ group.title }}
                    </p>
                    <ul class="mt-3 flex flex-col">
                        <li
                            v-for="link in group.links"
                            :key="link"
                        >
                            <a
                                href="#"
                                class="inline-flex min-h-11 items-center font-sans text-sm text-ivory-100 underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory-50"
                            >{{ link }}</a>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>

        <div class="border-t border-huella-slate-700">
            <div class="mx-auto flex max-w-site flex-col-reverse gap-4 px-4 py-6 font-sans text-xs text-huella-slate-300 md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
                <p>© 2026 Huella Legal · {{ issn }}</p>
                <ul class="-ml-3 flex items-center gap-1 md:ml-0 md:-mr-3">
                    <li
                        v-for="item in social"
                        :key="item.label"
                    >
                        <a
                            href="#"
                            :aria-label="item.label"
                            class="flex size-11 items-center justify-center rounded-full text-huella-slate-200 transition-colors hover:bg-huella-slate-800 hover:text-ivory-50 focus-visible:outline-2 focus-visible:outline-ivory-50"
                        >
                            <UIcon
                                :name="item.icon"
                                class="size-5"
                            />
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </footer>
</template>
