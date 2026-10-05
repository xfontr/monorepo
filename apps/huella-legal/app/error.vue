<script lang="ts" setup>
import type { NuxtError } from "#app";
import { es } from "@nuxt/ui/locale";

interface Props {
    error: NuxtError<{ message?: string }>
}

const { error } = defineProps<Props>();

const { t } = useI18n();
const searchAction = useRouter().resolve({ name: "search" }).href;

const isDev = import.meta.dev;

useHead({
    title: t("error.head", { status: error.status }),
    meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "robots", content: "noindex" },
    ],
}, { tagPriority: "high" });

function retry() {
    reloadNuxtApp();
}
</script>

<template>
    <UApp :locale="es">
        <NuxtLayout>
            <UContainer class="py-12 md:py-20">
                <section
                    v-if="error.status === 404"
                    data-error="not-found"
                    class="lg:w-7/12"
                >
                    <BaseKicker>{{ $t("error.kicker", { status: error.status }) }}</BaseKicker>
                    <h1 class="mt-2 font-serif text-[2.625rem] leading-[1.06] tracking-[-0.02em] text-balance text-highlighted md:text-[3.5rem]">
                        {{ $t("error.notFound.title") }}
                    </h1>
                    <p class="mt-4 max-w-measure font-serif text-[1.1875rem] leading-relaxed text-toned">
                        {{ $t("error.notFound.lead") }}
                    </p>
                    <form
                        :action="searchAction"
                        method="get"
                        role="search"
                        class="mt-8 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end"
                    >
                        <UFormField
                            :label="$t('error.search.label')"
                            name="q"
                            class="flex-1"
                        >
                            <UInput
                                name="q"
                                icon="i-lucide-search"
                                :placeholder="$t('error.search.placeholder')"
                                class="w-full"
                            />
                        </UFormField>
                        <UButton
                            type="submit"
                            :label="$t('error.search.submit')"
                            class="justify-center"
                        />
                    </form>
                    <UButton
                        :to="{ name: 'index' }"
                        variant="link"
                        trailing-icon="i-lucide-arrow-right"
                        :label="$t('error.notFound.home')"
                        class="mt-4 -ml-3"
                    />
                </section>

                <section
                    v-else
                    data-error="server"
                    class="flex flex-col items-start gap-4"
                >
                    <BaseKicker tone="muted">
                        {{ $t("error.kicker", { status: error.status }) }}
                    </BaseKicker>
                    <h1 class="font-serif text-h3 text-balance text-highlighted">
                        {{ $t("error.server.title") }}
                    </h1>
                    <p class="max-w-md font-serif text-base leading-relaxed text-toned">
                        {{ $t("error.server.lead") }}
                    </p>
                    <div class="flex flex-col gap-3 self-stretch sm:flex-row sm:self-start">
                        <UButton
                            icon="i-lucide-rotate-cw"
                            :label="$t('error.server.retry')"
                            class="justify-center"
                            @click="retry"
                        />
                        <UButton
                            :to="{ name: 'article', params: { slug: 'contacto' } }"
                            variant="outline"
                            color="neutral"
                            :label="$t('error.server.contact')"
                            class="justify-center"
                        />
                    </div>
                </section>

                <ErrorDebug
                    v-if="isDev"
                    :error
                />
            </UContainer>
        </NuxtLayout>
    </UApp>
</template>
