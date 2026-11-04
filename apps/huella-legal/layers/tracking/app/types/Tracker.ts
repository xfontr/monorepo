import type { AnalyticsEvent } from "~/types/AnalyticsEvent";

export type ConsentCategory = "analytics";

export interface Tracker {
    category: ConsentCategory;
    cookies: RegExp[];
    load: (id: string, trigger: Promise<void>) => (event: AnalyticsEvent) => void;
}
