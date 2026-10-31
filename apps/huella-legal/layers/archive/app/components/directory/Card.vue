<script setup lang="ts">
interface Props {
    author: Author;
    count: number;
}

const props = defineProps<Props>();

const authorInitials = computed<string>(() => initials(props.author.name));
</script>

<template>
    <UPageCard
        variant="outline"
        :description="author.bio"
        :to="{ name: 'author', params: { slug: author.slug } }"
        :ui="{ description: 'mt-4 line-clamp-3' }"
        class="group h-full"
    >
        <template #title>
            <span class="flex items-center gap-4">
                <UAvatar
                    :src="author.avatar?.url"
                    :text="authorInitials"
                    size="3xl"
                    aria-hidden="true"
                    class="size-14 shrink-0"
                />
                <h3
                    class="min-w-0 font-serif text-xl/snug font-normal text-balance decoration-huella-slate-300 underline-offset-[0.2em] group-hover:underline"
                >
                    {{ author.name }}
                </h3>
            </span>
        </template>
        <template #footer>
            <p
                class="flex items-center justify-between border-t border-muted pt-3 font-sans text-meta text-muted"
            >
                <span>{{ $t("directoryCard.count", { count }, count) }}</span>
                <UIcon
                    name="i-lucide-arrow-right"
                    class="size-4 text-dimmed transition-transform group-hover:translate-x-0.5"
                />
            </p>
        </template>
    </UPageCard>
</template>
