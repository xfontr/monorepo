import { getDeployStore, type Store } from "@netlify/blobs";

interface Saved<T> {
    savedAt: number;
    value: T;
}

const warn = (action: string, name: string, key: string, error: unknown): void => {
    // eslint-disable-next-line no-console -- a failed read or save leaves no other trace
    console.warn(`[blobs] Could not ${action} ${name}/${key}`, error);
};

// A deploy store dies with its deploy, so a value saved by older code never reaches newer code
const openStore = (name: string): Store | undefined => {
    try {
        return getDeployStore(name);
    } catch (error) {
        // Off Netlify (dev, CI, e2e) there is no Blobs context, and nothing is saved
        if ((error as Error).name === "MissingBlobsEnvironmentError") return undefined;

        throw error;
    }
};

/** Reads what this deploy saved under `key` less than `maxAge` seconds ago, if anything. */
export const readSaved = async <T>(
    name: string,
    key: string,
    maxAge: number,
): Promise<T | undefined> => {
    const store = openStore(name);

    if (!store) return undefined;

    try {
        const saved = (await store.get(key, { type: "json" })) as Saved<T> | null;

        return saved && Date.now() - saved.savedAt < maxAge * 1000 ? saved.value : undefined;
    } catch (error) {
        warn("read", name, key, error);

        return undefined;
    }
};

/** Saves `value` under `key` for this deploy, resolving once it is written. */
export const save = async (name: string, key: string, value: unknown): Promise<void> => {
    const store = openStore(name);

    if (!store) return;

    try {
        await store.setJSON(key, { savedAt: Date.now(), value } satisfies Saved<unknown>);
    } catch (error) {
        warn("save", name, key, error);
    }
};
