<script setup lang="ts">
interface Props {
    author: Author
    to: string
    count?: number
}

const props = withDefaults(defineProps<Props>(), { count: undefined });

const id = useId();
const authorInitials = computed<string>(() => initials(props.author.name));
</script>

<template>
    <section
        :aria-labelledby="id"
        class="grid grid-cols-[3.5rem_1fr] gap-x-5 gap-y-3 border-t-2 border-huella-slate-900 pt-6 md:grid-cols-[4.5rem_1fr]"
    >
        <UAvatar
            :src="author.avatar?.url"
            :text="authorInitials"
            size="3xl"
            aria-hidden="true"
            class="size-14 md:size-18"
        />
        <div class="self-center">
            <p class="text-kicker">
                {{ $t("authorCard.kicker") }}
            </p>
            <h2
                :id
                class="mt-1 font-serif text-h3 text-highlighted"
            >
                {{ author.name }}
            </h2>
        </div>
        <div class="col-span-2 md:col-span-1 md:col-start-2">
            <p
                v-if="author.bio"
                class="font-serif text-base leading-relaxed text-toned"
            >
                {{ author.bio }}
            </p>
            <UButton
                variant="link"
                :label="count === undefined ? $t('authorCard.profile') : $t('authorCard.profileCount', { count }, count)"
                trailing-icon="i-lucide-arrow-right"
                :to
                class="mt-2 -ml-3 print:hidden"
            />
        </div>
    </section>
</template>
