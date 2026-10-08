<script setup lang="ts">
interface Props {
    label: string
    compare?: string
    changes: string[]
    sources: { element: string, source: string, risk?: boolean }[]
}

// Review aid, not design: a collapsed badge so screenshots of the page itself stay clean
defineProps<Props>();

const route = useRoute();
const open = ref(route.query.notas === "1");
</script>

<template>
    <aside
        aria-label="Notas de la variante"
        class="fixed right-3 bottom-3 z-50 flex max-h-[calc(100dvh-1.5rem)] w-[min(26rem,calc(100vw-1.5rem))] flex-col items-end gap-2 font-sans"
    >
        <div
            v-if="open"
            class="w-full overflow-y-auto rounded-sm border border-huella-slate-700 bg-huella-slate-900 p-5 text-sm text-huella-slate-200 shadow-xl"
        >
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-huella-teal-300">
                {{ label }}
            </p>
            <a
                v-if="compare"
                :href="compare"
                class="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold text-ivory-50 underline underline-offset-4"
            >Comparar con la versión aprobada <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
            /></a>

            <p class="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-huella-slate-300">
                Qué cambia
            </p>
            <ul class="mt-2 flex list-disc flex-col gap-1.5 pl-4 marker:text-huella-teal-400">
                <li
                    v-for="item in changes"
                    :key="item"
                >
                    {{ item }}
                </li>
            </ul>

            <p class="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-huella-slate-300">
                De dónde salen los datos
            </p>
            <dl class="mt-2 flex flex-col divide-y divide-huella-slate-700">
                <div
                    v-for="item in sources"
                    :key="item.element"
                    class="py-2"
                >
                    <dt class="font-semibold text-ivory-50">
                        {{ item.element }}
                        <span
                            v-if="item.risk"
                            class="ml-1 rounded-xs bg-huella-danger-600 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-ivory-50"
                        >no está en WP</span>
                    </dt>
                    <dd class="mt-0.5 text-huella-slate-300">
                        {{ item.source }}
                    </dd>
                </div>
            </dl>
        </div>

        <button
            type="button"
            :aria-expanded="open"
            class="inline-flex min-h-11 items-center gap-2 rounded-full bg-huella-slate-900 px-4 text-sm font-semibold text-ivory-50 shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="open = !open"
        >
            <UIcon
                :name="open ? 'i-lucide-x' : 'i-lucide-flask-conical'"
                class="size-4"
            />
            {{ open ? "Cerrar notas" : label }}
        </button>
    </aside>
</template>
