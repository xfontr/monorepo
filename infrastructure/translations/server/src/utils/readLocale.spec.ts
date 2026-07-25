import { describe, expect, it } from "vitest";
import readLocale from "./readLocale";

describe("readLocale", () => {
    it("reads and parses a project's locale file from the source-of-truth tree", async () => {
        const messages = await readLocale("external", "en-EN");
        expect(Object.keys(messages)).toEqual(
            expect.arrayContaining(["shared", "meta", "user"]),
        );
        expect(messages.shared).toEqual({ health: "Health" });
    });

    it("rejects when the locale file does not exist", async () => {
        await expect(readLocale("external", "zz")).rejects.toThrow();
    });
});
