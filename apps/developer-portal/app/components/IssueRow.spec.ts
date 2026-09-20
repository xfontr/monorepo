import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import IssueRow from "./IssueRow.vue";
import type { Issue } from "#shared/issues.ts";

const ButtonStub = defineComponent({
    props: {
        to: { type: String, default: undefined },
        label: { type: String, default: undefined },
        ariaLabel: { type: String, default: undefined },
    },
    setup(props, { slots }) {
        return () => h(props.to ? "a" : "button", {
            "href": props.to,
            "target": props.to ? "_blank" : undefined,
            "aria-label": props.ariaLabel,
        }, props.label ?? slots.default?.());
    },
});

const BadgeStub = defineComponent({
    props: { label: { type: String, default: "" } },
    template: "<span>{{ label }}</span>",
});

const issue: Issue = {
    number: 42,
    title: "Keep the portal honest",
    body: "A **long** description with [a link](https://example.com).",
    url: "https://github.com/example/repo/issues/42",
    labels: ["bug", "portal"],
    assignees: ["ada"],
    createdAt: "2026-09-19T12:00:00.000Z",
    updatedAt: "2026-09-20T11:00:00.000Z",
};

const mount = (props: { issue: Issue, compact?: boolean }) => mountSuspended(IssueRow, {
    props,
    global: { stubs: { UIcon: true, UBadge: BadgeStub, UButton: ButtonStub } },
});

describe("IssueRow", () => {
    it("keeps the collapsed row short while retaining the issue identity and labels", async () => {
        const wrapper = await mount({ issue });

        expect(wrapper.text()).toContain("#42");
        expect(wrapper.text()).toContain(issue.title);
        expect(wrapper.text()).toContain("bug");
        expect(wrapper.text()).toContain("A long description with a link.");
        expect(wrapper.text()).not.toContain("ada");
    });

    it("switches from the summary to the full body and assignees when the title opens it", async () => {
        const wrapper = await mount({ issue });

        await wrapper.get("button").trigger("click");

        expect(wrapper.text()).toContain(issue.body);
        expect(wrapper.text()).toContain("ada");
        expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual([issue.url, issue.url]);

        await wrapper.get("button").trigger("click");
        expect(wrapper.text()).not.toContain("ada");
    });

    it("names an empty expanded body instead of leaving a blank description", async () => {
        const wrapper = await mount({ issue: { ...issue, body: "" } });

        await wrapper.get("button").trigger("click");

        expect(wrapper.text()).toContain("No description.");
    });

    it("omits the updated time and uses the compact summary limit in compact mode", async () => {
        const wrapper = await mount({ issue, compact: true });

        expect(wrapper.text()).not.toContain("updated");
        expect(wrapper.findAll("a")).toHaveLength(1);
    });
});
