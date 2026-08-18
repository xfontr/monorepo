export default defineEventHandler((event) => {
    const { count } = getQuery(event);
    const lines = Math.min(Number(count) || 5, 500);
    const traceparent = getRequestHeader(event, "traceparent") ?? "none";

    for (let index = 0; index < lines; index += 1) {
        console.debug(`[chaos] debug line ${index} traceparent=${traceparent}`);
        console.info(`[chaos] info line ${index}`);
        console.warn(`[chaos] warn line ${index}`);
        console.error(`[chaos] error line ${index}`, new Error("chaos log error"));
    }

    return { emitted: lines * 4, traceparent };
});
