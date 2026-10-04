<script setup lang="ts">
import ArticleCard from "~/lab/ArticleCard.vue";
import Kicker from "~/lab/Kicker.vue";
import Wordmark from "~/lab/Wordmark.vue";
import { articles, authors, stress } from "~/lab/fixtures";

useHead({ title: "Fundamentos · Laboratorio Huella Legal", htmlAttrs: { lang: "es" } });

const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const ramps = [
    { name: "ivory", label: "Papel", anchor: 100 },
    { name: "huella-slate", label: "Pizarra", anchor: 500 },
    { name: "huella-teal", label: "Verde agua", anchor: 400 },
    { name: "huella-ink", label: "Tinta", anchor: 700 },
];

function luminance(hex: string): number {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));

    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ratio(fg: string, bg: string): string {
    const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);

    return `${((a! + 0.05) / (b! + 0.05)).toFixed(2)}:1`;
}

const pairs = [
    { fg: "#192630", bg: "#F1E9DB", label: "Títulos sobre papel", fgClass: "text-highlighted", bgClass: "bg-default" },
    { fg: "#4E4E4E", bg: "#F1E9DB", label: "Texto sobre papel", fgClass: "text-default", bgClass: "bg-default" },
    { fg: "#6B6863", bg: "#F1E9DB", label: "Texto secundario", fgClass: "text-muted", bgClass: "bg-default" },
    { fg: "#3E5A6D", bg: "#F1E9DB", label: "Enlace / primario", fgClass: "text-primary", bgClass: "bg-default" },
    { fg: "#326C65", bg: "#F1E9DB", label: "Acento como texto", fgClass: "text-secondary", bgClass: "bg-default" },
    { fg: "#FBF8F2", bg: "#3E5A6D", label: "Texto sobre primario", fgClass: "text-ivory-50", bgClass: "bg-primary" },
    { fg: "#FBF8F2", bg: "#192630", label: "Texto sobre pie", fgClass: "text-ivory-50", bgClass: "bg-huella-slate-900" },
    { fg: "#9B3D35", bg: "#FDF4F2", label: "Error", fgClass: "text-error", bgClass: "bg-huella-danger-50" },
];

const typeScale = [
    { token: "display", spec: "Georgia 52/1.08", sample: "Derecho riguroso, escrito para ser leído", cls: "font-serif text-[2.25rem] leading-[1.12] md:text-display md:leading-(--text-display--line-height) text-highlighted" },
    { token: "title", spec: "Georgia 42/1.06, 56 desde md", sample: "Publicaciones", cls: "font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] md:text-[3.5rem] text-highlighted" },
    { token: "h1", spec: "Georgia 40/1.15", sample: "La teoría jurídica del delito", cls: "font-serif text-[2rem] leading-[1.18] md:text-h1 md:leading-(--text-h1--line-height) text-highlighted" },
    { token: "h2", spec: "Georgia 30/1.25", sample: "Tipicidad, antijuridicidad y culpabilidad", cls: "font-serif text-h2 text-highlighted" },
    { token: "h3", spec: "Georgia 24/1.3", sample: "El error de prohibición invencible", cls: "font-serif text-h3 text-highlighted" },
    { token: "reading", spec: "Georgia 18/1.7", sample: "El delito se define como una acción típica, antijurídica y culpable. Cada una de estas categorías funciona como un filtro sucesivo.", cls: "font-serif text-reading max-w-measure" },
    { token: "quote", spec: "Georgia italic 24/1.45", sample: "«No hay pena sin culpabilidad» es algo más que un aforismo.", cls: "font-serif italic text-quote text-highlighted" },
    { token: "citation", spec: "Georgia 15/1.55", sample: stress.citation, cls: "font-serif text-citation text-toned" },
    { token: "label", spec: "Montserrat 600 14", sample: "Suscribirme al boletín", cls: "font-sans text-sm font-semibold text-highlighted" },
    { token: "meta", spec: "Montserrat 400 13", sample: "Xifré Font · 12 de marzo de 2024 · 24 min de lectura", cls: "font-sans text-meta text-muted" },
    { token: "kicker", spec: "Montserrat 600 12 · mayúsculas, 0.12em", sample: "Derecho penal", cls: "font-sans text-xs font-semibold uppercase tracking-[0.12em] text-secondary" },
];

const email = ref("lucia.martin@");

const labPages = [
    { label: "Portada", to: "/lab/home" },
    { label: "Portada · menú móvil abierto", to: "/lab/home?menu=1" },
    { label: "Artículo", to: "/lab/article" },
    { label: "Artículo · sin notas ni imagen", to: "/lab/article?sin-notas=1&sin-imagen=1" },
    { label: "Publicaciones", to: "/lab/publicaciones" },
    { label: "Materia", to: "/lab/publicaciones?materia=derecho-penal" },
    { label: "Ficha de colaborador", to: "/lab/category?autor=1" },
    { label: "Materias", to: "/lab/categorias" },
    { label: "Colaboradores", to: "/lab/colaboradores" },
    { label: "Publicar", to: "/lab/publicar" },
    { label: "Publicar · con errores", to: "/lab/publicar?estado=invalid#formulario" },
    { label: "Estados", to: "/lab/estados" },
    { label: "Primitivas", to: "/lab/base" },
    { label: "Listados", to: "/lab/listing" },
];

const attemptPages = [
    { label: "Portada A", to: "/lab/attempts/home-a" },
    { label: "Artículo A", to: "/lab/attempts/article-a" },
    { label: "Materia A", to: "/lab/category" },
    { label: "Materias A", to: "/lab/attempts/categorias-a" },
    { label: "Portada B", to: "/lab/attempts/home-b" },
    { label: "Materia B", to: "/lab/attempts/category-b" },
    { label: "Archivo C", to: "/lab/attempts/category-c" },
    { label: "Materias B", to: "/lab/attempts/categorias-b" },
    { label: "Artículo B", to: "/lab/attempts/article-b" },
    { label: "Serie B", to: "/lab/attempts/serie-b" },
];
</script>

<template>
    <main class="mx-auto max-w-site px-4 pb-24 md:px-8 lg:px-12">
        <header class="flex flex-col gap-6 border-b border-default py-12 md:flex-row md:items-end md:justify-between md:py-16">
            <Wordmark
                size="lg"
                tagline
            />
            <div class="max-w-md font-sans text-sm text-muted">
                <p class="font-semibold text-highlighted">
                    Laboratorio · Fundamentos
                </p>
                <p class="mt-1">
                    Color, tipografía, controles y tarjetas del rediseño. Todo lo que aparece aquí sale de los tokens en
                    <code class="rounded-xs bg-ivory-200 px-1 py-0.5 text-[0.8125rem]">main.css</code>.
                </p>
            </div>
        </header>

        <nav
            aria-label="Páginas del laboratorio"
            class="border-b border-default py-6"
        >
            <ul class="flex flex-wrap gap-2">
                <li
                    v-for="page in labPages"
                    :key="page.to"
                >
                    <a
                        :href="page.to"
                        class="inline-flex min-h-11 items-center rounded-full border border-default px-4 font-sans text-sm font-medium text-toned hover:bg-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >{{ page.label }}</a>
                </li>
            </ul>
            <p class="mt-5 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Intentos anteriores
            </p>
            <ul class="mt-2 flex flex-wrap gap-2">
                <li
                    v-for="page in attemptPages"
                    :key="page.to"
                >
                    <a
                        :href="page.to"
                        class="inline-flex min-h-11 items-center rounded-full border border-dashed border-(--ui-border-accented) px-4 font-sans text-sm font-medium text-toned hover:bg-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >{{ page.label }}</a>
                </li>
            </ul>
        </nav>

        <!-- Colour -->
        <section class="grid gap-12 border-b border-default py-16 lg:grid-cols-[14rem_1fr] lg:py-20">
            <div>
                <Kicker>01</Kicker>
                <h2 class="mt-2 font-serif text-h2 text-highlighted">
                    Color
                </h2>
                <p class="mt-3 font-serif text-base leading-relaxed text-toned">
                    Los cuatro colores de la marca actual, extendidos a escalas completas. El verde agua de marca es decorativo; como texto se usa el paso 600.
                </p>
            </div>

            <div class="flex flex-col gap-8">
                <div
                    v-for="ramp in ramps"
                    :key="ramp.name"
                >
                    <p class="mb-2 font-sans text-meta font-semibold text-highlighted">
                        {{ ramp.label }} <span class="font-medium text-muted">· {{ ramp.name }}</span>
                    </p>
                    <div class="grid grid-cols-11 overflow-hidden rounded-xs border border-default">
                        <div
                            v-for="step in steps"
                            :key="step"
                            class="flex h-14 items-end p-1.5 font-sans text-[0.625rem] tabular-nums sm:h-16"
                            :style="{ background: `var(--color-${ramp.name}-${step})` }"
                            :class="step >= 500 ? 'text-white/80' : 'text-black/55'"
                        >
                            <span :class="step === ramp.anchor && 'rounded-xs bg-white/90 px-1 font-semibold text-black'">{{ step }}</span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <div
                        v-for="pair in pairs"
                        :key="pair.label"
                        class="flex flex-col justify-between gap-6 rounded-xs border border-default p-4"
                        :class="pair.bgClass"
                    >
                        <span
                            class="font-serif text-[1.75rem] leading-none"
                            :class="pair.fgClass"
                        >Aa</span>
                        <span
                            class="font-sans text-meta"
                            :class="pair.fgClass"
                        >
                            <span class="block font-semibold">{{ pair.label }}</span>
                            <span class="tabular-nums opacity-80">{{ ratio(pair.fg, pair.bg) }}</span>
                        </span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Type -->
        <section class="grid gap-12 border-b border-default py-16 lg:grid-cols-[14rem_1fr] lg:py-20">
            <div>
                <Kicker>02</Kicker>
                <h2 class="mt-2 font-serif text-h2 text-highlighted">
                    Tipografía
                </h2>
                <p class="mt-3 font-serif text-base leading-relaxed text-toned">
                    Georgia para leer, Montserrat para orientarse. Los títulos van en redonda regular: el peso lo da el tamaño, no la negrita.
                </p>
            </div>

            <dl class="divide-y divide-(--ui-border-muted)">
                <div
                    v-for="item in typeScale"
                    :key="item.token"
                    class="grid gap-2 py-5 first:pt-0 md:grid-cols-[9rem_1fr] md:gap-8"
                >
                    <dt class="font-sans text-meta text-muted">
                        <span class="block font-semibold text-highlighted">{{ item.token }}</span>
                        {{ item.spec }}
                    </dt>
                    <dd :class="item.cls">
                        {{ item.sample }}
                    </dd>
                </div>
            </dl>
        </section>

        <!-- Reading -->
        <section class="grid gap-12 border-b border-default py-16 lg:grid-cols-[14rem_1fr] lg:py-20">
            <div>
                <Kicker>03</Kicker>
                <h2 class="mt-2 font-serif text-h2 text-highlighted">
                    Lectura
                </h2>
                <p class="mt-3 font-serif text-base leading-relaxed text-toned">
                    Columna de 680&nbsp;px: unos 70 caracteres por línea. Enlaces subrayados, notas al pie numeradas y citas legales en cuerpo menor.
                </p>
            </div>

            <div class="max-w-measure font-serif text-reading">
                <p>
                    La teoría jurídica del delito es, ante todo, un método. Permite al juez recorrer un hecho en un orden fijo
                    —acción, tipicidad, antijuridicidad, culpabilidad— y detenerse en cuanto una categoría falla. Como recuerda
                    el Tribunal Constitucional, el principio de culpabilidad
                    <a
                        href="#"
                        data-inline
                        class="text-primary underline decoration-huella-slate-300 underline-offset-[0.18em] hover:decoration-current focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >no admite excepciones</a>
                    fundadas en razones de eficacia<sup class="ml-0.5 font-sans text-[0.6875rem] font-semibold"><a
                        href="#"
                        data-inline
                        class="text-secondary hover:underline"
                    >1</a></sup>.
                </p>

                <blockquote class="my-10 border-l-[3px] border-huella-teal-400 pl-6">
                    <p class="font-serif text-quote italic text-highlighted">
                        «La pena no puede imponerse a quien no pudo obrar de otro modo; ese límite no se negocia.»
                    </p>
                    <footer class="mt-3 font-sans text-meta text-muted">
                        — Raquel Crespo Ruiz, exfiscal y magistrada
                    </footer>
                </blockquote>

                <p>
                    Esa es la razón por la que el error de prohibición invencible excluye la culpabilidad, mientras que el vencible
                    solo la atenúa. La distinción, aparentemente técnica, decide si una persona entra o no en prisión.
                </p>

                <aside class="mt-10 border-t border-default pt-4">
                    <ol class="flex flex-col gap-2 font-serif text-citation text-toned">
                        <li class="grid grid-cols-[1.5rem_1fr]">
                            <span class="font-sans text-xs font-semibold text-secondary">1</span>
                            <span>{{ stress.citation }}.</span>
                        </li>
                    </ol>
                </aside>
            </div>
        </section>

        <!-- Controls -->
        <section class="grid gap-12 border-b border-default py-16 lg:grid-cols-[14rem_1fr] lg:py-20">
            <div>
                <Kicker>04</Kicker>
                <h2 class="mt-2 font-serif text-h2 text-highlighted">
                    Controles
                </h2>
                <p class="mt-3 font-serif text-base leading-relaxed text-toned">
                    Componentes de Nuxt UI con los tokens de Huella. Todo objetivo táctil mide al menos 44&nbsp;px; el foco de teclado es un anillo de 2&nbsp;px separado 2&nbsp;px.
                </p>
            </div>

            <div class="flex flex-col gap-10">
                <div class="flex flex-col gap-4">
                    <p class="font-sans text-meta font-semibold text-highlighted">
                        Botones
                    </p>
                    <div class="flex flex-wrap items-center gap-3">
                        <UButton
                            size="xl"
                            label="Suscribirme"
                        />
                        <UButton
                            size="xl"
                            variant="outline"
                            color="neutral"
                            label="Publicar un artículo"
                        />
                        <UButton
                            size="xl"
                            variant="ghost"
                            color="neutral"
                            label="Ver todas"
                            trailing-icon="i-lucide-arrow-right"
                        />
                        <UButton
                            size="xl"
                            variant="link"
                            label="Leer el artículo"
                            trailing-icon="i-lucide-arrow-right"
                        />
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <UButton
                            size="xl"
                            label="Foco de teclado"
                            class="outline-2 outline-offset-2 outline-primary"
                        />
                        <UButton
                            size="xl"
                            loading
                            label="Enviando"
                        />
                        <UButton
                            size="xl"
                            disabled
                            label="No disponible"
                        />
                        <UButton
                            size="xl"
                            square
                            variant="ghost"
                            color="neutral"
                            icon="i-lucide-search"
                            aria-label="Buscar"
                        />
                        <UButton
                            size="xl"
                            square
                            variant="outline"
                            color="neutral"
                            icon="i-lucide-menu"
                            aria-label="Abrir menú"
                        />
                    </div>
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                    <UFormField
                        label="Correo electrónico"
                        help="Un correo al mes. Puedes darte de baja cuando quieras."
                        size="xl"
                    >
                        <UInput
                            placeholder="nombre@ejemplo.es"
                            class="w-full"
                        />
                    </UFormField>
                    <UFormField
                        label="Correo electrónico"
                        error="Falta el dominio: por ejemplo, lucia.martin@ejemplo.es"
                        size="xl"
                        required
                    >
                        <UInput
                            v-model="email"
                            class="w-full"
                        />
                    </UFormField>
                    <UFormField
                        label="Tipo de trabajo"
                        size="xl"
                    >
                        <USelect
                            :items="['Artículo', 'TFG', 'TFM']"
                            default-value="Artículo"
                            class="w-full"
                        />
                    </UFormField>
                    <UFormField
                        label="Nombre"
                        size="xl"
                    >
                        <UInput
                            disabled
                            model-value="María-José Fernández Ruiz"
                            class="w-full"
                        />
                    </UFormField>
                    <UFormField
                        label="Resumen del trabajo"
                        size="xl"
                        class="md:col-span-2"
                    >
                        <UTextarea
                            :rows="3"
                            placeholder="Dos o tres frases sobre el tema, la tesis y las fuentes principales."
                            class="w-full"
                        />
                    </UFormField>
                    <UCheckbox
                        size="lg"
                        label="He leído y acepto la política de privacidad"
                        class="md:col-span-2"
                    />
                </div>

                <div class="flex flex-col gap-3">
                    <p class="font-sans text-meta font-semibold text-highlighted">
                        Materias y etiquetas
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <a
                            v-for="label in ['Derecho penal', 'Derecho civil', 'Teoría del Derecho', stress.category]"
                            :key="label"
                            href="#"
                            class="inline-flex min-h-11 items-center rounded-full border border-default px-4 font-sans text-sm font-medium text-toned transition-colors hover:border-(--ui-border-accented) hover:bg-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >{{ label }}</a>
                        <a
                            href="#"
                            aria-current="page"
                            class="inline-flex min-h-11 items-center rounded-full bg-primary px-4 font-sans text-sm font-medium text-ivory-50"
                        >Actual: Derecho penal</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Cards -->
        <section class="grid gap-12 py-16 lg:grid-cols-[14rem_1fr] lg:py-20">
            <div>
                <Kicker>05</Kicker>
                <h2 class="mt-2 font-serif text-h2 text-highlighted">
                    Tarjetas
                </h2>
                <p class="mt-3 font-serif text-base leading-relaxed text-toned">
                    Separadas por filetes, no por cajas. El título es el único enlace al artículo; materia y autor enlazan por su cuenta.
                </p>
            </div>

            <div class="flex flex-col gap-12">
                <ArticleCard
                    :article="articles[0]!"
                    variant="lead"
                    split
                />
                <div class="grid gap-x-10 gap-y-10 border-t border-default pt-8 md:grid-cols-2">
                    <ArticleCard :article="articles[1]!" />
                    <ArticleCard :article="articles[6]!" />
                </div>
                <div class="grid gap-x-10 gap-y-10 border-t border-default pt-8 md:grid-cols-2 lg:grid-cols-3">
                    <ArticleCard
                        :article="articles[3]!"
                        variant="media"
                    />
                    <ArticleCard
                        :article="articles[4]!"
                        variant="media"
                    />
                    <div class="flex flex-col divide-y divide-(--ui-border-muted) md:col-span-2 lg:col-span-1">
                        <ArticleCard
                            v-for="article in articles.slice(1, 4)"
                            :key="article.slug"
                            :article
                            variant="compact"
                            class="py-4 first:pt-0"
                        />
                    </div>
                </div>
                <p class="font-sans text-meta text-muted">
                    Casos límite: título de 110 caracteres, materia larga y tres autores (<span class="text-highlighted">{{ authors.mariaJose.name }}</span> y otros); artículo sin imagen.
                </p>
            </div>
        </section>
    </main>
</template>
