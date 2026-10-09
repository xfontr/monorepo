<script setup lang="ts">
definePageMeta({ name: "author", path: "/colaboradores/:slug/" });

throw createError({ status: 404, statusText: "Page not found", fatal: true });
</script>
