export default defineEventHandler(async () => {
    try {
        await $fetch("http://chaos.not-a-real-host.invalid/nothing", { timeout: 5000 });
    }
    catch (cause) {
        throw createError({ statusCode: 502, statusMessage: "Upstream unreachable", cause });
    }

    return { unexpected: true };
});
