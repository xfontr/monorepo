import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReplyPace } from "../../shared/types/ReplyPace";

const nitro = vi.hoisted(() => ({ until: "" }));

vi.stubGlobal("createError", (input: Record<string, unknown>) =>
    Object.assign(new Error("http"), input),
);
vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("useRuntimeConfig", () => ({ forms: { slowRepliesUntil: nitro.until } }));

const handler = (await import("./replies.get")).default as unknown as (event: unknown) => ReplyPace;

beforeEach(() => {
    // 23:30 UTC on the 20th is already the 21st in Madrid
    vi.useFakeTimers({ now: new Date("2026-11-20T23:30:00Z") });
});

afterEach(() => {
    vi.useRealTimers();
});

describe("GET /api/replies", () => {
    it("reports the usual pace when no date is set", () => {
        nitro.until = "";

        expect(handler({})).toEqual({});
    });

    it("keeps the notice up through the last day it names", () => {
        nitro.until = "2026-11-21";

        expect(handler({})).toEqual({ slowUntil: "2026-11-21" });
    });

    it("drops the notice once Madrid has passed that day, whatever the UTC date says", () => {
        nitro.until = "2026-11-20";

        expect(handler({})).toEqual({});
    });

    it.each(["21/11/2026", "2026-13-40", "tomorrow"])(
        "fails loudly on a date it can't read rather than hiding the notice (%s)",
        (until) => {
            nitro.until = until;

            expect(() => handler({})).toThrow(expect.objectContaining({ statusCode: 500 }));
        },
    );
});
