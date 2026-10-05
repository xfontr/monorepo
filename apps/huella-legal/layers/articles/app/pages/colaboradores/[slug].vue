<script setup lang="ts">
definePageMeta({ name: "author", path: "/colaboradores/:slug/" });

throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
</script>
