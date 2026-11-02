import { parseSettings } from "../../shared/rules.ts";

export default defineEventHandler((event) =>
    refusing(async () => {
        const store = useStore(event);
        const settings = parseSettings(await readBody(event), await store.readSettings());

        await store.writeSettings(settings);

        return settings;
    }),
);
