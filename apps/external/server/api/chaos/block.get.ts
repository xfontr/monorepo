export default defineEventHandler((event) => {
    const { ms } = getQuery(event);
    const duration = Math.min(Number(ms) || 3000, 30_000);

    // Synchronous on purpose: every other request queues behind this one.
    const start = Date.now();
    while (Date.now() - start < duration) { /* burn */ }

    return { blocked: duration };
});
