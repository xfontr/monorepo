<script setup lang="ts">
interface Props {
    articles: number;
    authors: number;
}

const props = defineProps<Props>();

const figures = computed(() => [
    { key: "articles", value: props.articles },
    { key: "authors", value: props.authors },
]);
</script>

<template>
    <BasePageIntro :breadcrumbs="[{ label: $t('aboutIntro.breadcrumb') }]">
        <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-x-12">
            <div class="lg:col-span-7">
                <BaseKicker>{{ $t("aboutIntro.kicker") }}</BaseKicker>
                <I18nT
                    keypath="aboutIntro.title"
                    tag="h1"
                    scope="global"
                    class="mt-3 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-balance text-highlighted md:text-[4rem]"
                >
                    <template #mark>
                        <em class="text-huella-teal-600">{{ $t("aboutIntro.mark") }}</em>
                    </template>
                </I18nT>
                <p class="mt-6 max-w-measure font-serif text-standfirst text-pretty text-toned">
                    {{ $t("aboutIntro.lead") }}
                </p>
                <dl class="mt-8 flex max-w-measure gap-10 border-t border-default pt-6 md:gap-16">
                    <div
                        v-for="(figure, index) in figures"
                        :key="figure.key"
                        class="flex flex-col-reverse gap-1.5"
                        :style="{ '--step': index }"
                    >
                        <dt class="font-sans text-meta text-muted">
                            {{ $t(`aboutFigures.${figure.key}`) }}
                        </dt>
                        <dd
                            class="font-serif text-[2.75rem] leading-none text-highlighted tabular-nums md:text-[3.5rem]"
                        >
                            <span class="hl-about-count" :style="{ '--about-to': figure.value }"
                                ><span>{{ figure.value }}</span></span
                            >
                        </dd>
                    </div>
                </dl>
            </div>
            <div class="order-first flex lg:order-0 lg:col-span-5 lg:justify-end">
                <div
                    class="hl-about-seal relative grid size-28 place-items-center rounded-full bg-ivory-50 ring-1 ring-ivory-300 md:size-40 lg:size-80"
                >
                    <AboutFingerprint class="size-16 text-huella-teal-600 md:size-24 lg:size-48" />
                </div>
            </div>
        </div>
    </BasePageIntro>
</template>

<style>
@property --about-n {
    syntax: "<integer>";
    inherits: false;
    initial-value: 0;
}

.hl-about-count {
    display: inline-grid;
}

.hl-about-count > span,
.hl-about-count::after {
    grid-area: 1 / 1;
}

@media (prefers-reduced-motion: no-preference) {
    /* The digits stay in the DOM for screen readers and hold the width while the count runs */
    .hl-about-count > span {
        color: transparent;
    }

    .hl-about-count::after {
        content: counter(about-n) / "";
        counter-reset: about-n var(--about-n);
        justify-self: end;
        animation: hl-about-count 2s cubic-bezier(0.16, 1, 0.3, 1) both;
        animation-delay: calc(var(--step) * 150ms + 300ms);
    }

    /* WCAG 2.2.2 allows unstoppable motion only under five seconds */
    .hl-about-seal::before {
        content: "";
        position: absolute;
        inset: 0;
        border: 1px solid var(--color-huella-teal-400);
        border-radius: inherit;
        opacity: 0;
        animation: hl-about-ripple 1.6s ease-out 1.8s 2;
    }
}

/* Forced colours repaint the transparent digits, which would then sit under the counter */
@media (forced-colors: active) {
    .hl-about-count::after {
        content: none;
    }
}

@keyframes hl-about-count {
    from {
        --about-n: 0;
    }
    to {
        --about-n: var(--about-to);
    }
}

@keyframes hl-about-ripple {
    from {
        opacity: 0.8;
    }

    to {
        opacity: 0;
        scale: 1.3;
    }
}
</style>
