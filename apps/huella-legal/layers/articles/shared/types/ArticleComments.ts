import type { CommentThread } from "./CommentThread";

export interface ArticleComments {
    open: boolean;
    count: number;
    threads: CommentThread[];
}
