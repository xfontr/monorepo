<template>
    <section :aria-labelledby="headingId">
        <BaseSectionHeading :id="headingId" :title="$t('publish.steps.title')" />
        <ol class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            <li
                v-for="(step, index) in STEPS"
                :key="step"
                class="relative grid grid-cols-[auto_1fr] gap-4 lg:flex lg:flex-col lg:pr-6"
            >
                <span
                    aria-hidden="true"
                    class="relative z-10 flex size-11 items-center justify-center rounded-full font-sans text-sm font-semibold tabular-nums"
                    :class="
                        index === STEPS.length - 1
                            ? 'bg-primary text-inverted'
                            : 'bg-default text-primary ring-1 ring-accented'
                    "
                >
                    {{ index + 1 }}
                </span>
                <span
                    v-if="index < STEPS.length - 1"
                    class="absolute top-5.5 right-0 left-11 hidden h-px bg-(--ui-border-accented) lg:block"
                    aria-hidden="true"
                />
                <div>
                    <h3 class="font-serif text-xl text-highlighted">
                        {{ $t(`publish.steps.items.${step}.title`) }}
                    </h3>
                    <p class="mt-1 font-serif text-base/relaxed text-toned">
                        {{ $t(`publish.steps.items.${step}.body`) }}
                    </p>
                </div>
            </li>
        </ol>
    </section>
</template>

<script setup lang="ts">
const STEPS = ["summary", "reading", "evaluation", "decision", "publication"] as const;

const headingId = useId();
</script>
