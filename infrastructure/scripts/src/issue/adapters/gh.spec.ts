import { beforeEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => ({
    cached: vi.fn((_key: string, fetch: () => unknown) => fetch()),
    readCache: vi.fn(),
    writeCache: vi.fn(),
}));
const ghApi = vi.hoisted(() => ({ gh: vi.fn() }));

vi.mock("../../shared/adapters/cache.ts", () => cache);
vi.mock("../../shared/adapters/gh.ts", () => ghApi);

import {
    assignToMe,
    developBranch,
    isOnline,
    listIssues,
    listLabels,
    listProjects,
    moveToInProgress,
} from "./gh.ts";

beforeEach(() => {
    vi.resetAllMocks();
    cache.cached.mockImplementation((_key: string, fetch: () => unknown) => fetch());
});

describe("project and label lookup", () => {
    it("filters closed projects and parses labels from gh JSON", () => {
        ghApi.gh
            .mockReturnValueOnce("owner")
            .mockReturnValueOnce(JSON.stringify({ projects: [
                { title: "Open", number: 1, url: "open", closed: false },
                { title: "Closed", number: 2, url: "closed", closed: true },
            ] }))
            .mockReturnValueOnce(JSON.stringify([{ name: "bug", description: "Broken" }]));

        expect(listProjects()).toEqual([{ title: "Open", number: 1, url: "open", closed: false }]);
        expect(listLabels()).toEqual([{ name: "bug", description: "Broken" }]);
        expect(cache.cached).toHaveBeenCalledWith("projects", expect.any(Function));
        expect(cache.cached).toHaveBeenCalledWith("labels", expect.any(Function));
    });

    it("returns cached projects when offline and an empty list when the cache is absent", () => {
        cache.readCache.mockReturnValueOnce([{ title: "Cached", number: 1, url: "cached" }]).mockReturnValueOnce(undefined);

        expect(listProjects(true)).toEqual([{ title: "Cached", number: 1, url: "cached" }]);
        expect(listProjects(true)).toEqual([]);
        expect(ghApi.gh).not.toHaveBeenCalled();
    });

    it("swallows a project-scope or malformed project response as an empty live list", () => {
        ghApi.gh.mockImplementation(() => {
            throw new Error("scope");
        });

        expect(listProjects()).toEqual([]);
    });

    it("reports online reachability independently from project scope", () => {
        ghApi.gh.mockReturnValueOnce("ok");
        expect(isOnline()).toBe(true);
        ghApi.gh.mockImplementationOnce(() => {
            throw new Error("offline");
        });
        expect(isOnline()).toBe(false);
    });
});

describe("issue lookup and mutations", () => {
    it("keeps only issues attached to the selected project and writes the normalized cache", () => {
        ghApi.gh.mockReturnValue(JSON.stringify([
            { number: 1, title: "One", url: "one", labels: [{ name: "bug" }], projectItems: [{ title: "Roadmap" }] },
            { number: 2, title: "Two", url: "two", labels: [], projectItems: [{ title: "Other" }] },
        ]));

        expect(listIssues("Roadmap")).toEqual([{ number: 1, title: "One", url: "one", labels: ["bug"] }]);
        expect(cache.writeCache).toHaveBeenCalledWith("issues-roadmap", [{ number: 1, title: "One", url: "one", labels: ["bug"] }]);
    });

    it("reads cached issues without contacting gh", () => {
        cache.readCache.mockReturnValue([{ number: 4, title: "Cached", url: "url", labels: [] }]);

        expect(listIssues("Roadmap", true)).toEqual([{ number: 4, title: "Cached", url: "url", labels: [] }]);
        expect(ghApi.gh).not.toHaveBeenCalled();
    });

    it("uses exact gh arguments for assignment, development and board movement", () => {
        ghApi.gh.mockReturnValue("owner");

        assignToMe(42);
        developBranch(42, "feature/roadmap/42-fix");
        moveToInProgress({ title: "Roadmap", number: 7, url: "project" }, { number: 42, title: "Fix", url: "issue", labels: [] });

        expect(ghApi.gh).toHaveBeenNthCalledWith(1, "issue", "edit", "42", "--add-assignee", "@me");
        expect(ghApi.gh).toHaveBeenNthCalledWith(2, "issue", "develop", "42", "--name", "feature/roadmap/42-fix", "--checkout");
        expect(ghApi.gh).toHaveBeenNthCalledWith(3, "repo", "view", "--json", "owner", "--jq", ".owner.login");
        expect(ghApi.gh).toHaveBeenNthCalledWith(4, "project", "item-edit", "7", "--owner", "owner", "--url", "issue", "--field", "Status", "--value", "In Progress");
    });
});
