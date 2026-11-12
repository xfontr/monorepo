import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocPage } from "#layers/snapshot/shared/types.ts";

const store = vi.hoisted(() => ({ readArtifact: vi.fn() }));
const h3 = vi.hoisted(() => ({ defineEventHandler: (handler: unknown) => handler }));

vi.mock("#layers/snapshot/server/utils/store.ts", () => store);
vi.mock("h3", () => h3);

import handler from "./menu.get.ts";

const page = (number: string, status: DocPage["decisionStatus"]): DocPage => ({
    path: `docs/decisions/${number}-a-decision.md`,
    kind: "decision",
    title: `🔬 Decision ${number}`,
    words: 100,
    updatedAt: null,
    decisionStatus: status,
    decisionOutcome: "accepted",
    decisionSupersededBy: null,
    audit: null,
    brokenLinks: [],
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe("decisions menu route", () => {
    it("lists only the decisions still to implement, newest first", async () => {
        store.readArtifact.mockResolvedValue({
            pages: [
                page("0003", "to-implement"),
                page("0007", "implemented"),
                page("0012", "to-implement"),
                page("0020", "wont-implement"),
            ],
        });

        await expect(handler({} as never)).resolves.toEqual([
            { label: "0012 Decision 0012", to: "/decisions/0012-a-decision" },
            { label: "0003 Decision 0003", to: "/decisions/0003-a-decision" },
        ]);
    });

    it("caps the list so a backlog can't push the rest of the sidebar off screen", async () => {
        store.readArtifact.mockResolvedValue({
            pages: Array.from({ length: 12 }, (_, index) =>
                page(String(index + 1).padStart(4, "0"), "to-implement"),
            ),
        });

        await expect(handler({} as never)).resolves.toHaveLength(8);
    });

    it("answers an empty menu when the docs were never collected", async () => {
        store.readArtifact.mockResolvedValue(null);

        await expect(handler({} as never)).resolves.toEqual([]);
    });
});
