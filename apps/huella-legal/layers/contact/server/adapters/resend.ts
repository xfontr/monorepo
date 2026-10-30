import type { H3Event } from "h3";
import type { Contact } from "../../shared/schemas/contact";

/** Sends a reader's message to the editorial inbox, answering as the reader through Reply-To. */
export const sendContactMessage = async (
    event: H3Event,
    { name, email, message }: Pick<Contact, "name" | "email" | "message">,
): Promise<void> => {
    const { baseURL, apiKey, from, to } = useRuntimeConfig(event).mail;

    const sender = name.replace(/\s+/g, " ");

    // https://resend.com/docs/api-reference/emails/send-email
    await $fetch("/emails", {
        baseURL,
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: {
            from,
            to,
            reply_to: email,
            subject: `Contacto: ${sender}`,
            text: `${message}\n\n— ${sender} <${email}>`,
        },
    }).catch((cause: unknown) => {
        throw createError({ statusCode: 502, statusMessage: "Resend is unavailable", cause });
    });
};
