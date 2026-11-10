import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSnapshot } from "./useSnapshot.ts";

const state = vi.hoisted(() => ({ useFetch: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("useFetch", state.useFetch);
});

afterEach(() => vi.unstubAllGlobals());

describe("useSnapshot", () => {
    it("requests the artifact endpoint with a stable per-artifact key", () => {
        const result = { data: "snapshot" };
        state.useFetch.mockReturnValue(result);

        expect(useSnapshot("docs")).toBe(result);
        expect(state.useFetch).toHaveBeenCalledWith("/api/snapshot/docs", { key: "snapshot-docs" });
    });
});
