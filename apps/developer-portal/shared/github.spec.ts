import { describe, expect, it } from "vitest";
import { repoApiUrl } from "./github.ts";

describe("repoApiUrl", () => {
    it("turns a repository URL into the requested REST resource", () => {
        expect(repoApiUrl("https://github.example/xfontr/monorepo", "issues"))
            .toBe("https://api.github.example/repos/xfontr/monorepo/issues");
    });

    it("removes a clone URL's .git suffix", () => {
        expect(repoApiUrl("https://github.example/xfontr/monorepo.git", "deployments"))
            .toBe("https://api.github.example/repos/xfontr/monorepo/deployments");
    });

    it("returns null for malformed URLs and paths without an owner and repo", () => {
        expect(repoApiUrl("not a url", "issues")).toBeNull();
        expect(repoApiUrl("https://github.example/xfontr", "issues")).toBeNull();
        expect(repoApiUrl("https://github.example/", "issues")).toBeNull();
    });

    it("uses the supplied resource instead of hard-coding an endpoint", () => {
        expect(repoApiUrl("https://github.example/xfontr/monorepo", "deployments"))
            .toContain("/deployments");
    });
});
