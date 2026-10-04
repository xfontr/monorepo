<script setup lang="ts">
definePageMeta({ name: "category", path: "/materias/:slug/" });

throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
</script>
