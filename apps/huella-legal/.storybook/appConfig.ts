export const defineAppConfig = <T>(config: T): T => config;

// Loaded after the export above is initialised, since each app.config imports it back from here
const configs = await Promise.all(
    Object.values(
        import.meta.glob<Record<string, unknown>>(
            ["../app/app.config.ts", "../layers/*/app/app.config.ts"],
            { import: "default" },
        ),
    ).map((load) => load()),
);

const appConfig = {
    ...Object.assign({}, ...configs),
    nav: Object.assign({}, ...configs.map(({ nav }) => nav)),
};

export const useAppConfig = () => appConfig;
