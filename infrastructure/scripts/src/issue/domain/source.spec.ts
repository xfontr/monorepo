import { describe, expect, it } from "vitest";
import { issueSource } from "./source.ts";

describe("issueSource", () => {
    it.each([
        [{ knownOffline: false, requestFailed: false, online: false }, "live"],
        [{ knownOffline: true, requestFailed: false, online: false }, "cache"],
        [{ knownOffline: false, requestFailed: true, online: false }, "cache"],
        [{ knownOffline: false, requestFailed: true, online: true }, "auth-error"],
    ])("routes %j to %j", (input, expected) => {
        expect(issueSource(input)).toBe(expected);
    });
});
