<script setup lang="ts">
interface Props {
    article: Pick<Article, "id">;
    comments?: ArticleComments;
}

const props = defineProps<Props>();

const SORTABLE_FROM = 5;

const { t } = useI18n();

const replyTo = ref<ReaderComment>();
const sort = ref<"newest" | "oldest">("oldest");

const sortable = computed<boolean>(() => (props.comments?.threads.length ?? 0) >= SORTABLE_FROM);
const sortCopy = computed(() => ({
    label: t("commentsSection.sort.label"),
    newest: t("commentsSection.sort.newest"),
    oldest: t("commentsSection.sort.oldest"),
}));

const threads = computed<CommentThread[]>(() => {
    const oldestFirst = props.comments?.threads ?? [];
    return sort.value === "newest" ? oldestFirst.toReversed() : oldestFirst;
});

const open = computed<boolean>(() => props.comments?.open !== false);
</script>

<template>
    <section
        id="comentarios"
        aria-labelledby="comentarios-titulo"
        class="flex max-w-measure flex-col gap-8 border-t-2 border-huella-slate-900 pt-6 print:hidden"
    >
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 id="comentarios-titulo" class="font-serif text-h3 text-highlighted">
                {{ $t("commentsSection.title", { count: comments?.count }, comments?.count ?? 0) }}
            </h2>
            <ListingSortSelect v-if="sortable" v-model="sort" :copy="sortCopy" />
        </div>

        <ol v-if="threads.length" class="flex flex-col gap-8">
            <li v-for="thread in threads" :key="thread.id">
                <CommentThread :thread :replyable="open" @reply="replyTo = $event" />
            </li>
        </ol>

        <p v-else-if="comments && open" class="font-serif text-base text-toned">
            {{ $t("commentsSection.empty") }}
        </p>

        <div v-if="open" class="flex flex-col gap-4">
            <h3 class="font-serif text-card text-highlighted">
                {{ $t("commentsSection.formTitle") }}
            </h3>
            <CommentForm :post-id="article.id" :reply-to @cancel-reply="replyTo = undefined" />
        </div>

        <p v-else class="font-sans text-meta text-muted">
            {{ $t("commentsSection.closed") }}
        </p>
    </section>
</template>
