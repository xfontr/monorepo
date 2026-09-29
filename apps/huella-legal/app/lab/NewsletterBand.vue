<script setup lang="ts">
withDefaults(defineProps<{ tone?: "paper" | "slate" }>(), { tone: "paper" });
</script>

<template>
    <section
        id="newsletter"
        aria-labelledby="newsletter-title"
        :class="tone === 'slate' ? 'bg-huella-slate-800 text-huella-slate-200' : 'bg-ivory-200'"
    >
        <div class="mx-auto grid max-w-site gap-8 px-4 py-14 md:px-8 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-12 lg:py-16">
            <div class="lg:col-span-6">
                <p
                    class="font-sans text-xs font-semibold uppercase tracking-[0.12em]"
                    :class="tone === 'slate' ? 'text-huella-teal-200' : 'text-secondary'"
                >
                    Boletín mensual
                </p>
                <h2
                    id="newsletter-title"
                    class="mt-2 font-serif text-[1.75rem] leading-tight md:text-h2"
                    :class="tone === 'slate' ? 'text-ivory-50' : 'text-highlighted'"
                >
                    Un correo al mes con lo que hemos publicado. Nada más.
                </h2>
            </div>

            <form
                class="flex flex-col gap-3 lg:col-span-6"
                @submit.prevent
            >
                <div class="flex flex-col gap-3 sm:flex-row">
                    <UFormField
                        label="Correo electrónico"
                        class="flex-1"
                        :ui="{ label: tone === 'slate' ? 'text-huella-slate-200' : undefined }"
                    >
                        <UInput
                            type="email"
                            placeholder="nombre@ejemplo.es"
                            autocomplete="email"
                            class="w-full"
                        />
                    </UFormField>
                    <UButton
                        type="submit"
                        label="Suscribirme"
                        class="justify-center sm:self-end"
                        :color="tone === 'slate' ? 'secondary' : 'primary'"
                    />
                </div>
                <p
                    class="font-sans text-meta"
                    :class="tone === 'slate' ? 'text-huella-slate-300' : 'text-muted'"
                >
                    Puedes darte de baja desde cualquier correo. Tratamos tu dirección según la
                    <a
                        href="#"
                        data-inline
                        class="underline underline-offset-2"
                    >política de privacidad</a>.
                </p>
            </form>
        </div>
    </section>
</template>
