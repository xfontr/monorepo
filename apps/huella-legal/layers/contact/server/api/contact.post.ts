import type { ContactRequest } from "../../shared/types/ContactRequest";
import { contactSchema } from "../../shared/schemas/contact";
import { sendContactMessage } from "../adapters/resend";

// The client words each issue code, since the server has no locale
const schema = contactSchema((issue) => issue);

defineRouteMeta({
    openAPI: {
        tags: ["Forms"],
        summary: "Send a contact message to the editors",
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        required: ["name", "email", "message", "consent", "token"],
                        properties: {
                            name: { type: "string" },
                            email: { type: "string", format: "email" },
                            message: { type: "string" },
                            consent: { type: "boolean", const: true },
                            token: { type: "string", description: "A Turnstile token" },
                            website: { type: "string", description: "The honeypot, left empty" },
                        },
                    },
                },
            },
        },
        responses: {
            204: { description: "Sent, or silently dropped when the honeypot is filled" },
            403: { description: "The Turnstile challenge failed" },
            422: { description: "One `{ name, message }` per invalid field, under `data`" },
            502: { description: "Resend or Turnstile is unavailable" },
        },
    },
});

export default defineEventHandler(async (event): Promise<void> => {
    const body = (await readBody<Partial<ContactRequest> | null>(event)) ?? {};

    if (body.website) return;

    await assertChallenge(event, body.token);

    const contact = assertForm(schema, body);

    await sendContactMessage(event, contact);
});
