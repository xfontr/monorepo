// Arrays of objects, not Buffers or repeat() strings: both of those are invisible to heapUsed,
// so a heap graph would stay flat while the process actually grew. ~8k rows is roughly 1MB.
const ROWS_PER_MB = 8_000;

const leaked: object[][] = [];

export default defineEventHandler((event) => {
    const { mb, reset } = getQuery(event);

    if (reset) {
        leaked.length = 0;
        global.gc?.();
    }
    else {
        const chunks = Math.min(Number(mb) || 10, 500);

        for (let index = 0; index < chunks; index += 1) {
            leaked.push(Array.from({ length: ROWS_PER_MB }, (_, row) => ({ row, chunk: index, label: `leak ${row}` })));
        }
    }

    const { heapUsed, heapTotal, rss } = process.memoryUsage();

    return {
        leakedMb: leaked.length,
        heapUsedMb: Math.round(heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(heapTotal / 1024 / 1024),
        rssMb: Math.round(rss / 1024 / 1024),
    };
});
