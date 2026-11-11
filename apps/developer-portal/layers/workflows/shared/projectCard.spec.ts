import { describe, expect, it } from "vitest";
import { activeProjects } from "./projectCard.ts";
import type { ProjectView } from "./types.ts";

const at = (percent: number) => ({ progress: { done: 0, total: 1, percent } }) as ProjectView;

describe("activeProjects", () => {
    it("keeps only projects with blocks left, so a shipped one drops off the Overview", () => {
        expect(
            activeProjects([at(0), at(99), at(100)]).map(({ progress }) => progress.percent),
        ).toEqual([0, 99]);
    });
});
