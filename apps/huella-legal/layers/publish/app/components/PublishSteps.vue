<script setup lang="ts">
const STEPS = ["summary", "reading", "evaluation", "decision", "publication"] as const;

const headingId = useId();
</script>

<template>
    <section :aria-labelledby="headingId">
        <BaseSectionHeading :id="headingId" :title="$t('publish.steps.title')" />
        <ol class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            <li
                v-for="(step, index) in STEPS"
                :key="step"
                class="relative grid grid-cols-[2.75rem_1fr] gap-4 lg:flex lg:flex-col lg:pr-6"
            >
                <span
                    aria-hidden="true"
                    class="relative z-10 flex size-11 items-center justify-center rounded-full font-sans text-sm font-semibold tabular-nums"
                    :class="
                        index === STEPS.length - 1
                            ? 'bg-primary text-ivory-50'
                            : 'bg-ivory-100 text-primary ring-1 ring-(--ui-border-accented)'
                    "
                >
                    {{ index + 1 }}
                </span>
                <span
                    v-if="index < STEPS.length - 1"
                    class="absolute top-[1.375rem] left-11 hidden h-px w-[calc(100%-2.75rem)] bg-(--ui-border-accented) lg:block"
                    aria-hidden="true"
                />
                <span>
                    <span class="block font-serif text-xl text-highlighted">
                        {{ $t(`publish.steps.items.${step}.title`) }}
                    </span>
                    <span class="mt-1 block font-serif text-base leading-relaxed text-toned">
                        {{ $t(`publish.steps.items.${step}.body`) }}
                    </span>
                </span>
            </li>
        </ol>
    </section>
</template>
