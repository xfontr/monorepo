<script setup lang="ts">
const { getEntry } = useContent();
const { locale } = useI18n();
const route = useRoute();

const slug = computed(() => String(route.params.slug));

const { data: entry, error, status } = await useAsyncData(
    () => `article:${slug.value}`,
    () => getEntry("posts", slug.value),
    { watch: [slug] },
);

// The BFF answers a miss with a real 404, so hand it to error.vue instead of printing it inline
if (error.value) {
    throw createError({
        statusCode: error.value.statusCode ?? 502,
        statusMessage: error.value.statusMessage ?? error.value.message,
        fatal: true,
    });
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString(locale.value, { dateStyle: "long" });
}
</script>

<template>
    <main class="article">
        <NuxtLink
            class="back"
            to="/articles"
        >
            ← Articles
        </NuxtLink>

        <p
            v-if="status === 'pending'"
            class="notice"
        >
            Loading…
        </p>

        <template v-else-if="entry">
            <time
                v-if="entry.publishedAt"
                class="date"
                :datetime="entry.publishedAt"
            >
                {{ formatDate(entry.publishedAt) }}
            </time>

            <!-- WordPress returns rendered HTML, entities and all, for every text field -->
            <h1
                class="title"
                v-html="entry.title"
            />

            <ul
                v-if="entry.terms.length"
                class="terms"
            >
                <li
                    v-for="term in entry.terms"
                    :key="term.id"
                >
                    {{ term.name }}
                </li>
            </ul>

            <img
                v-if="entry.image"
                class="image"
                :src="entry.image.url"
                :alt="entry.image.alt"
            >

            <div
                class="body"
                v-html="entry.body.value"
            />
        </template>
    </main>
</template>

<style scoped>
.article {
    max-width: 42rem;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
    font-family: system-ui, sans-serif;
    line-height: 1.7;
    color: #1c1917;
}

.back {
    display: inline-block;
    margin-bottom: 2rem;
    font-size: 0.875rem;
    color: #78716c;
    text-decoration: none;
}

.back:hover {
    text-decoration: underline;
}

.notice {
    color: #78716c;
    font-size: 0.875rem;
}

.date {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #a8a29e;
}

.title {
    font-size: 2rem;
    font-weight: 900;
    line-height: 1.2;
    margin: 0.5rem 0 1rem;
}

.terms {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0 0 2rem;
}

.terms li {
    font-size: 0.75rem;
    padding: 0.125rem 0.625rem;
    border-radius: 999px;
    background: #f5f5f4;
    color: #57534e;
}

.image {
    width: 100%;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
}

/* :deep, because everything below is WordPress's own markup, not ours */
.body :deep(p) {
    margin: 0 0 1.25rem;
}

.body :deep(h2),
.body :deep(h3) {
    font-weight: 600;
    line-height: 1.3;
    margin: 2rem 0 0.75rem;
}

.body :deep(a) {
    color: #1d4ed8;
}

.body :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
}

.body :deep(blockquote) {
    margin: 1.5rem 0;
    padding-left: 1rem;
    border-left: 3px solid #e7e5e4;
    color: #57534e;
}

.body :deep(figure) {
    margin: 1.5rem 0;
}

.body :deep(ol),
.body :deep(ul) {
    padding-left: 1.25rem;
}
</style>
