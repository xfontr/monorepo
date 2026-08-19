<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

const PER_PAGE = 6;

const { listEntries } = useContent();
const { locale } = useI18n();
const route = useRoute();

// Not validated here: the BFF already bounds `page` and answers anything out of range with a 400,
// and a second copy of those bounds is a second place for them to drift
const page = computed(() => Number(route.query.page ?? 1));

const { data, error, status } = await useAsyncData(
    () => `articles:${page.value}`,
    () => listEntries("posts", { page: page.value, perPage: PER_PAGE }),
    { watch: [page] },
);

function raiseIfMissing(): void {
    if (!error.value) return;

    // A malformed page and a page past the end both arrive as a 400. Either way the URL asks for a
    // page that does not exist, and the BFF's complaint about a query parameter is not something a
    // reader should be shown.
    if (error.value.statusCode === 400) {
        showError({ statusCode: 404, statusMessage: "Page not found", fatal: true });

        return;
    }

    showError({
        statusCode: error.value.statusCode ?? 502,
        statusMessage: error.value.statusMessage ?? error.value.message,
        fatal: true,
    });
}

raiseIfMissing();

// Watched as well as called: paging only changes the query, so setup never runs a second time
watch(error, raiseIfMissing);

// Nuxt's default scrollBehavior stays put when only the query changes
watch(page, () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Page one keeps the bare /articles URL, so the list has a single canonical address
function pageLink(target: number): RouteLocationRaw {
    return { query: target > 1 ? { page: target } : {} };
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString(locale.value, { dateStyle: "long" });
}
</script>

<template>
    <main
        class="articles"
        :aria-busy="status === 'pending'"
    >
        <h1>Articles</h1>

        <!-- Only while there is nothing to show: past the first page the previous one stays up, dimmed -->
        <p
            v-if="status === 'pending' && !data"
            class="notice"
        >
            Loading…
        </p>

        <template v-else-if="data">
            <p class="count">
                {{ data.items.length }} of {{ data.total }}
            </p>

            <article
                v-for="entry in data.items"
                :key="entry.id"
                class="entry"
            >
                <NuxtLink
                    class="entry__link"
                    :to="`/articles/${entry.slug}`"
                >
                    <img
                        v-if="entry.image"
                        class="entry__image"
                        :src="entry.image.url"
                        :alt="entry.image.alt"
                    >

                    <time
                        v-if="entry.publishedAt"
                        class="entry__date"
                        :datetime="entry.publishedAt"
                    >
                        {{ formatDate(entry.publishedAt) }}
                    </time>

                    <!-- WordPress returns rendered HTML, entities and all, for every text field -->
                    <h2
                        class="entry__title"
                        v-html="entry.title"
                    />
                </NuxtLink>

                <div
                    v-if="entry.excerpt"
                    class="entry__excerpt"
                    v-html="entry.excerpt.value"
                />

                <ul
                    v-if="entry.terms.length"
                    class="entry__terms"
                >
                    <li
                        v-for="term in entry.terms"
                        :key="term.id"
                    >
                        {{ term.name }}
                    </li>
                </ul>
            </article>

            <nav
                v-if="data.totalPages > 1"
                class="pagination"
                aria-label="Article pages"
            >
                <!-- aria-current-value, because these links only differ from the current URL by
                     their query and vue-router matches on the path: left alone, every one of them
                     announces itself as the page you are already on -->
                <NuxtLink
                    v-if="data.page > 1"
                    aria-current-value="false"
                    class="pagination__link"
                    rel="prev"
                    :to="pageLink(data.page - 1)"
                >
                    ← Previous
                </NuxtLink>

                <!-- A span, not a disabled link: there is no previous page to point at, and an
                     anchor without a destination is still announced and focused as a control -->
                <span
                    v-else
                    class="pagination__link pagination__link--spent"
                >
                    ← Previous
                </span>

                <p class="pagination__position">
                    Page {{ data.page }} of {{ data.totalPages }}
                </p>

                <NuxtLink
                    v-if="data.page < data.totalPages"
                    aria-current-value="false"
                    class="pagination__link"
                    rel="next"
                    :to="pageLink(data.page + 1)"
                >
                    Next →
                </NuxtLink>

                <span
                    v-else
                    class="pagination__link pagination__link--spent"
                >
                    Next →
                </span>
            </nav>
        </template>
    </main>
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

.entry__excerpt :deep(p) {
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
