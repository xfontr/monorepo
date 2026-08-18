export default defineEventHandler((event) => {
    const { code } = getQuery(event);

    throw createError({
        statusCode: Number(code) || 418,
        statusMessage: "Chaos error on request",
        data: { requested: code ?? null },
    });
});
