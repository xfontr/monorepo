/** The newest run while it is still saving progress, or null once it has finished. */
export default defineEventHandler((event) =>
    refusing(async () => {
        const [latest] = await useStore(event).listRuns(getRouterParam(event, "id")!);

        return latest?.incomplete ? latest : null;
    }),
);
