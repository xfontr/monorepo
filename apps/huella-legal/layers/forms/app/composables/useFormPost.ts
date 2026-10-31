import type { FormError } from "@nuxt/ui";

export type FormPostStatus = "idle" | "submitting" | "success" | "invalid" | "error";

interface Rejection<Issue extends FormError> {
    statusCode?: number;
    data?: { data?: Issue[] };
}

interface Options<Failure extends string> {
    failures?: Partial<Record<number, Failure>>;
}

/**
 * One form's state machine: idle → submitting → success, invalid or error. A `422` leaves the
 * server's issue codes in `errors`; any other refusal leaves its `failures` entry in `failure`.
 */
export const useFormPost = <
    Request extends FormRequest,
    Issue extends FormError,
    Failure extends string = never,
>(
    endpoint: string,
    { failures = {} }: Options<Failure> = {},
) => {
    const status = ref<FormPostStatus>("idle");
    const errors = ref<Issue[]>([]);
    const failure = ref<Failure | "unavailable">();

    const fail = (error: unknown) => {
        const { statusCode, data } = (error ?? {}) as Rejection<Issue>;

        errors.value = statusCode === 422 ? (data?.data ?? []) : [];

        if (errors.value.length) {
            status.value = "invalid";
            return;
        }

        failure.value = failures[statusCode ?? 0] ?? "unavailable";
        status.value = "error";
    };

    /** Sends the fields once the form's challenge yields a token. */
    const send = async (fields: Omit<Request, "token">, challenge: Challenge) => {
        if (status.value === "submitting") return;

        status.value = "submitting";
        errors.value = [];
        failure.value = undefined;

        try {
            await challenge((token) =>
                $fetch(endpoint, { method: "POST", body: { ...fields, token } }),
            );
            status.value = "success";
        } catch (error) {
            fail(error);
        }
    };

    return {
        status: readonly(status),
        errors: readonly(errors),
        failure: readonly(failure),
        send,
    };
};
