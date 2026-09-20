import { beforeEach, describe, expect, it, vi } from "vitest";

const clack = vi.hoisted(() => ({ isCancel: vi.fn() }));

vi.mock("@clack/prompts", () => clack);

import { CancelledError } from "../errors.ts";
import { orExit } from "./prompts.ts";

beforeEach(() => vi.clearAllMocks());

describe("orExit", () => {
    it("returns a selected value", () => {
        clack.isCancel.mockReturnValue(false);

        expect(orExit("value", "cancelled")).toBe("value");
    });

    it("turns a clack cancellation symbol into CancelledError", () => {
        clack.isCancel.mockReturnValue(true);

        expect(() => orExit(Symbol("cancel"), "Cancelled — stopped.")).toThrow(
            new CancelledError("Cancelled — stopped."),
        );
    });
});
