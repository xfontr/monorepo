import { bulkApplyBlocker, bulkRestoreBlocker, derivedStatus } from "../../../shared/rules.ts";

export default defineEventHandler((event) =>
    refusing(async () => {
        const store = useStore(event);
        const id = getRouterParam(event, "id")!;
        const changeset = await store.readChangeset(id);

        if (!changeset) throw createError({ statusCode: 404, message: `No changeset ${id}.` });

        const items = await store.readItems(id);
        const settings = await store.readSettings();
        const runs = await store.listRuns(id);
        const lastDryRun = runs.find(({ kind }) => kind === "dry-run") ?? null;

        return {
            changeset: { ...changeset, status: derivedStatus(changeset, items) },
            items,
            settings,
            runs,
            bulkBlocker: bulkApplyBlocker(items, settings, lastDryRun),
            restoreBlocker: bulkRestoreBlocker(items, settings),
        };
    }),
);
