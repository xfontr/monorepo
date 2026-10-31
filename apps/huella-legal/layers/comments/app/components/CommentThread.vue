<script setup lang="ts">
interface Props {
    thread: CommentThread;
    replyable?: boolean;
}

defineProps<Props>();

defineEmits<{ reply: [comment: ReaderComment] }>();
</script>

<template>
    <div class="flex flex-col gap-6">
        <CommentItem :comment="thread" :replyable @reply="$emit('reply', $event)" />
        <ol
            v-if="thread.replies.length"
            class="ml-4 flex flex-col gap-6 border-l border-default pl-4 md:ml-[1.125rem] md:pl-6"
        >
            <li v-for="reply in thread.replies" :key="reply.id">
                <CommentItem :comment="reply" :replyable @reply="$emit('reply', $event)" />
            </li>
        </ol>
    </div>
</template>
