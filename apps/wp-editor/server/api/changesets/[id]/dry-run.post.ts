import { bulkDryRun } from "../../../services/operations.ts";

export default defineEventHandler((event) =>
    refusing(() => bulkDryRun(useStore(event), useWordPress(event), getRouterParam(event, "id")!)),
);
