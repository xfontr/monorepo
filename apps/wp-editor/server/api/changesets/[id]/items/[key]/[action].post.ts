import type { ItemKey } from "../../../../../../shared/types.ts";
import {
    applyItem,
    dryRunItem,
    repull,
    restoreItem,
    review,
} from "../../../../../services/operations.ts";

export default defineEventHandler((event) =>
    refusing(async () => {
        const store = useStore(event);
        const id = getRouterParam(event, "id")!;
        const key = getRouterParam(event, "key") as ItemKey;

        switch (getRouterParam(event, "action")) {
            case "seen":
                return review.seen(store, id, key);
            case "confirm":
                return review.confirm(store, id, key);
            case "unconfirm":
                return review.unconfirm(store, id, key);
            case "reject":
                return review.reject(store, id, key);
            case "unreject":
                return review.unreject(store, id, key);
            case "apply":
                return applyItem(store, useWordPress(event), id, key);
            case "dry-run":
                return dryRunItem(store, useWordPress(event), id, key);
            case "restore":
                return restoreItem(store, useWordPress(event), id, key);
            case "repull":
                return repull(store, useWordPress(event), id, key);
            default:
                throw createError({ statusCode: 404 });
        }
    }),
);
