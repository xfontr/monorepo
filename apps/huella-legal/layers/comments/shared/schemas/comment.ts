import type { FormError } from "@nuxt/ui";
import * as v from "valibot";

export type CommentIssue = "invalid" | "long" | "required";

export type CommentError = FormError & { message: CommentIssue };

export const MAX_COMMENT_LENGTH = 5000;

// WordPress's own column widths, which it would refuse past with a bare 400
const MAX_NAME_LENGTH = 245;
const MAX_EMAIL_LENGTH = 100;

type Message = (issue: CommentIssue) => string;

const text = (message: Message, maxLength: number) =>
    v.pipe(
        v.string(() => message("required")),
        v.trim(),
        v.nonEmpty(() => message("required")),
        v.maxLength(maxLength, () => message("long")),
    );

const id = (message: Message) =>
    v.pipe(
        v.string(() => message("invalid")),
        v.regex(/^\d+$/, () => message("invalid")),
    );

const fields = (message: Message) => ({
    name: text(message, MAX_NAME_LENGTH),
    email: v.pipe(
        v.string(() => message("required")),
        v.trim(),
        v.nonEmpty(() => message("required")),
        v.email(() => message("invalid")),
        v.maxLength(MAX_EMAIL_LENGTH, () => message("long")),
    ),
    content: text(message, MAX_COMMENT_LENGTH),
    // A boolean that must be true, not `literal(true)`, so a checkbox's state fits the input
    consent: v.pipe(
        v.boolean(() => message("required")),
        v.value(true, () => message("required")),
    ),
});

/** What the reader types: the form validates this. */
export const commentSchema = (message: Message) =>
    v.config(v.object(fields(message)), { abortPipeEarly: true });

/** What the server accepts: the reader's fields, the article, and the comment it replies to. */
export const newCommentSchema = (message: Message) =>
    v.config(v.object({ ...fields(message), post: id(message), parent: id(message) }), {
        abortPipeEarly: true,
    });

export type CommentFields = v.InferOutput<ReturnType<typeof commentSchema>>;

export type NewComment = v.InferOutput<ReturnType<typeof newCommentSchema>>;
