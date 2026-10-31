import type { ReaderComment } from "./ReaderComment";

export interface CommentThread extends ReaderComment {
    replies: ReaderComment[];
}
