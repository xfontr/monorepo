import type { ArticleComments } from "../../shared/types/ArticleComments";
import type { CommentThread } from "../../shared/types/CommentThread";
import type { WordpressComment } from "../adapters/wordpress";
import { toReaderComment } from "./readerComment";

/** Threads oldest first, each reply under its top-level comment however deep WordPress nested it. */
export const toArticleComments = (open: boolean, comments: WordpressComment[]): ArticleComments => {
    const byId = new Map(comments.map((comment) => [comment.id, comment]));
    const threads = new Map<number, CommentThread>();

    // A reply to a comment that isn't approved has nothing to hang from, so it opens its own thread
    const rootOf = (comment: WordpressComment): WordpressComment => {
        const parent = byId.get(comment.parent);

        return parent ? rootOf(parent) : comment;
    };

    for (const comment of comments) {
        const root = rootOf(comment);
        const thread = threads.get(root.id);

        if (!thread) {
            threads.set(comment.id, { ...toReaderComment(comment), replies: [] });
            continue;
        }

        const replyTo = comment.parent === root.id ? undefined : byId.get(comment.parent);

        thread.replies.push(toReaderComment(comment, replyTo?.author_name.trim()));
    }

    return { open, count: comments.length, threads: [...threads.values()] };
};
