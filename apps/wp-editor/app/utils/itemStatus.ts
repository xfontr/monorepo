import type { BadgeProps } from "@nuxt/ui";
import { isApplied, isPending, isReviewRequested } from "../../shared/rules.ts";
import type { Item } from "#shared/types.ts";

export const ITEM_FILTERS = [
    "all",
    "pending",
    "requested",
    "unreviewed",
    "seen",
    "confirmed",
    "applied",
    "rejected",
    "drift",
] as const;
export type ItemFilter = (typeof ITEM_FILTERS)[number];

type Reviewable = Pick<Item, "proposal" | "state">;

/** The one badge that best says where an item stands, most decisive state first. */
export const itemBadge = ({
    state,
    proposal,
}: Reviewable): { label: string; color: BadgeProps["color"] } => {
    if (state.drift) return { label: "drift", color: "warning" };
    if (state.applied && !state.restored) return { label: "applied", color: "primary" };
    if (state.rejected) return { label: "rejected", color: "error" };
    if (!proposal) return { label: "no change", color: "neutral" };

    const suffix = state.restored ? " · restored" : "";

    if (state.level === "confirmed") return { label: `confirmed${suffix}`, color: "success" };
    if (state.level === "seen") return { label: `seen${suffix}`, color: "info" };

    return { label: `unreviewed${suffix}`, color: "neutral" };
};

export const matchesFilter = (item: Reviewable, filter: ItemFilter): boolean => {
    const { state } = item;

    switch (filter) {
        case "all":
            return true;
        case "pending":
            return isPending(item);
        case "requested":
            return isPending(item) && isReviewRequested(item);
        case "applied":
            return isApplied(item);
        case "rejected":
            return !!state.rejected;
        case "drift":
            return !!state.drift;
        default:
            return isPending(item) && state.level === filter;
    }
};

export const formatDate = (iso: string): string =>
    iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "";
