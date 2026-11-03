import { derivedStatus, isApplied, isPending } from "../../shared/rules.ts";

export default defineEventHandler((event) =>
    refusing(async () => {
        const store = useStore(event);

        return Promise.all(
            (await store.listChangesets()).reverse().map(async (changeset) => {
                const items = await store.readItems(changeset.id);

                return {
                    ...changeset,
                    status: derivedStatus(changeset, items),
                    counts: {
                        articles: changeset.keys.length,
                        scanned: changeset.scanned.length,
                        proposals: items.filter(({ proposal }) => proposal).length,
                        pending: items.filter(isPending).length,
                        applied: items.filter(isApplied).length,
                        rejected: items.filter(({ state }) => state.rejected).length,
                    },
                };
            }),
        );
    }),
);
