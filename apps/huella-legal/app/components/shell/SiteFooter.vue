<script setup lang="ts">
import type { FooterColumn } from "@nuxt/ui";
import type { RouteMap } from "vue-router";

interface Column {
    key: string
    links: readonly {
        key: string
        to: {
            name: keyof RouteMap
            params?: { slug: string }
            hash?: string
        }
    }[]
}

const COLUMNS = [
    {
        key: "journal",
        links: [
            { key: "publications", to: { name: "publications" } },
            { key: "subjects", to: { name: "categories" } },
            { key: "collaborators", to: { name: "authors" } },
            { key: "about", to: { name: "article", params: { slug: "sobre" } } },
        ],
    },
    {
        key: "participate",
        links: [
            { key: "publish", to: { name: "publish" } },
            { key: "publishThesis", to: { name: "publish", hash: "#tesis" } },
            { key: "newsletter", to: { name: "index", hash: "#newsletter" } },
            { key: "contact", to: { name: "article", params: { slug: "contacto" } } },
        ],
    },
    {
        key: "legal",
        links: [
            { key: "legalNotice", to: { name: "article", params: { slug: "aviso-legal" } } },
            { key: "privacy", to: { name: "article", params: { slug: "aviso-legal" }, hash: "#privacidad" } },
            { key: "cookies", to: { name: "article", params: { slug: "aviso-legal" }, hash: "#cookies" } },
        ],
    },
] as const satisfies readonly Column[];

const SOCIAL = [
    { key: "instagram", icon: "i-lucide-instagram" },
    { key: "linkedin", icon: "i-lucide-linkedin" },
    { key: "x", icon: "i-lucide-twitter" },
] as const;

const { t } = useI18n();
const { journal } = useAppConfig();
const { public: { social: profiles } } = useRuntimeConfig();

const year = new Date().getFullYear();

const columns = computed<FooterColumn[]>(() => COLUMNS.map(({ key, links }) => ({
    label: t(`app.footer.columns.${key}`),
    children: links.map((link) => ({ label: t(`app.footer.links.${link.key}`), to: link.to })),
})));

const social = SOCIAL.filter(({ key }) => profiles[key]).map(({ key, icon }) => ({ key, icon, to: profiles[key] }));
</script>

<template>
    <UFooter>
        <template #top>
            <UContainer class="grid gap-12 lg:grid-cols-12 lg:gap-8">
                <div class="flex flex-col gap-5 lg:col-span-4">
                    <BaseWordmark
                        tone="paper"
                        tagline
                    />
                    <p class="max-w-xs font-serif text-base leading-relaxed text-balance text-huella-slate-200">
                        {{ $t("app.footer.about") }}
                    </p>
                </div>

                <UFooterColumns
                    as="nav"
                    :aria-label="$t('app.footer.label')"
                    :columns
                    class="lg:col-span-7 lg:col-start-6"
                >
                    <template #link="{ link }">
                        {{ link.label }}
                    </template>
                </UFooterColumns>
            </UContainer>
        </template>

        <template #left>
            <p>{{ $t("app.footer.copyright", { year, issn: journal.issn }) }}</p>
        </template>

        <template #right>
            <ul
                v-if="social.length"
                :aria-label="$t('app.footer.social.label')"
                class="-ml-3 flex items-center gap-1 md:-mr-3 md:ml-0"
            >
                <li
                    v-for="{ key, to, icon } in social"
                    :key
                >
                    <UButton
                        :to
                        target="_blank"
                        square
                        variant="ghost"
                        color="neutral"
                        :icon
                        :aria-label="$t(`app.footer.social.${key}`)"
                        class="rounded-full text-huella-slate-200 hover:bg-huella-slate-800 hover:text-ivory-50 focus-visible:outline-ivory-50"
                    />
                </li>
            </ul>
        </template>
    </UFooter>
</template>
