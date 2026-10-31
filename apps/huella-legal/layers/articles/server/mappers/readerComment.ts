import type { ReaderComment } from "../../shared/types/ReaderComment";
import type { WordpressComment } from "../adapters/wordpress";
import { parseFragment, textContent } from "../utils/hast";

// Readers' HTML never reaches the page: each block WordPress wrapped the comment in becomes plain text
const toParagraphs = (html: string): string[] => {
    const root = parseFragment(html);
    const blocks = root.children.filter((node) => node.type !== "text" || node.value.trim());
    const paragraphs = blocks.every((node) => node.type === "element") ? blocks : [root];

    return paragraphs.map(textContent).filter(Boolean);
};

export const toReaderComment = (comment: WordpressComment, replyTo?: string): ReaderComment => ({
    id: String(comment.id),
    author: comment.author_name.trim(),
    publishedAt: `${comment.date_gmt}Z`,
    paragraphs: toParagraphs(comment.content.rendered),
    replyTo,
});
