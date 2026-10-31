<template>
    <section class="bg-huella-teal-800 text-ivory-50">
        <UContainer
            class="relative flex flex-col gap-8 overflow-hidden py-16 md:flex-row md:items-center md:justify-between lg:py-20"
        >
            <AboutFingerprint
                draw-on-view
                class="pointer-events-none absolute -right-16 -bottom-24 size-96 text-huella-teal-700"
            />
            <div class="relative">
                <h2 class="font-serif text-4xl/tight md:text-[3rem]">
                    {{ $t("aboutCallToAction.title") }}
                </h2>
                <p class="mt-3 max-w-xl font-serif text-standfirst text-huella-teal-100">
                    {{ $t("aboutCallToAction.lead") }}
                </p>
            </div>
            <div class="relative flex shrink-0 flex-col gap-3 sm:flex-row">
                <UButton
                    :label="$t('aboutCallToAction.publish')"
                    icon="i-lucide-pen-line"
                    :to="{ name: 'publish' }"
                    class="justify-center bg-ivory-50 text-huella-teal-900 hover:bg-ivory-100 focus-visible:outline-ivory-50"
                />
                <UButton
                    :label="$t('aboutCallToAction.contact')"
                    icon="i-lucide-mail"
                    variant="outline"
                    :to="{ name: 'contact' }"
                    class="justify-center text-ivory-50 ring-ivory-50/60 hover:bg-huella-teal-700 focus-visible:outline-ivory-50"
                />
            </div>
        </UContainer>
    </section>
</template>
