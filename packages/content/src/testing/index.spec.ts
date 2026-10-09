import { describe, expect, it } from "vitest";
import * as api from "./index";

describe("testing entrypoint", () => {
    it("exports only the fake vendors and domain factories, so a test helper never widens the package by accident", () => {
        expect(Object.keys(api).sort()).toEqual([
            "fakeAsset",
            "fakeAuthor",
            "fakeEntry",
            "fakeTerm",
            "faker",
            "wordpressHandlers",
        ]);
    });
});
