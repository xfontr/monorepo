import { beforeEach, describe, expect, it, vi } from "vitest";

const exec = vi.hoisted(() => ({ run: vi.fn() }));
const gitApi = vi.hoisted(() => ({ at: vi.fn((...parts: string[]) => `/repo/${parts.join("/")}`) }));
vi.mock("../../shared/adapters/exec.ts", () => exec);
vi.mock("../../shared/adapters/git.ts", () => gitApi);

import { projectsWithDev } from "./nx.ts";

beforeEach(() => vi.clearAllMocks());

describe("projectsWithDev", () => {
    it("queries Nx once per supported project root and preserves the root that matched", () => {
        exec.run.mockReturnValueOnce(JSON.stringify(["@monorepo/a"])).mockReturnValueOnce(JSON.stringify(["@monorepo/b"])).mockReturnValueOnce("[]");

        expect(projectsWithDev()).toEqual([
            { root: "packages", name: "@monorepo/a" },
            { root: "apps", name: "@monorepo/b" },
        ]);
        expect(exec.run).toHaveBeenCalledWith("/repo/node_modules/.bin/nx", [
            "show", "projects", "--with-target", "dev", "--json", "--projects", "packages/*",
        ]);
    });
});
