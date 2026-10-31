import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import CommentItem from "./CommentItem.vue";

const global = {
    mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
            params ? `t(${key}, ${JSON.stringify(params)})` : `t(${key})`,
    },
};

const COMMENT: ReaderComment = {
    id: "12",
    author: "Lucía Pérez",
    publishedAt: "2024-03-11T23:30:00Z",
    paragraphs: ["Muy buen artículo.", "<b>Gracias</b>"],
};

describe("comment item", () => {
    it("prints each paragraph as text, so a reader's markup shows rather than renders", async () => {
        const wrapper = await mountSuspended(CommentItem, { props: { comment: COMMENT }, global });

        const paragraphs = wrapper.findAll("p.font-serif").map((p) => p.text());

        expect(paragraphs).toEqual(["Muy buen artículo.", "<b>Gracias</b>"]);
        expect(wrapper.find("b").exists()).toBe(false);
    });

    it("names the comment after its author and dates it in Madrid", async () => {
        const wrapper = await mountSuspended(CommentItem, { props: { comment: COMMENT }, global });

        const labelledBy = wrapper.find("article").attributes("aria-labelledby");

        expect(wrapper.find(`#${labelledBy}`).text()).toBe("Lucía Pérez");
        expect(wrapper.find("time").text()).toBe("12 de marzo de 2024");
    });

    it("says who a nested reply answers", async () => {
        const wrapper = await mountSuspended(CommentItem, {
            props: { comment: { ...COMMENT, replyTo: "Ana" } },
            global,
        });

        expect(wrapper.text()).toContain('t(commentItem.replyTo, {"author":"Ana"})');
    });

    it("offers a reply named for its author only when the article takes comments", async () => {
        const closed = await mountSuspended(CommentItem, { props: { comment: COMMENT }, global });
        const open = await mountSuspended(CommentItem, {
            props: { comment: COMMENT, replyable: true },
            global,
        });

        expect(closed.find("button").exists()).toBe(false);
        expect(open.find("button").attributes("aria-label")).toBe(
            't(commentItem.replyLabel, {"author":"Lucía Pérez"})',
        );

        await open.find("button").trigger("click");

        expect(open.emitted("reply")).toEqual([[COMMENT]]);
    });
});
