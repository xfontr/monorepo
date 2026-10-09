import type { RouteLocationRaw } from "vue-router";

export interface LinkAction {
    label: string;
    to: RouteLocationRaw;
}
