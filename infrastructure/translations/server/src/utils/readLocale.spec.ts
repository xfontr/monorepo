import { describe, expect, it } from "vitest";
import readLocale from "./readLocale";

describe("readLocale", () => {
    it("reads and parses a project's locale file from the source-of-truth tree", async () => {
        const messages = await readLocale("huella-legal", "es-ES");
        expect(Object.keys(messages)).toEqual(expect.arrayContaining(["app", "common"]));
        expect(messages.common).toEqual({ loading: "Cargando…" });
    });

    it("rejects when the locale file does not exist", async () => {
        await expect(readLocale("huella-legal", "zz")).rejects.toThrow();
    });
});
