import { describe, expect, it } from "vitest";
import type { WordpressComment } from "../adapters/wordpress";
import { toArticleComments } from "./articleComments";

const comment = (id: number, parent: number, author_name: string): WordpressComment => ({
    id,
    parent,
    author_name,
    date_gmt: `2024-05-0${id}T10:00:00`,
    content: { rendered: `<p>Comentario ${id}</p>` },
});

describe("toArticleComments", () => {
    it("hangs every reply under its top-level comment, however deep WordPress nested it", () => {
        const { threads, count } = toArticleComments(true, [
            comment(1, 0, "Ana"),
            comment(2, 1, "Luis"),
            comment(3, 2, "Ana"),
            comment(4, 0, "Marta"),
        ]);

        expect(count).toBe(4);
        expect(threads.map(({ id, replies }) => [id, replies.map((reply) => reply.id)])).toEqual([
            ["1", ["2", "3"]],
            ["4", []],
        ]);
    });

    it("names who a nested reply answers, since flattening hides it", () => {
        const { threads } = toArticleComments(true, [
            comment(1, 0, "Ana"),
            comment(2, 1, "Luis"),
            comment(3, 2, "Ana"),
        ]);

        expect(threads[0]?.replies.map(({ replyTo }) => replyTo)).toEqual([undefined, "Luis"]);
    });

    // The parent may be held, spammed or deleted, and the reply is still approved
    it("opens a thread for a reply whose parent isn't approved instead of losing it", () => {
        const { threads } = toArticleComments(true, [comment(2, 1, "Luis")]);

        expect(threads.map(({ id }) => id)).toEqual(["2"]);
    });

    it("carries whether the article still takes comments", () => {
        expect(toArticleComments(false, [])).toEqual({ open: false, count: 0, threads: [] });
    });
});
