<template>
    <UFooter>
        <template #top>
            <UContainer class="grid gap-12 lg:grid-cols-12 lg:gap-8">
                <div class="flex flex-col gap-5 lg:col-span-4">
                    <BaseWordmark tone="slate" tagline />
                    <p class="max-w-xs font-serif text-base/relaxed text-balance">
                        {{ $t("app.footer.about") }}
                    </p>
                </div>

                <UFooterColumns
                    as="nav"
                    :aria-label="$t('app.footer.label')"
                    :columns="linked"
                    class="lg:col-span-7 lg:col-start-6"
                />
            </UContainer>
        </template>

        <template #left>
            <p>{{ $t("app.footer.copyright", { year, issn }) }}</p>
        </template>

        <template #right>
            <div class="-ml-3 flex items-center gap-1 md:-mr-3 md:ml-0">
                <ul
                    v-if="social.length"
                    :aria-label="$t('app.footer.social.label')"
                    class="flex items-center gap-1"
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
                            :class="ICON_LINK"
                        />
                    </li>
                </ul>

                <UButton
                    :to="repository"
                    target="_blank"
                    square
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-github"
                    :aria-label="$t('app.footer.repository')"
                    :class="ICON_LINK"
                />
            </div>
        </template>
    </UFooter>
</template>

<script setup lang="ts">
import type { FooterColumn } from "@nuxt/ui";
import type { SocialLink } from "~/composables/useSiteNav";

interface Props {
    columns: FooterColumn[];
    social: SocialLink[];
    issn: string;
}

const props = defineProps<Props>();

const jumpToNewsletter = useNewsletterJump();
const { nav, repository } = useAppConfig();

const linked = computed<FooterColumn[]>(() =>
    props.columns.map((column) => ({
        ...column,
        children: column.children?.map((link) =>
            link.to === nav.newsletter ? { ...link, onClick: jumpToNewsletter } : link,
        ),
    })),
);

const year = new Date().getFullYear();

const ICON_LINK = "rounded-full hover:bg-elevated focus-visible:outline-ivory-50";
</script>
