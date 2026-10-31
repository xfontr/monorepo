import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import CommentsSection from "./CommentsSection.vue";

const CommentForm = defineComponent({
    props: {
        postId: { type: String, required: true },
        replyTo: { type: Object, default: undefined },
    },
    emits: ["cancelReply"],
    setup: () => () => h("form"),
});

const global = {
    mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
            params ? `t(${key}, ${JSON.stringify(params)})` : `t(${key})`,
    },
    stubs: { CommentForm },
};

const comment = (id: string, author: string): ReaderComment => ({
    id,
    author,
    publishedAt: "2024-03-12T09:00:00Z",
    paragraphs: [`Comentario de ${author}`],
});

const COMMENTS: ArticleComments = {
    open: true,
    count: 3,
    threads: [
        { ...comment("1", "Ana"), replies: [comment("2", "Luis")] },
        { ...comment("3", "Marta"), replies: [] },
    ],
};

const mount = (comments?: ArticleComments) =>
    mountSuspended(CommentsSection, { props: { article: { id: "42" }, comments }, global });

describe("comments section", () => {
    it("is the target the bylines' comment counts link to", async () => {
        const wrapper = await mount(COMMENTS);

        expect(wrapper.find("section").attributes("id")).toBe("comentarios");
    });

    it("titles the section with the count and nests each reply under its thread", async () => {
        const wrapper = await mount(COMMENTS);

        expect(wrapper.find("h2").text()).toBe('t(commentsSection.title, {"count":3})');
        expect(wrapper.findAll("ol ol article").map((article) => article.text())).toEqual([
            expect.stringContaining("Luis"),
        ]);
    });

    it("hands the comment a reader answers to the form, and drops it when they cancel", async () => {
        const wrapper = await mount(COMMENTS);
        const form = () => wrapper.findComponent(CommentForm);

        await wrapper.findAll("article button")[1]!.trigger("click");

        expect(form().props("replyTo")).toMatchObject({ id: "2" });
        expect(form().props("postId")).toBe("42");

        form().vm.$emit("cancelReply");
        await wrapper.vm.$nextTick();

        expect(form().props("replyTo")).toBeUndefined();
    });

    describe("sorting", () => {
        const MANY: ArticleComments = {
            open: true,
            count: 6,
            threads: [
                { ...comment("1", "Ana"), replies: [comment("2", "Luis"), comment("3", "Marta")] },
                ...["4", "5", "6", "7"].map((id) => ({
                    ...comment(id, `Autor ${id}`),
                    replies: [],
                })),
            ],
        };

        const topLevel = (wrapper: Awaited<ReturnType<typeof mount>>) =>
            wrapper
                .findAll("section > ol > li > div > article")
                .map((article) => article.attributes("id"));

        it("offers no sort for a short thread, where it would be noise", async () => {
            const wrapper = await mount(COMMENTS);

            expect(wrapper.find("[role=combobox]").exists()).toBe(false);
        });

        it("reads oldest first, the way the conversation happened", async () => {
            const wrapper = await mount(MANY);

            expect(topLevel(wrapper)).toEqual(
                ["1", "4", "5", "6", "7"].map((id) => `comentario-${id}`),
            );
        });

        it("puts the newest thread first on request, keeping each thread's replies in order", async () => {
            const wrapper = await mount(MANY);

            wrapper.findComponent({ name: "USelect" }).vm.$emit("update:modelValue", "newest");
            await wrapper.vm.$nextTick();

            expect(topLevel(wrapper)).toEqual(
                ["7", "6", "5", "4", "1"].map((id) => `comentario-${id}`),
            );
            expect(
                wrapper.findAll("ol ol article").map((article) => article.attributes("id")),
            ).toEqual(["comentario-2", "comentario-3"]);
        });
    });

    it("invites the first comment on an open article with none", async () => {
        const wrapper = await mount({ open: true, count: 0, threads: [] });

        expect(wrapper.text()).toContain("t(commentsSection.empty)");
    });

    it("keeps the thread of a closed article but takes no new comment or reply", async () => {
        const wrapper = await mount({ ...COMMENTS, open: false });

        expect(wrapper.findAll("article")).toHaveLength(3);
        expect(wrapper.find("form").exists()).toBe(false);
        expect(wrapper.find("article button").exists()).toBe(false);
        expect(wrapper.text()).toContain("t(commentsSection.closed)");
    });

    // Read in the browser, the thread may fail or still be on its way; the form works either way
    it("offers the form before the thread arrives, without replies or an empty state", async () => {
        const wrapper = await mount();

        expect(wrapper.find("form").exists()).toBe(true);
        expect(wrapper.find("h2").text()).toBe("t(commentsSection.title, {})");
        expect(wrapper.text()).not.toContain("commentsSection.empty");
    });
});
