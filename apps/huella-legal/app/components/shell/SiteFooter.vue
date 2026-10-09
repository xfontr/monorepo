<script setup lang="ts">
import type { FooterColumn } from "@nuxt/ui";
import type { SocialLink } from "~/composables/useSiteNav";

interface Props {
    columns: FooterColumn[];
    social: SocialLink[];
    issn: string;
}

defineProps<Props>();

const year = new Date().getFullYear();
</script>

<template>
    <UFooter>
        <template #top>
            <UContainer class="grid gap-12 lg:grid-cols-12 lg:gap-8">
                <div class="flex flex-col gap-5 lg:col-span-4">
                    <BaseWordmark tone="slate" tagline />
                    <p
                        class="max-w-xs font-serif text-base leading-relaxed text-balance text-huella-slate-200"
                    >
                        {{ $t("app.footer.about") }}
                    </p>
                </div>

                <UFooterColumns
                    as="nav"
                    :aria-label="$t('app.footer.label')"
                    :columns
                    class="lg:col-span-7 lg:col-start-6"
                />
            </UContainer>
        </template>

        <template #left>
            <p>{{ $t("app.footer.copyright", { year, issn }) }}</p>
        </template>

        <template #right>
            <ul
                v-if="social.length"
                :aria-label="$t('app.footer.social.label')"
                class="-ml-3 flex items-center gap-1 md:-mr-3 md:ml-0"
            >
                <li v-for="{ key, to, icon, label } in social" :key>
                    <UButton
                        :to
                        target="_blank"
                        square
                        variant="ghost"
                        color="neutral"
                        :icon
                        :aria-label="label"
                        class="rounded-full text-huella-slate-200 hover:bg-huella-slate-800 hover:text-ivory-50 focus-visible:outline-ivory-50"
                    />
                </li>
            </ul>
        </template>
    </UFooter>
</template>
