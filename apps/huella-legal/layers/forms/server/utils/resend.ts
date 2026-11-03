import type { H3Event } from "h3";

interface Attachment {
    filename: string;
    /** Base64. */
    content: string;
}

interface Mail {
    to: string;
    replyTo: string;
    subject: string;
    text: string;
    attachments?: Attachment[];
}

/** Sends a plain-text email from the site's sender, answering as `replyTo`; `502` if Resend fails. */
export const sendMail = async (
    event: H3Event,
    { to, replyTo, subject, text, attachments }: Mail,
): Promise<void> => {
    const { baseURL, apiKey, from } = useRuntimeConfig(event).mail;

    // https://resend.com/docs/api-reference/emails/send-email
    await $fetch("/emails", {
        baseURL,
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: {
            from,
            to,
            reply_to: replyTo,
            subject: subject.replace(/\s+/g, " "),
            text,
            ...(attachments?.length && { attachments }),
        },
    }).catch((cause: unknown) => {
        throw createError({ statusCode: 502, statusMessage: "Resend is unavailable", cause });
    });
};
