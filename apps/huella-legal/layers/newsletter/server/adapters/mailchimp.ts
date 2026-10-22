import type { H3Event } from "h3";
import { createHash } from "node:crypto";
import type { FetchError } from "ofetch";
import type { SubscriptionError } from "../../shared/schemas/subscription";

/** https://mailchimp.com/developer/marketing/api-concepts/errors */
interface MailchimpProblem {
    title?: string;
}

const handleRejection = (cause: FetchError<MailchimpProblem>): void => {
    if (cause.statusCode !== 400)
        throw createError({ statusCode: 502, statusMessage: "Mailchimp is unavailable", cause });

    // eslint-disable-next-line no-console -- Mailchimp's `detail` names the address, so only the title is logged
    console.warn(`[mailchimp] refused an address: ${cause.data?.title}`);

    throw createError({
        statusCode: 422,
        statusMessage: "Invalid subscription",
        data: [{ name: "email", message: "rejected" }] satisfies SubscriptionError[],
    });
};

export const addSubscriber = async (event: H3Event, email: string): Promise<void> => {
    const { baseURL, apiKey, audienceId } = useRuntimeConfig(event).newsletter;
    // Mailchimp keys members by this MD5, and it keeps the address out of the URL a FetchError logs.
    const member = createHash("md5").update(email.toLowerCase()).digest("hex"); // NOSONAR
    const credentials = btoa(`huella:${apiKey}`);

    await $fetch(`/3.0/lists/${audienceId}/members/${member}`, {
        baseURL,
        method: "PUT",
        headers: { Authorization: `Basic ${credentials}` },
        body: { email_address: email, status_if_new: "pending" },
    }).catch(handleRejection);
};
