import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { Now, NowTicket, SnapshotIssue } from "#shared/workflows.ts";
import NowBoard from "./NowBoard.vue";

const ticket = (number: number, overrides: Partial<NowTicket> = {}): NowTicket => ({
    issue: {
        number,
        title: `Ticket ${number}`,
        url: `https://github.com/o/r/issues/${number}`,
        state: "open",
        reason: null,
        caps: ["search"],
        closedAt: null,
        activity: [],
        blockedBy: [],
        branch: false,
        owner: false,
    } satisfies SnapshotIssue,
    status: "ready",
    unblocks: 0,
    blockers: [],
    capability: "search",
    ...overrides,
});

const NOW: Now = {
    waiting: [ticket(1, { status: "waiting-on-you", unblocks: 4 })],
    ready: [ticket(2, { unblocks: 1 }), ticket(3)],
    inFlight: [],
    blocked: [ticket(4, { status: "blocked", blockers: [1, 2] })],
};

const stubs = { UIcon: true };

describe("NowBoard", () => {
    it("shows how much each ticket unblocks, which is why it sits where it does", async () => {
        const wrapper = await mountSuspended(NowBoard, {
            props: { now: NOW, titles: { search: "Search" } },
            global: { stubs },
        });

        expect(wrapper.find("[data-column='waiting']").text()).toContain("unblocks 4");
        expect(wrapper.find("[data-column='ready']").text()).toContain("unblocks 1");
        expect(wrapper.find("[data-column='in-flight']").text()).toContain("Nothing here.");
    });

    it("names every open blocker of a blocked ticket", async () => {
        const wrapper = await mountSuspended(NowBoard, {
            props: { now: NOW, titles: {} },
            global: { stubs },
        });

        expect(wrapper.find("details").text()).toContain("by #1 #2");
    });

    it("emits the block's id when its name is clicked, so the page can open it", async () => {
        const wrapper = await mountSuspended(NowBoard, {
            props: { now: NOW, titles: { search: "Search" } },
            global: { stubs },
        });

        await wrapper.find("[data-column='ready'] button").trigger("click");

        expect(wrapper.emitted("select")).toEqual([["search"]]);
    });
});
