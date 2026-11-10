import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ readArtifact: vi.fn() }));
const h3 = vi.hoisted(() => ({ defineEventHandler: (handler: unknown) => handler }));

vi.mock("../utils/store.ts", () => store);
vi.mock("h3", () => h3);

import handler from "./badges.get.ts";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("badges route", () => {
    it("counts advisories from the dependency artifact", async () => {
        store.readArtifact.mockResolvedValue({ advisories: [{ id: 1 }, { id: 2 }] });

        await expect(handler({} as never)).resolves.toEqual({ advisories: 2 });
        expect(store.readArtifact).toHaveBeenCalledExactlyOnceWith("deps");
    });

    it("returns zero when dependency data is missing", async () => {
        store.readArtifact.mockResolvedValue(null);

        await expect(handler({} as never)).resolves.toEqual({ advisories: 0 });
        expect(store.readArtifact).toHaveBeenCalledExactlyOnceWith("deps");
    });
});
