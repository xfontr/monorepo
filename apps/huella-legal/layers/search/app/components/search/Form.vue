<script setup lang="ts">
import { MAX_SEARCH_LENGTH } from "@monorepo/content";

interface Props {
    modelValue: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const draft = ref<string>(props.modelValue);

watch(
    () => props.modelValue,
    (value) => {
        draft.value = value;
    },
);

const action = useRouter().resolve({ name: "search" }).href;
</script>

<template>
    <UForm
        :state="{ query: draft }"
        :action
        method="get"
        role="search"
        class="flex flex-col gap-3 sm:flex-row sm:items-end"
        @submit="emit('update:modelValue', draft)"
    >
        <UFormField :label="$t('searchForm.label')" name="query" class="flex-1">
            <UInput
                v-model="draft"
                type="search"
                icon="i-lucide-search"
                :maxlength="MAX_SEARCH_LENGTH"
                class="w-full"
            />
        </UFormField>
        <UButton type="submit" :label="$t('searchForm.submit')" class="justify-center" />
    </UForm>
</template>
