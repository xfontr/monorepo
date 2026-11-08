import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isMainThread } from "node:worker_threads";
import type {
    BaseMeta,
    Changeset,
    Item,
    ItemKey,
    ItemState,
    Proposal,
    RunReport,
    Settings,
    Snapshot,
} from "../../shared/types.ts";
import { DEFAULT_SETTINGS, parseKey } from "../../shared/types.ts";
import { Refusal } from "../../shared/refusal.ts";

const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value === null || typeof value !== "object") return value;

    return Object.fromEntries(
        Object.entries(value)
            .filter(([, entry]) => entry !== undefined)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, sortKeys(entry)]),
    );
};

/** Stable formatting, so the store diffs cleanly when it is a git repo. */
export const stableJson = (value: unknown): string =>
    `${JSON.stringify(sortKeys(value), null, 2)}\n`;

const readText = async (path: string): Promise<string | null> => {
    try {
        return await readFile(path, "utf8");
    } catch {
        return null;
    }
};

const readJson = async <T>(path: string): Promise<T | null> => {
    const text = await readText(path);

    return text === null ? null : (JSON.parse(text) as T);
};

const write = async (path: string, text: string): Promise<void> => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text, "utf8");
};

// Ids and keys arrive as route params, so anything else could walk out of the store.
const CHANGESET_ID = /^[\w-]+$/;

export type Store = ReturnType<typeof createStore>;

export const createStore = (root: string) => {
    const changesetDir = (id: string) => {
        if (!CHANGESET_ID.test(id)) throw new Refusal(`"${id}" is not a changeset id.`);

        return join(root, "changesets", id);
    };
    const file = (id: string, kind: "base" | "proposed" | "state", key: ItemKey, ext: string) => {
        if (!parseKey(key)) throw new Refusal(`"${key}" is not a <posts|pages>-<id> key.`);

        return join(changesetDir(id), kind, `${key}.${ext}`);
    };

    const readProposal = async (id: string, key: ItemKey): Promise<Proposal | null> => {
        const content = await readText(file(id, "proposed", key, "html"));

        if (content === null) return null;

        return {
            content,
            ...(await readJson<Omit<Proposal, "content">>(file(id, "proposed", key, "json"))),
        };
    };

    const readItem = async (id: string, key: ItemKey): Promise<Item | undefined> => {
        const content = await readText(file(id, "base", key, "html"));
        const meta = await readJson<BaseMeta>(file(id, "base", key, "json"));

        if (content === null || meta === null) return undefined;

        return {
            key,
            base: { ...meta, content },
            proposal: await readProposal(id, key),
            state: (await readJson<ItemState>(file(id, "state", key, "json"))) ?? {
                level: "unreviewed",
            },
        };
    };

    return {
        root,

        readSettings: async (): Promise<Settings> => ({
            ...DEFAULT_SETTINGS,
            ...(await readJson<Partial<Settings>>(join(root, "settings.json"))),
        }),

        writeSettings: (settings: Settings) =>
            write(join(root, "settings.json"), stableJson(settings)),

        listChangesets: async (): Promise<Changeset[]> => {
            const ids = await readdir(join(root, "changesets")).catch(() => []);
            const all = await Promise.all(
                ids
                    .filter((id) => CHANGESET_ID.test(id))
                    .sort()
                    .map((id) => readJson<Changeset>(join(changesetDir(id), "changeset.json"))),
            );

            return all.filter((changeset) => changeset !== null);
        },

        readChangeset: (id: string) =>
            readJson<Changeset>(join(changesetDir(id), "changeset.json")),

        writeChangeset: (changeset: Changeset) =>
            write(join(changesetDir(changeset.id), "changeset.json"), stableJson(changeset)),

        writeBase: async (id: string, key: ItemKey, { content, ...meta }: Snapshot & BaseMeta) => {
            await write(file(id, "base", key, "html"), content);
            await write(file(id, "base", key, "json"), stableJson(meta));
        },

        writeProposal: async (id: string, key: ItemKey, proposal: Proposal | null) => {
            const html = file(id, "proposed", key, "html");
            const json = file(id, "proposed", key, "json");

            if (proposal === null) {
                await rm(html, { force: true });
                await rm(json, { force: true });
                return;
            }

            const { content, ...fields } = proposal;

            await write(html, content);

            if (Object.values(fields).some((value) => value !== undefined)) {
                await write(json, stableJson(fields));
            } else await rm(json, { force: true });
        },

        writeState: (id: string, key: ItemKey, state: ItemState) =>
            write(file(id, "state", key, "json"), stableJson(state)),

        writeRun: (id: string, report: RunReport) =>
            write(
                join(
                    changesetDir(id),
                    "runs",
                    `${report.at.replace(/[:.]/g, "-")}-${report.kind}.json`,
                ),
                stableJson(report),
            ),

        /** Newest first. */
        listRuns: async (id: string): Promise<RunReport[]> => {
            const dir = join(changesetDir(id), "runs");
            const names = (await readdir(dir).catch(() => [])).filter((name) =>
                name.endsWith(".json"),
            );
            const runs = await Promise.all(
                names
                    .sort()
                    .reverse()
                    .map((name) => readJson<RunReport>(join(dir, name))),
            );

            return runs.filter((run) => run !== null);
        },

        readItem,

        /** Every item with a proposal or a recorded state; keys Claude left unchanged are skipped. */
        readItems: async (id: string): Promise<Item[]> => {
            const names = async (kind: "proposed" | "state") =>
                (await readdir(join(changesetDir(id), kind)).catch(() => [])).filter((name) =>
                    name.endsWith(kind === "proposed" ? ".html" : ".json"),
                );
            const keys = new Set(
                [...(await names("proposed")), ...(await names("state"))].map(
                    (name) => name.replace(/\.(html|json)$/, "") as ItemKey,
                ),
            );
            const items = await Promise.all(
                [...keys].sort((a, b) => a.localeCompare(b)).map((key) => readItem(id, key)),
            );

            return items.filter((item) => item !== undefined);
        },
    };
};

const isAlive = (pid: number): boolean => {
    try {
        process.kill(pid, 0);

        return true;
    } catch (error) {
        return (error as NodeJS.ErrnoException).code === "EPERM";
    }
};

const readHolder = (path: string): { pid: number; startedAt: string } | null => {
    try {
        return JSON.parse(readFileSync(path, "utf8")) as { pid: number; startedAt: string };
    } catch {
        return null;
    }
};

/** Claims `root` for this process, refusing while another live process holds it. */
export const lockStore = (root: string): void => {
    const path = join(root, ".server.lock");

    mkdirSync(root, { recursive: true });

    for (;;) {
        try {
            writeFileSync(
                path,
                stableJson({ pid: process.pid, startedAt: new Date().toISOString() }),
                { flag: "wx" },
            );
            // Nuxt dev reloads Nitro in a worker of the same process, so only the process may release.
            if (isMainThread) process.once("exit", () => rmSync(path, { force: true }));

            return;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        }

        const holder = readHolder(path);

        if (holder?.pid === process.pid) return;
        if (holder && isAlive(holder.pid)) {
            throw new Refusal(
                `Another server (pid ${holder.pid}, started ${holder.startedAt}) is using ` +
                    `${root}; stop it first, or delete ${path} if it is gone.`,
            );
        }

        rmSync(path, { force: true });
    }
};
