import type { H3Event } from "h3";
import type { FetchError } from "ofetch";
import type { SubscriptionError } from "../../shared/schemas/subscription";

/** https://developers.kit.com/api-reference/subscribers/create-a-subscriber */
interface KitSubscriber {
    subscriber: {
        id: number;
        state: "active" | "inactive" | "cancelled" | "bounced" | "complained";
    };
}

const handleRejection = (cause: FetchError): never => {
    if (cause.statusCode !== 422)
        throw createError({ statusCode: 502, statusMessage: "Kit is unavailable", cause });

    // eslint-disable-next-line no-console -- Kit's `errors` may name the address, so none is logged
    console.warn("[kit] refused an address");

    throw createError({
        statusCode: 422,
        statusMessage: "Invalid subscription",
        data: [{ name: "email", message: "rejected" }] satisfies SubscriptionError[],
    });
};

export const addSubscriber = async (event: H3Event, email: string): Promise<void> => {
    const { baseURL, apiKey, formId } = useRuntimeConfig(event).newsletter;
    const options = { baseURL, method: "POST", headers: { "X-Kit-Api-Key": apiKey } } as const;

    // Creating is an upsert that never changes an existing subscriber's state
    const { subscriber } = await $fetch<KitSubscriber>("/v4/subscribers", {
        ...options,
        body: { email_address: email, state: "inactive" },
    }).catch(handleRejection);

    // Kit doesn't document whether adding a cancelled subscriber to a form resubscribes them
    if (subscriber.state !== "inactive" && subscriber.state !== "active") return;

    await $fetch(`/v4/forms/${formId}/subscribers/${subscriber.id}`, options).catch(
        handleRejection,
    );
};
