import { bulkApply } from "../../../services/operations.ts";

export default defineEventHandler((event) =>
    refusing(() => bulkApply(useStore(event), useWordPress(event), getRouterParam(event, "id")!)),
);
