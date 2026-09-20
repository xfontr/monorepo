import { beforeEach, describe, expect, it, vi } from "vitest";

const exec = vi.hoisted(() => ({ run: vi.fn() }));

vi.mock("./exec.ts", () => ({
    assertNotFlagLike: (value: string, field: string) => {
        if (value.startsWith("-")) throw new Error(`${field} rejected`);
        return value;
    },
    run: exec.run,
}));

import { createIssue, gh } from "./gh.ts";

beforeEach(() => vi.clearAllMocks());

describe("gh", () => {
    it("runs gh with the exact argument boundary", () => {
        exec.run.mockReturnValue("output");

        expect(gh("issue", "list")).toBe("output");
        expect(exec.run).toHaveBeenCalledWith("gh", ["issue", "list"]);
    });
});

describe("createIssue", () => {
    it.each([
        [{ title: "Title", body: "Body" }, ["issue", "create", "--title", "Title", "--body", "Body"]],
        [{ title: "Title", body: "Body", label: "bug" }, ["issue", "create", "--title", "Title", "--body", "Body", "--label", "bug"]],
        [{ title: "Title", body: "Body", project: "Roadmap" }, ["issue", "create", "--title", "Title", "--body", "Body", "--project", "Roadmap"]],
        [{ title: "Title", body: "Body", label: "bug", project: "Roadmap" }, ["issue", "create", "--title", "Title", "--body", "Body", "--label", "bug", "--project", "Roadmap"]],
    ])("omits empty optional values while preserving supplied flags", (input, expected) => {
        exec.run.mockReturnValue("https://example.test/issues/1");

        expect(createIssue(input)).toBe("https://example.test/issues/1");
        expect(exec.run).toHaveBeenCalledWith("gh", expected);
    });

    it("rejects flag-like titles before gh can interpret them", () => {
        vi.mocked(exec.run).mockImplementation(() => {
            throw new Error("must not run");
        });

        expect(() => createIssue({ title: "--title", body: "Body" })).toThrow(/title/);
        expect(exec.run).not.toHaveBeenCalled();
    });
});
