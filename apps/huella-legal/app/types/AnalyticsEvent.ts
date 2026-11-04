export interface AnalyticsEvents {
    toc_click: Record<string, never>;
    citation_copy: { style: string };
    share: { method: "native" | "copy_link" | "print" };
}

export type AnalyticsEvent = {
    [Name in keyof AnalyticsEvents]: { name: Name; params: AnalyticsEvents[Name] };
}[keyof AnalyticsEvents];

declare module "#app" {
    interface RuntimeNuxtHooks {
        "analytics:event": (event: AnalyticsEvent) => void;
    }
}
