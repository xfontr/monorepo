<script setup lang="ts">
interface Props {
    comment: ReaderComment;
    replyable?: boolean;
}

const props = defineProps<Props>();

defineEmits<{ reply: [comment: ReaderComment] }>();

const { t } = useI18n();

const author = computed<string>(() => props.comment.author || t("commentItem.anonymous"));
const authorInitials = computed<string>(() => initials(author.value));
const id = computed<string>(() => `comentario-${props.comment.id}`);
</script>

<template>
    <article :id :aria-labelledby="`${id}-autor`" class="grid grid-cols-[2.25rem_1fr] gap-x-3">
        <UAvatar :text="authorInitials" size="md" aria-hidden="true" class="mt-0.5" />
        <div class="flex min-w-0 flex-col gap-2">
            <p class="flex flex-wrap items-baseline gap-x-2 font-sans text-meta">
                <span :id="`${id}-autor`" class="font-semibold text-highlighted">
                    {{ author }}
                </span>
                <time :datetime="comment.publishedAt" class="text-muted">
                    {{ $d(comment.publishedAt, "long") }}
                </time>
            </p>
            <p v-if="comment.replyTo" class="font-sans text-meta text-muted">
                {{ $t("commentItem.replyTo", { author: comment.replyTo }) }}
            </p>
            <p
                v-for="(paragraph, index) in comment.paragraphs"
                :key="index"
                class="font-serif text-base leading-relaxed wrap-break-word text-toned"
            >
                {{ paragraph }}
            </p>
            <UButton
                v-if="replyable"
                variant="link"
                size="sm"
                icon="i-lucide-reply"
                :label="$t('commentItem.reply')"
                :aria-label="$t('commentItem.replyLabel', { author })"
                class="-ml-2.5 self-start print:hidden"
                @click="$emit('reply', comment)"
            />
        </div>
    </article>
</template>
