import { bulkRestore } from "../../../services/operations.ts";

export default defineEventHandler((event) =>
    refusing(() => bulkRestore(useStore(event), useWordPress(event), getRouterParam(event, "id")!)),
);
