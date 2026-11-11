import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkflowEdit } from "./useWorkflows.ts";

const state = vi.hoisted(() => ({
    fetch: vi.fn(),
    refresh: vi.fn(),
    toast: vi.fn(),
}));
mockNuxtImport("$fetch", () => state.fetch);
mockNuxtImport("refreshNuxtData", () => state.refresh);
mockNuxtImport("useToast", () => () => ({ add: state.toast }));

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("$fetch", state.fetch);
});

afterEach(() => vi.unstubAllGlobals());

describe("useWorkflowEdit", () => {
    it("shows the server's reason when it refuses an edit, so a refusal is never silent", async () => {
        state.fetch.mockRejectedValue({
            statusMessage: "the ticket size is fixed once a ticket is filed",
        });

        await expect(useWorkflowEdit().edit({ action: "settings" })).resolves.toBe(false);
        expect(state.toast).toHaveBeenCalledWith(
            expect.objectContaining({ title: "the ticket size is fixed once a ticket is filed" }),
        );
        expect(state.refresh).not.toHaveBeenCalled();
    });

    it("reloads the workflows after a saved edit, so the page shows what was written", async () => {
        state.fetch.mockResolvedValue({ ok: true });

        await expect(useWorkflowEdit().edit({ action: "settings" })).resolves.toBe(true);
        expect(state.refresh).toHaveBeenCalledWith("workflows");
        expect(state.toast).not.toHaveBeenCalled();
    });
});
