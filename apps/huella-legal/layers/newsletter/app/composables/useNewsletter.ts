import type { SubscriptionError } from "../../shared/schemas/subscription";
import type { NewsletterRequest } from "../../shared/types/NewsletterRequest";

export type NewsletterStatus = "idle" | "submitting" | "success" | "invalid" | "error";

interface RejectedSubscription {
    statusCode?: number;
    data?: { data?: SubscriptionError[] };
}

/**
 * One newsletter form's state machine: idle → submitting → success, invalid or error. A `422`
 * leaves the server's issue codes in `errors` for the form to word.
 */
export const useNewsletter = () => {
    const status = ref<NewsletterStatus>("idle");
    const errors = ref<SubscriptionError[]>([]);

    const fail = (error: unknown) => {
        const { statusCode, data } = (error ?? {}) as RejectedSubscription;

        errors.value = statusCode === 422 ? (data?.data ?? []) : [];
        status.value = errors.value.length ? "invalid" : "error";
    };

    /** Sends one subscription once the form's challenge yields a token. */
    const subscribe = async (fields: Omit<NewsletterRequest, "token">, challenge: Challenge) => {
        if (status.value === "submitting") return;

        status.value = "submitting";
        errors.value = [];

        try {
            await challenge((token) =>
                $fetch("/api/newsletter", {
                    method: "POST",
                    body: { ...fields, token } satisfies NewsletterRequest,
                }),
            );
            status.value = "success";
        } catch (error) {
            fail(error);
        }
    };

    return {
        status: readonly(status),
        errors: readonly(errors),
        subscribe,
    };
};
