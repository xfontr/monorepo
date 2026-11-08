import type { FormError } from "@nuxt/ui";

export type FormPostStatus = "idle" | "submitting" | "success" | "invalid" | "error";

interface Rejection<Issue extends FormError> {
    statusCode?: number;
    data?: { data?: Issue[] };
}

interface Options<Failure extends string> {
    failures?: Partial<Record<number, Failure>>;
    multipart?: boolean;
}

const toFormData = (fields: Record<string, unknown>): FormData => {
    const data = new FormData();

    for (const [name, value] of Object.entries(fields)) {
        if (value instanceof Blob) data.append(name, value);
        else if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            data.append(name, String(value));
        }
    }

    return data;
};

/**
 * One form's state machine: idle → submitting → success, invalid or error. A `422` leaves the
 * server's issue codes in `errors`; any other refusal leaves its `failures` entry in `failure`.
 * `multipart` posts the fields as `FormData`, which a file needs.
 */
export const useFormPost = <
    Request extends FormRequest,
    Issue extends FormError,
    Failure extends string = never,
>(
    endpoint: string,
    { failures = {}, multipart = false }: Options<Failure> = {},
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
            await challenge((token) => {
                const body = { ...fields, token };

                return $fetch(endpoint, {
                    method: "POST",
                    body: multipart ? toFormData(body) : body,
                });
            });
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
