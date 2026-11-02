export const TRACKERS = {
    googleAnalytics: {
        category: "analytics",
        cookies: [/^_ga/],
        load: (id, trigger) => {
            useScriptGoogleAnalytics({ id, scriptOptions: { trigger } });
        },
    },
} as const satisfies Record<string, Tracker>;

export type TrackerKey = keyof typeof TRACKERS;
