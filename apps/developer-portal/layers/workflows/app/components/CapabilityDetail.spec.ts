import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import {
    projectView,
    readProject,
    readTemplate,
    type CapabilityView,
} from "#layers/workflows/shared/workflows.ts";
import CapabilityDetail from "./CapabilityDetail.vue";

const capabilityWith = (issues: object[], optional = true): CapabilityView => {
    const { template } = readTemplate({
        id: "t",
        title: "T",
        stages: [{ id: "build", title: "Build" }],
        capabilities: [
            { id: "spam-protection", stage: "build", title: "Captcha", kind: "owner" },
            { id: "moderation", stage: "build", title: "Moderation", dependsOn: ["comments"] },
            {
                id: "comments",
                stage: "build",
                title: "Comments",
                optional,
                default: true,
                dependsOn: ["spam-protection"],
                reuse: { plan: "copy", from: "apps/huella-legal/layers/comments" },
                doneWhen: ["Readers can post a comment."],
            },
        ],
    });
    const { project } = readProject({ id: "p", title: "P", template: "t", milestone: "P" });
    const view = projectView(project, template, {
        syncedAt: "",
        milestone: "P",
        issues: issues.map((issue) => ({
            title: "A ticket",
            url: "",
            closedAt: null,
            caps: ["comments"],
            activity: [],
            blockedBy: [],
            branch: false,
            owner: false,
            ...issue,
        })) as never,
        noMilestone: [],
    });

    return view.stages[0]!.capabilities.find(({ id }) => id === "comments")!;
};

describe("CapabilityDetail", () => {
    it("never colours a ticket closed as not planned as delivered", async () => {
        const wrapper = await mountSuspended(CapabilityDetail, {
            props: {
                capability: capabilityWith([{ number: 4, state: "closed", reason: "not_planned" }]),
            },
        });

        expect(wrapper.text()).toContain("#4");
        expect(wrapper.find("a .tone-good").exists()).toBe(false);
        expect(wrapper.text()).toContain("Waits");
    });

    it("names each ticket by its title, which is the thing a reader acts on", async () => {
        const wrapper = await mountSuspended(CapabilityDetail, {
            props: {
                capability: capabilityWith([
                    { number: 5, title: "Moderate in the CMS", state: "open", reason: null },
                ]),
            },
        });

        expect(wrapper.text()).toContain("Moderate in the CMS");
    });

    it("offers the switch only for an optional capability, and only when editable, beside its state", async () => {
        const optional = await mountSuspended(CapabilityDetail, {
            props: { capability: capabilityWith([]), editable: true },
        });
        const required = await mountSuspended(CapabilityDetail, {
            props: { capability: capabilityWith([], false), editable: true },
        });
        const readOnly = await mountSuspended(CapabilityDetail, {
            props: { capability: capabilityWith([]) },
        });

        expect(optional.find("[role='switch']").exists()).toBe(true);
        expect(optional.text()).toContain("Waits");
        expect(required.find("[role='switch']").exists()).toBe(false);
        expect(readOnly.find("[role='switch']").exists()).toBe(false);
    });

    it("shows where to start and when it is done without a click", async () => {
        const wrapper = await mountSuspended(CapabilityDetail, {
            props: { capability: capabilityWith([]) },
        });

        expect(wrapper.text()).toContain("Copy and adapt");
        expect(wrapper.text()).toContain("apps/huella-legal/layers/comments");
        expect(wrapper.text()).toContain("Readers can post a comment.");
    });

    it("says which decision it waits on before any ticket can be filed", async () => {
        const wrapper = await mountSuspended(CapabilityDetail, {
            props: { capability: capabilityWith([]), titles: { "spam-protection": "Captcha" } },
        });

        expect(wrapper.text()).toContain("Not fileable yet: it waits on Captcha");
    });

    it("opens a block it needs or unblocks from the panel, so the links can be walked", async () => {
        const wrapper = await mountSuspended(CapabilityDetail, {
            props: {
                capability: capabilityWith([]),
                titles: { "spam-protection": "Captcha", moderation: "Moderation" },
            },
        });

        expect(wrapper.text()).toContain("Needs");
        await wrapper
            .findAll("button")
            .find((button) => button.text() === "Moderation")
            ?.trigger("click");

        expect(wrapper.emitted("select")).toEqual([["moderation"]]);
    });

    it("names the open blocker beside a blocked ticket", async () => {
        const wrapper = await mountSuspended(CapabilityDetail, {
            props: {
                capability: capabilityWith([
                    {
                        number: 6,
                        state: "open",
                        reason: null,
                        blockedBy: [
                            { number: 3, open: true },
                            { number: 2, open: false },
                        ],
                    },
                ]),
            },
        });

        expect(wrapper.text()).toContain("Blocked by #3");
        expect(wrapper.text()).not.toContain("#2");
    });
});
