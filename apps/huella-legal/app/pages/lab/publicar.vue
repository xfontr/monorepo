<script setup lang="ts">
import Kicker from "~/lab/Kicker.vue";
import SiteFooter from "~/lab/SiteFooter.vue";
import SiteHeader from "~/lab/SiteHeader.vue";

// `?estado=` previews each submission state: invalid, submitting, success, error
const route = useRoute();
const state = computed(() => String(route.query.estado ?? "default"));

useHead({ title: "Publicar · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const reasons = [
    { icon: "i-lucide-eye", title: "Hazte ver", body: "Demuestra tu capacidad de análisis ante más de 6.000 lectores en redes. Cada artículo se difunde varias veces." },
    { icon: "i-lucide-scale", title: "Revisión editorial", body: "Valoramos claridad, fuentes y originalidad. Si hace falta, te proponemos cambios concretos antes de publicar." },
    { icon: "i-lucide-badge-check", title: "Gratis, siempre", body: "Publicar no cuesta nada. Tu artículo lleva tu firma, tu biografía y un enlace a tu perfil profesional." },
];

const steps = [
    { title: "Envía un resumen", body: "Rellena el formulario con el tema, la tesis y tu archivo." },
    { title: "Primera lectura", body: "Confirmamos la recepción en 24–72 horas." },
    { title: "Evaluación", body: "Revisamos claridad, fuentes y originalidad." },
    { title: "Decisión", body: "En un máximo de cinco días: aceptado, aceptado con cambios o no aceptado, siempre razonado." },
    { title: "Publicación", body: "Con tu biografía y foto, si quieres, y difusión en redes." },
];

const faq = ([
    { label: "¿Qué extensión debe tener el artículo?", content: "Un mínimo de 5.000 caracteres, unas 1.000 palabras. No hay extensión máxima." },
    { label: "¿Sobre qué temas puedo escribir?", content: "Cualquier cuestión jurídica, de cualquier rama del Derecho. Los textos deben ser originales e inéditos." },
    { label: "¿En qué formato lo envío?", content: "Preferimos .docx, .doc, .pages o .rtf." },
    { label: "¿Puedo modificar o retirar el artículo después?", content: "Sí. Escríbenos y lo actualizamos o lo retiramos; el artículo sigue siendo tuyo." },
    { label: "¿Puedo incluir publicidad en mi biografía?", content: "No más allá de una breve reseña profesional y enlaces de contacto." },
]).map((item, index) => ({ ...item, value: `faq-${index}` }));

const form = reactive({ name: "", email: "", kind: "Artículo", title: "", summary: "", consent: false });

if (state.value !== "default") {
    Object.assign(form, {
        name: "María-José Fernández Ruiz",
        email: state.value === "invalid" ? "mjfernandez@" : "mjfernandez@ucm.es",
        kind: "Artículo",
        title: "La responsabilidad de las plataformas digitales ante decisiones automatizadas",
        summary: state.value === "invalid" ? "" : "Analizo el artículo 22 del RGPD y la Ley de Servicios Digitales para determinar quién responde cuando una decisión automatizada vulnera derechos fundamentales.",
        consent: state.value !== "invalid",
    });
}

const states = [
    { key: "default", label: "Vacío" },
    { key: "invalid", label: "Con errores" },
    { key: "submitting", label: "Enviando" },
    { key: "success", label: "Enviado" },
    { key: "error", label: "Fallo del servidor" },
];
</script>

<template>
    <div>
        <SiteHeader current="Publicar" />

        <main>
            <section class="border-b border-default">
                <div class="mx-auto grid max-w-site grid-cols-1 gap-x-12 gap-y-6 px-4 pt-6 pb-10 md:gap-y-8 md:px-8 md:pt-10 lg:grid-cols-12 lg:px-12 lg:pb-12">
                    <div class="lg:col-span-12">
                        <UBreadcrumb
                            :items="[{ label: 'Portada', to: '/lab/home' }, { label: 'Publicar' }]"
                            :ui="{ link: 'font-sans text-meta min-h-11 inline-flex items-center', separatorIcon: 'size-4' }"
                        />
                    </div>
                    <div class="lg:col-span-7">
                        <Kicker>Publicar en Huella Legal</Kicker>
                        <h1 class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-highlighted text-balance md:text-[3.5rem]">
                            Tu artículo, leído con la atención que merece.
                        </h1>
                        <p class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned text-pretty">
                            Publicamos trabajos jurídicos rigurosos de cualquier rama del Derecho. Gratis, con revisión editorial y una decisión razonada en cinco días como máximo.
                        </p>
                        <div class="mt-7 flex flex-col gap-3 sm:flex-row">
                            <UButton
                                label="Enviar un artículo"
                                to="#formulario"
                                class="justify-center"
                            />
                            <UButton
                                variant="outline"
                                color="neutral"
                                label="Publicar un TFG o TFM"
                                to="#tfg"
                                class="justify-center"
                            />
                        </div>
                    </div>
                    <ul class="flex flex-col divide-y divide-(--ui-border-muted) mt-6 self-end border-t border-default md:mt-4 lg:col-span-5 lg:mt-0">
                        <li
                            v-for="item in reasons"
                            :key="item.title"
                            class="grid grid-cols-[2.75rem_1fr] gap-4 py-5"
                        >
                            <span class="flex size-11 items-center justify-center rounded-full bg-huella-teal-100 text-huella-teal-700">
                                <UIcon
                                    :name="item.icon"
                                    class="size-5"
                                />
                            </span>
                            <span>
                                <span class="block font-serif text-xl text-highlighted">{{ item.title }}</span>
                                <span class="mt-1 block font-serif text-base leading-relaxed text-toned">{{ item.body }}</span>
                            </span>
                        </li>
                    </ul>
                </div>
            </section>

            <!-- Process -->
            <section
                aria-labelledby="proceso"
                class="mx-auto max-w-site px-4 py-16 md:px-8 lg:px-12 lg:py-20"
            >
                <div class="border-t-2 border-huella-slate-900 pt-4">
                    <h2
                        id="proceso"
                        class="border-t-2 border-huella-slate-900 pt-4 font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                    >
                        Cómo funciona
                    </h2>
                </div>
                <ol class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
                    <li
                        v-for="(step, index) in steps"
                        :key="step.title"
                        class="relative grid grid-cols-[2.75rem_1fr] gap-4 lg:flex lg:flex-col lg:gap-4 lg:pr-6"
                    >
                        <span
                            class="relative z-10 flex size-11 items-center justify-center rounded-full font-sans text-sm font-semibold tabular-nums"
                            :class="index === steps.length - 1 ? 'bg-primary text-ivory-50' : 'bg-ivory-100 text-primary ring-1 ring-(--ui-border-accented)'"
                        >{{ index + 1 }}</span>
                        <span
                            v-if="index < steps.length - 1"
                            class="absolute top-[1.375rem] left-11 hidden h-px w-[calc(100%-2.75rem)] bg-(--ui-border-accented) lg:block"
                            aria-hidden="true"
                        />
                        <span>
                            <span class="block font-serif text-xl text-highlighted">{{ step.title }}</span>
                            <span class="mt-1 block font-serif text-base leading-relaxed text-toned">{{ step.body }}</span>
                        </span>
                    </li>
                </ol>
            </section>

            <!-- Form + FAQ -->
            <section
                id="formulario"
                aria-labelledby="formulario-titulo"
                class="border-y border-default bg-ivory-50"
            >
                <div class="mx-auto grid max-w-site grid-cols-1 gap-12 px-4 py-16 md:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-20">
                    <div class="lg:col-span-7">
                        <h2
                            id="formulario-titulo"
                            class="font-serif text-[1.75rem] leading-tight text-highlighted md:text-h2"
                        >
                            Envía tu propuesta
                        </h2>

                        <!-- Lab-only state switcher -->
                        <p class="mt-3 flex flex-wrap items-center gap-2 font-sans text-xs text-muted">
                            <span class="rounded-full bg-huella-ink-900 px-2 py-0.5 font-semibold text-white">Laboratorio</span>
                            <a
                                v-for="item in states"
                                :key="item.key"
                                :href="`/lab/publicar?estado=${item.key}#formulario`"
                                class="rounded-full px-2 py-0.5"
                                :class="state === item.key ? 'bg-huella-ink-200 font-semibold text-huella-ink-900' : 'underline underline-offset-2'"
                            >{{ item.label }}</a>
                        </p>

                        <div
                            v-if="state === 'success'"
                            role="status"
                            class="mt-8 flex flex-col items-start gap-4 rounded-sm border border-huella-teal-200 bg-huella-teal-50 p-6 md:p-8"
                        >
                            <span class="flex size-11 items-center justify-center rounded-full bg-huella-teal-600 text-white">
                                <UIcon
                                    name="i-lucide-check"
                                    class="size-5"
                                />
                            </span>
                            <h3 class="font-serif text-h3 text-highlighted">
                                Recibido. Gracias, María-José.
                            </h3>
                            <p class="max-w-measure font-serif text-base leading-relaxed text-toned">
                                Te confirmaremos la recepción en 24–72 horas en <strong class="text-highlighted">mjfernandez@ucm.es</strong>, y tendrás una decisión razonada en cinco días como máximo.
                            </p>
                            <UButton
                                variant="link"
                                label="Enviar otra propuesta"
                                class="-ml-3"
                                to="/lab/publicar#formulario"
                            />
                        </div>

                        <form
                            v-else
                            class="mt-8 grid gap-6 md:grid-cols-2"
                            novalidate
                            :aria-busy="state === 'submitting'"
                            @submit.prevent
                        >
                            <div
                                v-if="state === 'invalid'"
                                role="alert"
                                class="flex gap-3 rounded-sm border border-huella-danger-500 bg-huella-danger-50 p-4 md:col-span-2"
                            >
                                <UIcon
                                    name="i-lucide-circle-alert"
                                    class="mt-0.5 size-5 shrink-0 text-error"
                                />
                                <div class="font-sans text-sm text-huella-danger-800">
                                    <p class="font-semibold">
                                        Revisa dos campos antes de enviar
                                    </p>
                                    <ul class="mt-1 list-disc pl-5">
                                        <li>
<a
                                            href="#email"
                                            class="underline"
                                        >Correo electrónico</a>: falta el dominio.
</li>
                                        <li>
<a
                                            href="#resumen"
                                            class="underline"
                                        >Resumen</a>: es obligatorio.
</li>
                                    </ul>
                                </div>
                            </div>

                            <div
                                v-if="state === 'error'"
                                role="alert"
                                class="flex gap-3 rounded-sm border border-huella-danger-500 bg-huella-danger-50 p-4 md:col-span-2"
                            >
                                <UIcon
                                    name="i-lucide-wifi-off"
                                    class="mt-0.5 size-5 shrink-0 text-error"
                                />
                                <div class="font-sans text-sm text-huella-danger-800">
                                    <p class="font-semibold">
                                        No hemos podido enviar tu propuesta
                                    </p>
                                    <p class="mt-1">
                                        El problema es nuestro, no de tu formulario: todo lo que has escrito sigue aquí. Inténtalo de nuevo en unos minutos.
                                    </p>
                                </div>
                            </div>

                            <UFormField
                                label="Nombre y apellidos"
                                required
                            >
                                <UInput
                                    v-model="form.name"
                                    autocomplete="name"
                                    :disabled="state === 'submitting'"
                                    class="w-full"
                                />
                            </UFormField>
                            <UFormField
                                label="Correo electrónico"
                                required
                                :error="state === 'invalid' ? 'Falta el dominio: por ejemplo, mjfernandez@ucm.es' : undefined"
                            >
                                <UInput
                                    id="email"
                                    v-model="form.email"
                                    type="email"
                                    autocomplete="email"
                                    :disabled="state === 'submitting'"
                                    class="w-full"
                                />
                            </UFormField>
                            <UFormField
                                label="Tipo de trabajo"
                                required
                            >
                                <USelect
                                    v-model="form.kind"
                                    :items="['Artículo', 'TFG', 'TFM']"
                                    :disabled="state === 'submitting'"
                                    class="w-full"
                                />
                            </UFormField>
                            <UFormField
                                label="Título provisional"
                            >
                                <UInput
                                    v-model="form.title"
                                    :disabled="state === 'submitting'"
                                    class="w-full"
                                />
                            </UFormField>
                            <UFormField
                                label="Resumen"
                                required
                                help="Dos o tres frases: tema, tesis y fuentes principales."
                                :error="state === 'invalid' ? 'Escribe un resumen para que podamos valorar la propuesta.' : undefined"
                                class="md:col-span-2"
                            >
                                <UTextarea
                                    id="resumen"
                                    v-model="form.summary"
                                    :rows="4"
                                    :disabled="state === 'submitting'"
                                    class="w-full"
                                />
                            </UFormField>
                            <UFormField
                                label="Archivo"
                                help=".docx, .doc, .pages o .rtf"
                                class="md:col-span-2"
                            >
                                <UFileUpload
                                    label="Arrastra tu archivo o selecciónalo"
                                    description="El texto completo del trabajo"
                                    icon="i-lucide-file-text"
                                    accept=".docx,.doc,.pages,.rtf"
                                    :disabled="state === 'submitting'"
                                    class="w-full"
                                    :ui="{ base: 'min-h-32 bg-ivory-100' }"
                                />
                            </UFormField>
                            <UCheckbox
                                v-model="form.consent"
                                size="lg"
                                label="Acepto que Huella Legal trate mis datos para valorar la propuesta, según la política de privacidad."
                                :disabled="state === 'submitting'"
                                class="md:col-span-2"
                            />
                            <div class="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
                                <UButton
                                    type="submit"
                                    :loading="state === 'submitting'"
                                    :label="state === 'submitting' ? 'Enviando…' : state === 'error' ? 'Reintentar el envío' : 'Enviar propuesta'"
                                    class="justify-center"
                                />
                                <p class="font-sans text-meta text-muted">
                                    Respondemos en 24–72 horas.
                                </p>
                            </div>
                        </form>
                    </div>

                    <aside
                        aria-labelledby="faq"
                        class="flex flex-col gap-12 lg:col-span-5 lg:gap-16"
                    >
                        <div class="border-t-2 border-huella-slate-900 pt-4">
                            <h2
                                id="faq"
                                class="font-serif text-h3 text-highlighted"
                            >
                                Preguntas frecuentes
                            </h2>
                            <UAccordion
                                :items="faq"
                                :default-value="'faq-0'"
                                class="mt-2"
                                :ui="{ item: 'border-(--ui-border-muted)', trigger: 'min-h-14 py-3 font-serif text-base text-highlighted text-left', body: 'font-serif text-base leading-relaxed text-toned pb-4' }"
                            />
                        </div>

                        <div
                            id="tfg"
                            class="rounded-sm bg-huella-slate-900 p-6 text-huella-slate-200"
                        >
                            <span class="flex size-11 items-center justify-center rounded-full bg-huella-slate-800 text-huella-teal-300">
                                <UIcon
                                    name="i-lucide-graduation-cap"
                                    class="size-5"
                                />
                            </span>
                            <h3 class="mt-4 font-serif text-h3 text-ivory-50">
                                ¿Es un TFG o un TFM?
                            </h3>
                            <p class="mt-2 font-serif text-base leading-relaxed">
                                Los trabajos de fin de grado y de máster se publican íntegramente en su propio archivo. Elige «TFG» o «TFM» en el formulario.
                            </p>
                            <UButton
                                variant="link"
                                color="neutral"
                                label="Ver trabajos publicados"
                                trailing-icon="i-lucide-arrow-right"
                                to="/lab/publicaciones?formato=tfg-tfm"
                                class="mt-2 -ml-3 text-huella-teal-200 hover:text-ivory-50"
                            />
                        </div>
                    </aside>
                </div>
            </section>
        </main>

        <SiteFooter />
    </div>
</template>
