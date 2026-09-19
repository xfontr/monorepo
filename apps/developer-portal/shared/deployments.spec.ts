import { describe, expect, it } from "vitest";
import { deploymentsApiUrl, latestDeployments } from "./deployments.ts";

describe("deploymentsApiUrl", () => {
    it("derives the REST deployments endpoint without keeping a vendor URL in config", () => {
        expect(deploymentsApiUrl("https://github.com/xfontr/monorepo"))
            .toBe("https://api.github.com/repos/xfontr/monorepo/deployments");
    });

    it("does not create an endpoint from an unset or malformed repository URL", () => {
        expect(deploymentsApiUrl("")).toBeNull();
    });
});

describe("latestDeployments", () => {
    it("keeps the newest deployment for an environment instead of replacing it with stale status", () => {
        const deployments = [
            { id: 2, environment: "production" },
            { id: 1, environment: "production" },
            { id: 3, environment: "preview" },
        ];
        const statuses = new Map([
            [2, [{ state: "success" as const, environment_url: "https://prod.example", created_at: "2026-09-19T12:00:00Z" }]],
            [1, [{ state: "failure" as const, environment_url: null, created_at: "2026-09-18T12:00:00Z" }]],
            [3, [{ state: "in_progress" as const, environment_url: null, created_at: "2026-09-19T13:00:00Z" }]],
        ]);

        expect(latestDeployments(deployments, statuses)).toEqual([
            { environment: "preview", state: "in_progress", url: null, updatedAt: "2026-09-19T13:00:00Z" },
            { environment: "production", state: "success", url: "https://prod.example", updatedAt: "2026-09-19T12:00:00Z" },
        ]);
    });
});
