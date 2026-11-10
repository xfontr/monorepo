import { describe, expect, it } from "vitest";
import { kindIcon } from "./format.ts";

describe("kindIcon", () => {
    it("returns known icons and a fallback icon for unknown kinds", () => {
        expect(kindIcon("readme")).toBe("i-lucide-file-text");
        expect(kindIcon("unknown")).toBe("i-lucide-file-text");
    });
});
