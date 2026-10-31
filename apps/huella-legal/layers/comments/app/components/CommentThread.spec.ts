import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import CommentThread from "./CommentThread.vue";

const global = {
    mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
            params ? `t(${key}, ${JSON.stringify(params)})` : `t(${key})`,
    },
};

const comment = (id: string, author: string): ReaderComment => ({
    id,
    author,
    publishedAt: "2024-03-12T09:00:00Z",
    paragraphs: [`Comentario de ${author}`],
});

const THREAD = {
    ...comment("1", "Ana"),
    replies: [comment("2", "Luis"), comment("3", "Marta")],
};

describe("comment thread", () => {
    it("nests the replies under the comment they answer, in order", async () => {
        const wrapper = await mountSuspended(CommentThread, { props: { thread: THREAD }, global });

        expect(wrapper.find("div > article").attributes("id")).toBe("comentario-1");
        expect(wrapper.findAll("ol article").map((article) => article.attributes("id"))).toEqual([
            "comentario-2",
            "comentario-3",
        ]);
    });

    it("leaves no empty reply list under a comment nobody answered", async () => {
        const wrapper = await mountSuspended(CommentThread, {
            props: { thread: { ...THREAD, replies: [] } },
            global,
        });

        expect(wrapper.find("ol").exists()).toBe(false);
    });

    it("passes up whichever comment in the thread a reader answers", async () => {
        const wrapper = await mountSuspended(CommentThread, {
            props: { thread: THREAD, replyable: true },
            global,
        });

        const buttons = wrapper.findAll("article button");
        await buttons[0]!.trigger("click");
        await buttons[2]!.trigger("click");

        expect(wrapper.emitted("reply")).toEqual([[THREAD], [THREAD.replies[1]]]);
    });
});
