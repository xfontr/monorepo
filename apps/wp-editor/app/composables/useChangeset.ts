import type { Changeset, Item, ItemKey, Proposal, RunReport, Settings } from "#shared/types.ts";

export interface ChangesetView {
    changeset: Changeset;
    items: Item[];
    settings: Settings;
    runs: RunReport[];
    bulkBlocker: string | null;
}

export type ItemAction =
    | "seen"
    | "confirm"
    | "unconfirm"
    | "reject"
    | "unreject"
    | "apply"
    | "dry-run"
    | "restore"
    | "repull";

/** The refusal text a server rule put in the 409, falling back to the transport error. */
export const messageOf = (error: unknown): string =>
    (error as { data?: { message?: string } }).data?.message ?? (error as Error).message;

export const useChangeset = (id: string) => {
    const toast = useToast();
    const busy = ref<string | null>(null);
    const request = useFetch<ChangesetView>(`/api/changesets/${id}`, { key: `changeset-${id}` });
    const base = `/api/changesets/${id}`;
    // A plain string path: Nitro's typed-route inference over these templates exceeds tsc's depth.
    const call = <T>(path: string, options: { method: "POST" | "PUT"; body?: Proposal }) =>
        $fetch<T>(`${base}${path}`, options);

    /** Runs a write, reports a refusal as a toast, and refreshes the view either way. */
    const run = async <T>(
        label: string,
        write: () => Promise<T>,
        quiet = false,
    ): Promise<T | null> => {
        busy.value = label;

        try {
            const result = await write();

            if (!quiet) toast.add({ title: label, color: "success", icon: "i-lucide-check" });

            return result;
        } catch (error) {
            toast.add({ title: `${label} refused`, description: messageOf(error), color: "error" });

            return null;
        } finally {
            busy.value = null;
            await request.refresh();
        }
    };

    return {
        ...request,
        busy,
        act: (key: ItemKey, action: ItemAction, quiet = false) =>
            run(
                `${action[0]!.toUpperCase()}${action.slice(1)} ${key}`,
                () => call(`/items/${key}/${action}`, { method: "POST" }),
                quiet,
            ),
        save: (key: ItemKey, proposal: Proposal) =>
            run(`Saved ${key}`, () => call(`/items/${key}`, { method: "PUT", body: proposal })),
        /** Resolves once the view is refreshed, so the new report is `runs[0]`. */
        bulk: (kind: RunReport["kind"]) =>
            run(
                kind === "apply" ? "Bulk apply" : "Dry run",
                () => call<RunReport>(kind === "apply" ? "/apply" : "/dry-run", { method: "POST" }),
                true,
            ),
    };
};
