import { newCommentSchema } from "../../shared/schemas/comment";
import type { CommentRequest } from "../../shared/types/CommentRequest";
import { createComment } from "../adapters/wordpress";

// The client words each issue code, since the server has no locale
const schema = newCommentSchema((issue) => issue);

defineRouteMeta({
    openAPI: {
        tags: ["Forms"],
        summary: "Submit a reader's comment on an article for moderation",
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        required: [
                            "post",
                            "parent",
                            "name",
                            "email",
                            "content",
                            "consent",
                            "token",
                        ],
                        properties: {
                            post: { type: "string", description: "The article's id" },
                            parent: {
                                type: "string",
                                description: "The comment it replies to, or `0`",
                            },
                            name: { type: "string", description: "Up to 245 characters" },
                            email: {
                                type: "string",
                                format: "email",
                                description: "Up to 100 characters",
                            },
                            content: { type: "string", description: "Up to 5,000 characters" },
                            consent: { type: "boolean", const: true },
                            token: { type: "string", description: "A Turnstile token" },
                            website: { type: "string", description: "The honeypot, left empty" },
                        },
                    },
                },
            },
        },
        responses: {
            204: {
                description: "Held for moderation, or silently dropped when the honeypot is filled",
            },
            403: { description: "The Turnstile challenge failed" },
            409: { description: "The same comment was already submitted" },
            410: { description: "The article no longer takes comments" },
            422: { description: "One `{ name, message }` per invalid field, under `data`" },
            429: { description: "Too many comments in a short time" },
            502: { description: "WordPress or Turnstile is unavailable" },
        },
    },
});

export default defineEventHandler(async (event): Promise<void> => {
    const body = (await readBody<Partial<CommentRequest> | null>(event)) ?? {};

    if (body.website) return;

    await assertChallenge(event, body.token);

    const comment = assertForm(schema, body);

    await createComment(event, comment);
});
