import type { NewsletterRequest } from "../../shared/types/NewsletterRequest";
import { subscriptionSchema } from "../../shared/schemas/subscription";
import { addSubscriber } from "../adapters/kit";

// The client words each issue code, since the server has no locale
const schema = subscriptionSchema((issue) => issue);

defineRouteMeta({
    openAPI: {
        tags: ["Forms"],
        summary: "Subscribe an email to the newsletter",
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        required: ["email", "token"],
                        properties: {
                            email: { type: "string", format: "email" },
                            token: { type: "string", description: "A Turnstile token" },
                            website: { type: "string", description: "The honeypot, left empty" },
                        },
                    },
                },
            },
        },
        responses: {
            204: { description: "Subscribed, or silently dropped when the honeypot is filled" },
            403: { description: "The Turnstile challenge failed" },
            422: { description: "One `{ name, message }` per invalid field, under `data`" },
            502: { description: "Kit or Turnstile is unavailable" },
        },
    },
});

export default defineEventHandler(async (event): Promise<void> => {
    const body = (await readBody<Partial<NewsletterRequest> | null>(event)) ?? {};

    if (body.website) return;

    await assertChallenge(event, body.token);

    const { email } = assertForm(schema, body);

    await addSubscriber(event, email);
});
