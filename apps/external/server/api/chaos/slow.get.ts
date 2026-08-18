export default defineEventHandler(async (event) => {
    const { ms } = getQuery(event);
    const delay = Math.min(Number(ms) || 3000, 30_000);

    await new Promise((resolve) => setTimeout(resolve, delay));

    return { slept: delay };
});
