import type { Workflows } from "#layers/workflows/shared/workflows.ts";

const NONE: Workflows = { templates: [], projects: [], problems: [] };

/** Baked at build like every server route here; under `nuxt dev` it re-reads `docs/workflows` on refresh. */
export const useWorkflows = () =>
    useFetch<Workflows>("/api/workflows", { key: "workflows", default: () => NONE });

/** Only `nuxt dev` has a server to write through, so the static build never shows a control that can't work. */
export const useWorkflowEdit = () => {
    const { refresh } = useWorkflows();
    const toast = useToast();

    const editable = import.meta.dev;

    const edit = async (body: Record<string, unknown>): Promise<boolean> => {
        try {
            await $fetch("/api/workflows/edit", { method: "POST", body });
            await refresh();
            return true;
        } catch (cause) {
            const message =
                (cause as { statusMessage?: string } | null)?.statusMessage ?? "The edit failed";
            toast.add({ title: message, color: "error", icon: "i-lucide-triangle-alert" });
            return false;
        }
    };

    return { editable, edit };
};
