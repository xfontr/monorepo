import type { ItemKey, Proposal } from "../../../../../shared/types.ts";
import { review } from "../../../../services/operations.ts";

export default defineEventHandler((event) =>
    refusing(async () =>
        review.edit(
            useStore(event),
            getRouterParam(event, "id")!,
            getRouterParam(event, "key") as ItemKey,
            await readBody<Partial<Proposal> | null>(event),
        ),
    ),
);
