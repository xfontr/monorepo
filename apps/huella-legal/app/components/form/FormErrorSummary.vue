<script setup lang="ts">
interface FieldError {
    id: string
    label: string
    message: string
}

interface Props {
    errors: FieldError[]
}

defineProps<Props>();
</script>

<template>
    <UAlert
        v-if="errors.length"
        role="alert"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :title="$t('formErrorSummary.title', errors.length)"
    >
        <template #description>
            <ul class="list-disc pl-5">
                <li
                    v-for="{ id, label, message } in errors"
                    :key="id"
                >
                    <i18nT
                        keypath="formErrorSummary.item"
                        scope="global"
                    >
                        <template #field>
                            <a
                                :href="`#${id}`"
                                class="underline"
                            >{{ label }}</a>
                        </template>
                        <template #message>
                            {{ message }}
                        </template>
                    </i18nT>
                </li>
            </ul>
        </template>
    </UAlert>
</template>
