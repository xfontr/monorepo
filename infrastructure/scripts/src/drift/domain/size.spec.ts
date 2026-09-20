import { describe, expect, it } from "vitest";
import { changeSize, lastMdCommitMs } from "./size.ts";

describe("lastMdCommitMs", () => {
    it("converts Git epoch seconds to milliseconds", () => {
        expect(lastMdCommitMs("42")).toBe(42000);
    });

    it("leaves a missing commit undefined", () => {
        expect(lastMdCommitMs("")).toBeUndefined();
    });
});

describe("changeSize", () => {
    it("counts changed lines and files and carries rename state", () => {
        expect(changeSize(["2\t3\tfile.ts", "1\t0\tother.ts"], ["R100\told\tnew"])).toEqual({
            linesChanged: 6,
            filesChanged: 2,
            renamed: true,
        });
    });
});
