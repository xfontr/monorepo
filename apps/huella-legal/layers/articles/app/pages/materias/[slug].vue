<script setup lang="ts">
definePageMeta({ name: "category", path: "/materias/:slug/" });

throw createError({ status: 404, statusText: "Page not found", fatal: true });
</script>
