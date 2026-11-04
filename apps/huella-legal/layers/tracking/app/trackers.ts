export const TRACKERS = {
    googleAnalytics: {
        category: "analytics",
        cookies: [/^_ga/],
        load: (id, trigger) => {
            const { proxy } = useScriptGoogleAnalytics({ id, scriptOptions: { trigger } });

            return ({ name, params }) => proxy.gtag("event", name, params);
        },
    },
} as const satisfies Record<string, Tracker>;

export type TrackerKey = keyof typeof TRACKERS;
