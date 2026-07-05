<script lang="ts" setup>
import useUserStore from "~~/layers/user/app/stores/user";

const userStore = useUserStore();
</script>

<template>
    <p>{{ userStore.user?.email }}</p>
    <p>{{ $t("shared.health") }}</p>
    <p>{{ $t("meta.title") }}</p>
</template>
