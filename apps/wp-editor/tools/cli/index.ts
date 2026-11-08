import { parseArgs } from "node:util";
import { derivedStatus } from "../../shared/rules.ts";
import { credentials, storePath } from "../lib/config.ts";
import { Refusal } from "../../shared/refusal.ts";
import type { Store } from "../../server/adapters/store.ts";
import { createStore } from "../../server/adapters/store.ts";
import { createWordPress } from "../../server/adapters/wordpress.ts";
import { markScanned, openChangeset, validate } from "../../server/services/operations.ts";
import { probe } from "./probe.ts";

// eslint-disable-next-line no-console -- this CLI's output is what Claude reads
const print = (line: string) => console.log(line);

const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
        instructions: { type: "string" },
        override: { type: "boolean" },
        ids: { type: "string" },
        limit: { type: "string" },
    },
});

const [command, ...rest] = positionals;

const openChangesetOf = async (store: Store) => {
    const open = (await store.listChangesets()).find(({ status }) => status === "open");

    if (!open) throw new Refusal("No open changeset; start one with `pnpm editor new`.");

    return open;
};

const commands: Record<string, () => Promise<void>> = {
    new: async () => {
        const title = rest[0];

        if (!title)
            throw new Refusal(
                'Usage: pnpm editor new "<title>" [--instructions=…] [--override] [--ids=posts-12,…]',
            );

        const changeset = await openChangeset(
            createStore(storePath()),
            createWordPress(credentials()),
            {
                title,
                instructions: values.instructions,
                override: values.override,
                ids: values.ids?.split(","),
            },
        );

        print(`Opened ${changeset.id} with ${changeset.keys.length} articles.`);
    },

    todo: async () => {
        const store = createStore(storePath());
        const { id, keys, scanned } = await openChangesetOf(store);
        const done = new Set(scanned);
        const todo = keys.filter((key) => !done.has(key)).slice(0, Number(values.limit ?? 15));

        print(`${id}: ${keys.length - done.size} left`);
        for (const key of todo) print(`${store.root}/changesets/${id}/base/${key}.html`);
    },

    scanned: async () => {
        const store = createStore(storePath());
        const { id } = await openChangesetOf(store);
        const { keys, scanned } = await markScanned(store, id, rest);

        print(`${scanned.length}/${keys.length} scanned.`);
    },

    validate: async () => {
        const store = createStore(storePath());
        const { id } = await openChangesetOf(store);
        const { removed, markerWarnings } = await validate(store, id);

        const keys = removed.length ? `: ${removed.join(", ")}` : "";

        print(`Removed ${removed.length} no-op proposals${keys}.`);
        for (const key of markerWarnings) print(`WARNING ${key}: block markers differ from base.`);
    },

    status: async () => {
        const store = createStore(storePath());

        const changesets = await store.listChangesets();
        const itemsOf = await Promise.all(changesets.map(({ id }) => store.readItems(id)));

        for (const [index, changeset] of changesets.entries()) {
            const items = itemsOf[index] ?? [];
            const count = (test: (state: (typeof items)[number]["state"]) => boolean) =>
                items.filter(({ state }) => test(state)).length;

            print(
                [
                    `${changeset.id} [${derivedStatus(changeset, items)}]`,
                    `scanned ${changeset.scanned.length}/${changeset.keys.length}`,
                    `proposals ${items.filter(({ proposal }) => proposal).length}`,
                    `review requested ${items.filter(({ proposal }) => proposal?.reviewRequested).length}`,
                    `unreviewed ${count((s) => s.level === "unreviewed")}`,
                    `seen ${count((s) => s.level === "seen")}`,
                    `confirmed ${count((s) => s.level === "confirmed")}`,
                    `rejected ${count((s) => !!s.rejected)}`,
                    `applied ${count((s) => !!s.applied && !s.restored)}`,
                ].join(" · "),
            );
        }
    },

    probe: () => probe(createWordPress(credentials()), print),
};

try {
    const run = commands[command ?? ""];

    if (!run) throw new Refusal(`Usage: pnpm editor <${Object.keys(commands).join("|")}>`);

    await run();
} catch (error) {
    if (!(error instanceof Refusal)) throw error;
    // eslint-disable-next-line no-console -- a refusal is reported on stderr
    console.error(error.message);
    process.exitCode = 1;
}
