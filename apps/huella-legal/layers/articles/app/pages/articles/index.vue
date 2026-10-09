<script setup lang="ts">
import type { Page } from "@monorepo/content";
import type { RouteLocationRaw } from "vue-router";

definePageMeta({ name: "publications", path: "/publicaciones/" });

const { locale } = useI18n();
const route = useRoute();

// Deliberately unvalidated — the content module already bounds `page` (README.md § Content)
const page = computed(() => route.query.page);

const { data, error, status } = await useFetch<Page<ArticleSummary>>("/api/articles", {
    query: { page },
});

function raiseIfMissing(): void {
    if (!error.value) return;

    // A 400 here means "bad or past-the-end page", mapped to 404 (README.md § Content)
    if (error.value.status === 400) {
        showError({ status: 404, statusText: "Page not found", fatal: true });

        return;
    }

    showError(createPageError(error.value));
}

raiseIfMissing();

// Watched as well as called: paging only changes the query, so setup never runs a second time
watch(error, raiseIfMissing);

// Nuxt's default scrollBehavior stays put when only the query changes
watch(page, () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Page one keeps the bare URL, so the list has a single canonical address
function pageLink(target: number): RouteLocationRaw {
    return { query: target > 1 ? { page: target } : {} };
}

const previousLink = computed(() => pageLink((data.value?.page ?? 1) - 1));
const nextLink = computed(() => pageLink((data.value?.page ?? 1) + 1));

function termsOf({ category, tags }: ArticleSummary): Category[] {
    return category ? [category, ...tags] : tags;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString(locale.value, { dateStyle: "long" });
}
</script>

<template>
    <div class="articles" :aria-busy="status === 'pending'">
        <h1>{{ $t("articles.title") }}</h1>

        <!-- Only while there is nothing to show: past the first page the previous one stays up, dimmed -->
        <p v-if="status === 'pending' && !data" class="notice">
            {{ $t("common.loading") }}
        </p>

        <template v-else-if="data">
            <p class="count">
                {{ $t("articles.count", { shown: data.items.length, total: data.total }) }}
            </p>

            <article v-for="summary in data.items" :key="summary.id" class="entry">
                <NuxtLink
                    class="entry__link"
                    :to="{ name: 'article', params: { slug: summary.slug } }"
                >
                    <img
                        v-if="summary.image"
                        class="entry__image"
                        :src="summary.image.url"
                        :alt="summary.image.alt"
                    />

                    <time
                        v-if="summary.publishedAt"
                        class="entry__date"
                        :datetime="summary.publishedAt"
                    >
                        {{ formatDate(summary.publishedAt) }}
                    </time>

                    <h2 class="entry__title">
                        {{ summary.title }}
                    </h2>
                </NuxtLink>

                <p v-if="summary.excerpt" class="entry__excerpt">
                    {{ summary.excerpt }}
                </p>

                <ul v-if="termsOf(summary).length" class="entry__terms">
                    <li v-for="term in termsOf(summary)" :key="term.id">
                        {{ term.name }}
                    </li>
                </ul>
            </article>

            <nav
                v-if="data.totalPages > 1"
                class="pagination"
                :aria-label="$t('articles.pagination.label')"
            >
                <!-- aria-current-value, because these links only differ from the current URL by
                     their query and vue-router matches on the path: left alone, every one of them
                     announces itself as the page you are already on -->
                <NuxtLink
                    v-if="data.page > 1"
                    aria-current-value="false"
                    class="pagination__link"
                    rel="prev"
                    :to="previousLink"
                >
                    {{ $t("articles.pagination.previous") }}
                </NuxtLink>

                <!-- A span, not a disabled link: there is no previous page to point at, and an
                     anchor without a destination is still announced and focused as a control -->
                <span v-else class="pagination__link pagination__link--spent">
                    {{ $t("articles.pagination.previous") }}
                </span>

                <p class="pagination__position">
                    {{
                        $t("articles.pagination.position", {
                            page: data.page,
                            total: data.totalPages,
                        })
                    }}
                </p>

                <NuxtLink
                    v-if="data.page < data.totalPages"
                    aria-current-value="false"
                    class="pagination__link"
                    rel="next"
                    :to="nextLink"
                >
                    {{ $t("articles.pagination.next") }}
                </NuxtLink>

                <span v-else class="pagination__link pagination__link--spent">
                    {{ $t("articles.pagination.next") }}
                </span>
            </nav>
        </template>
    </div>
</template>

<style scoped>
.articles {
    max-width: 42rem;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
    font-family: system-ui, sans-serif;
    line-height: 1.6;
    color: #1c1917;
}

h1 {
    font-size: 2rem;
    font-weight: 900;
    margin-bottom: 0.25rem;
}

.count,
.notice {
    color: #78716c;
    font-size: 0.875rem;
}

/* The page you are leaving stays legible underneath while the next one loads */
.articles[aria-busy="true"] .entry {
    opacity: 0.55;
}

.entry {
    padding: 2rem 0;
    border-bottom: 1px solid #e7e5e4;
}

.entry__link {
    display: block;
    color: inherit;
    text-decoration: none;
}

.entry__link:hover .entry__title {
    text-decoration: underline;
}

.entry__image {
    width: 100%;
    height: 12rem;
    object-fit: cover;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
}

.entry__date {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #a8a29e;
}

.entry__title {
    font-size: 1.375rem;
    font-weight: 600;
    margin: 0.25rem 0 0.5rem;
}

.entry__excerpt {
    margin: 0;
}

.entry__terms {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
}

.entry__terms li {
    font-size: 0.75rem;
    padding: 0.125rem 0.625rem;
    border-radius: 999px;
    background: #f5f5f4;
    color: #57534e;
}

.pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2.5rem;
}

.pagination__link {
    font-size: 0.875rem;
    color: #1c1917;
    text-decoration: none;
}

a.pagination__link:hover {
    text-decoration: underline;
}

.pagination__link--spent {
    color: #d6d3d1;
}

.pagination__link:focus-visible {
    outline: 2px solid #1c1917;
    outline-offset: 2px;
}

.pagination__position {
    margin: 0;
    font-size: 0.875rem;
    color: #78716c;
}
</style>
