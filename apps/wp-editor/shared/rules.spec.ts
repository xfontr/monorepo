import { describe, expect, it } from "vitest";
import { Refusal } from "./refusal.ts";
import type { Changeset, Item, ItemKey, ItemState, RunReport, Settings } from "./types.ts";
import { DEFAULT_SETTINGS } from "./types.ts";
import {
    afterEdit,
    bulkApplyBlocker,
    confirm,
    derivedStatus,
    driftRefusal,
    itemFingerprint,
    markSeen,
    nextChangesetId,
    openBlocker,
    parseSettings,
    restoreBlocker,
} from "./rules.ts";

const KEY: ItemKey = "posts-1";

const changeset = (overrides: Partial<Changeset> = {}): Changeset => ({
    id: "0001-test",
    title: "Test",
    instructions: "",
    createdAt: "2026-01-01T00:00:00Z",
    status: "open",
    keys: [KEY],
    scanned: [KEY],
    ...overrides,
});

const item = (state: Partial<ItemState> = {}, proposal = true): Item => ({
    key: KEY,
    base: {
        title: "T",
        excerpt: "",
        content: "<p>a</p>",
        modifiedGmt: "m0",
        date: "",
        status: "publish",
        author: "",
        image: null,
        link: "",
    },
    proposal: proposal ? { content: "<p>b</p>" } : null,
    state: { level: "unreviewed", ...state },
});

const applied = (modifiedGmt = "m1") => ({ applied: { at: "now", modifiedGmt } });

describe("opening a changeset", () => {
    it("refuses while another is open, naming it", () => {
        expect(openBlocker([changeset({ status: "closed" }), changeset()], false)?.id).toBe(
            "0001-test",
        );
    });

    it("lets --override through even with one open", () => {
        expect(openBlocker([changeset()], true)).toBeNull();
    });

    it("numbers after the highest id, so a gap never reuses a number", () => {
        expect(nextChangesetId([changeset({ id: "0003-x" })], "Ortografía y más")).toBe(
            "0004-ortografia-y-mas",
        );
    });
});

describe("changeset status", () => {
    it("stays open while a key is unscanned, even with nothing pending", () => {
        expect(derivedStatus(changeset({ scanned: [] }), [])).toBe("open");
    });

    it("closes once every proposal is applied or rejected", () => {
        expect(derivedStatus(changeset(), [item(applied())])).toBe("closed");
        expect(derivedStatus(changeset(), [item({ rejected: true })])).toBe("closed");
        expect(derivedStatus(changeset(), [item()])).toBe("open");
    });
});

describe("review levels", () => {
    it("opening never downgrades a confirmed item", () => {
        expect(markSeen({ level: "confirmed" }).level).toBe("confirmed");
        expect(markSeen({ level: "unreviewed" }).level).toBe("seen");
    });

    it("drops a hand-edited proposal back to seen", () => {
        expect(afterEdit(confirm({ level: "seen" })).level).toBe("seen");
    });
});

const settings = (overrides: Partial<Settings> = {}): Settings => ({
    ...DEFAULT_SETTINGS,
    ...overrides,
});

const requested = (state: Partial<ItemState> = {}): Item => {
    const base = item(state);

    return { ...base, proposal: { content: "<p>b</p>", reviewRequested: "Legal wording" } };
};

const dryRun = (cleared: Item[]): RunReport => ({
    kind: "dry-run",
    at: "now",
    ok: cleared.map(({ key }) => key),
    refused: [],
    failed: [],
    warnings: [],
    fingerprints: Object.fromEntries(cleared.map((one) => [one.key, itemFingerprint(one)])),
});

describe("bulk apply gate", () => {
    it("blocks while a pending item is below the minimum level, and says how many", () => {
        const reason = bulkApplyBlocker(
            [item({ level: "seen" }), item({ level: "confirmed" })],
            settings(),
            null,
        );

        expect(reason).toContain("1 of 2");
    });

    it("ignores rejected and applied items when checking the level", () => {
        const items = [item({ level: "confirmed" }), item({ rejected: true }), item(applied())];

        expect(bulkApplyBlocker(items, settings(), null)).toBeNull();
    });

    it("accepts seen when the setting asks only for seen", () => {
        expect(
            bulkApplyBlocker(
                [item({ level: "seen" })],
                settings({ bulkApplyMinLevel: "seen" }),
                null,
            ),
        ).toBeNull();
    });

    it("lets unreviewed articles through when the gate is off", () => {
        expect(bulkApplyBlocker([item()], settings({ reviewGate: "none" }), null)).toBeNull();
    });

    it("gates only review-requested articles when set to, counting just those", () => {
        const items = [item(), requested(), requested({ level: "confirmed" })];

        expect(bulkApplyBlocker(items, settings({ reviewGate: "requested" }), null)).toContain(
            "1 of 2 review-requested",
        );
        expect(
            bulkApplyBlocker(
                [item(), requested({ level: "confirmed" })],
                settings({ reviewGate: "requested" }),
                null,
            ),
        ).toBeNull();
    });

    it("stays shut in dry-run mode even when everything else passes", () => {
        expect(
            bulkApplyBlocker([item({ level: "confirmed" })], settings({ dryRun: true }), null),
        ).toMatch(/dry-run mode/i);
    });

    it("still refuses drift with the gate off", () => {
        expect(
            bulkApplyBlocker([item({ drift: true })], settings({ reviewGate: "none" }), null),
        ).toMatch(/re-pull/);
    });
});

describe("mandatory dry run", () => {
    const required = settings({ reviewGate: "none", requireDryRun: true });

    it("blocks until a dry run exists", () => {
        expect(bulkApplyBlocker([item()], required, null)).toMatch(/dry run first/);
    });

    it("opens once the last dry run cleared every pending article as it is now", () => {
        const pending = item();

        expect(bulkApplyBlocker([pending], required, dryRun([pending]))).toBeNull();
    });

    it("is invalidated by an edit made after the dry run", () => {
        const before = item();
        const edited = { ...before, proposal: { content: "<p>edited</p>" } };

        expect(bulkApplyBlocker([edited], required, dryRun([before]))).toMatch(/run it again/);
    });

    it("is invalidated by a restore, which moves the timestamp the apply checks", () => {
        const before = item();
        const restored = item({ restored: { at: "now", modifiedGmt: "m7" } });

        expect(bulkApplyBlocker([restored], required, dryRun([before]))).toMatch(/run it again/);
    });

    it("does not count an article the dry run refused as cleared", () => {
        const report = { ...dryRun([]), refused: [{ key: KEY, reason: "drift" }] };

        expect(bulkApplyBlocker([item()], required, report)).toMatch(/1 pending/);
    });
});

describe("settings", () => {
    it("fills fields an older settings file lacks from the current ones", () => {
        expect(parseSettings({ dryRun: true }, settings({ reviewGate: "none" }))).toEqual({
            ...settings({ reviewGate: "none" }),
            dryRun: true,
        });
    });

    it.each([
        { reviewGate: "some" },
        { bulkApplyMinLevel: "unreviewed" },
        { requireDryRun: "yes" },
        { dryRun: 1 },
    ])("refuses %o instead of saving it", (patch) => {
        expect(() => parseSettings(patch)).toThrow(Refusal);
    });

    it("drops unknown fields so the stored file stays the documented shape", () => {
        expect(parseSettings({ extra: 1 })).toEqual(DEFAULT_SETTINGS);
    });
});

describe("drift", () => {
    it("refuses a write when WordPress moved since pull", () => {
        expect(driftRefusal("m0", "m9")).toMatch(/re-pull/);
        expect(driftRefusal("m0", "m0")).toBeNull();
    });
});

describe("restore", () => {
    const stack = (first: Partial<ItemState>, second: Partial<ItemState>) => [
        { changeset: changeset({ id: "0001-a" }), item: item(first) },
        { changeset: changeset({ id: "0002-b" }), item: item(second) },
    ];

    it("is blocked by a later changeset that still has the article applied, naming it", () => {
        expect(restoreBlocker(stack(applied("m1"), applied("m2")), 0, "m2")).toContain("0002-b");
    });

    it("is allowed once the later changeset restored it", () => {
        const later = { ...applied("m2"), restored: { at: "now", modifiedGmt: "m3" } };

        expect(restoreBlocker(stack(applied("m1"), later), 0, "m3")).toBeNull();
    });

    it("accepts the later changeset's restore as the last write, not as drift", () => {
        const later = {
            applied: { at: "2026-01-02", modifiedGmt: "m2" },
            restored: { at: "2026-01-03", modifiedGmt: "m3" },
        };

        expect(
            restoreBlocker(
                stack({ applied: { at: "2026-01-01", modifiedGmt: "m1" } }, later),
                0,
                "m3",
            ),
        ).toBeNull();
    });

    it("refuses when WordPress moved since the apply", () => {
        expect(restoreBlocker(stack(applied("m1"), {}), 0, "m5")).toMatch(/overwrite/);
    });
});
