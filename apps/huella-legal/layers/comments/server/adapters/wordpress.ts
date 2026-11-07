import type { H3Event } from "h3";
import type { NewComment } from "../../shared/schemas/comment";

const REFUSALS: Record<string, { statusCode: number; statusMessage: string }> = {
    comment_duplicate: { statusCode: 409, statusMessage: "Duplicate comment" },
    comment_flood: { statusCode: 429, statusMessage: "Commenting too fast" },
    rest_comment_closed: { statusCode: 410, statusMessage: "Comments are closed" },
};

const escapeHtml = (text: string): string =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const toRefusal = (cause: unknown) => {
    const code = (cause as { data?: { code?: string } }).data?.code;

    return createError({
        ...(REFUSALS[code ?? ""] ?? { statusCode: 502, statusMessage: "WordPress is unavailable" }),
        cause,
    });
};

/** Files a reader's comment into WordPress's moderation queue, as the reader rather than as us. */
export const createComment = async (
    event: H3Event,
    { post, parent, name, email, content }: Omit<NewComment, "consent">,
): Promise<void> => {
    const { content: cms, comments } = useRuntimeConfig(event);
    const { username, applicationPassword } = comments;

    // https://developer.wordpress.org/rest-api/reference/comments/#create-a-comment
    await $fetch("/wp-json/wp/v2/comments", {
        baseURL: cms.vendor.baseURL,
        method: "POST",
        headers: { Authorization: `Basic ${btoa(`${username}:${applicationPassword}`)}` },
        body: {
            post: Number(post),
            parent: Number(parent),
            author_name: name.replace(/[<>]/g, ""),
            author_email: email,
            content: escapeHtml(content),
            // Akismet
            author_ip: getRequestIP(event, { xForwardedFor: true }),
            author_user_agent: getRequestHeader(event, "user-agent"),
            status: "hold",
        },
    }).catch((cause: unknown) => {
        throw toRefusal(cause);
    });
};
