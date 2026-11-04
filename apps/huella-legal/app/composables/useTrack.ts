import type { AnalyticsEvent, AnalyticsEvents } from "~/types/AnalyticsEvent";

/** Raises an analytics event for whichever tracker listens; with none configured, nothing does. */
export const useTrack = () => {
    const { hooks } = useNuxtApp();

    return <Name extends keyof AnalyticsEvents>(name: Name, params: AnalyticsEvents[Name]) => {
        void hooks.callHook("analytics:event", { name, params } as AnalyticsEvent);
    };
};
