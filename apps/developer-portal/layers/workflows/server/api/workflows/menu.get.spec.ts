import { beforeEach, describe, expect, it, vi } from "vitest";

const workflows = vi.hoisted(() => ({ loadWorkflows: vi.fn() }));
const h3 = vi.hoisted(() => ({ defineEventHandler: (handler: unknown) => handler }));

vi.mock("../../utils/workflows.ts", () => workflows);
vi.mock("h3", () => h3);

import handler from "./menu.get.ts";

const view = (id: string, percent: number, syncedAt: string | null) => ({
    project: { id, title: `Project ${id}` },
    progress: { percent },
    syncedAt,
});

const NEW = { label: "New project", icon: "i-lucide-plus", to: "/workflows/new" };

beforeEach(() => {
    vi.clearAllMocks();
});

describe("workflows menu route", () => {
    it("lists unfinished projects by last sync, then the way to start one", async () => {
        workflows.loadWorkflows.mockResolvedValue({
            projects: [
                view("old", 40, "2026-10-01T00:00:00Z"),
                view("done", 100, "2026-11-10T00:00:00Z"),
                view("never", 0, null),
                view("fresh", 10, "2026-11-11T00:00:00Z"),
            ],
        });

        await expect(handler({} as never)).resolves.toEqual([
            { label: "Project fresh", to: "/workflows/fresh" },
            { label: "Project old", to: "/workflows/old" },
            { label: "Project never", to: "/workflows/never" },
            NEW,
        ]);
    });

    it("still offers a new project when there are none", async () => {
        workflows.loadWorkflows.mockResolvedValue({ projects: [] });

        await expect(handler({} as never)).resolves.toEqual([NEW]);
    });
});
