import type { ContactError } from "../../shared/schemas/contact";
import type { ContactRequest } from "../../shared/types/ContactRequest";

export type ContactStatus = "idle" | "submitting" | "success" | "invalid" | "error";

interface RejectedMessage {
    statusCode?: number;
    data?: { data?: ContactError[] };
}

export const useContact = () => {
    const status = ref<ContactStatus>("idle");
    const errors = ref<ContactError[]>([]);

    const fail = ({ statusCode, data }: RejectedMessage) => {
        errors.value = statusCode === 422 ? (data?.data ?? []) : [];
        status.value = errors.value.length ? "invalid" : "error";
    };

    const send = async (fields: Omit<ContactRequest, "token">, challenge: Challenge) => {
        if (status.value === "submitting") return;

        status.value = "submitting";
        errors.value = [];

        try {
            await challenge((token) =>
                $fetch("/api/contact", {
                    method: "POST",
                    body: { ...fields, token } satisfies ContactRequest,
                }),
            );
            status.value = "success";
        } catch (error) {
            fail(error as RejectedMessage);
        }
    };

    return {
        status: readonly(status),
        errors: readonly(errors),
        send,
    };
};
