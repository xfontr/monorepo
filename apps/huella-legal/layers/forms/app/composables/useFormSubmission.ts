import type { FormError, FormErrorWithId, FormInputEvents } from "@nuxt/ui";
import { useErrorSummary } from "./useErrorSummary";

interface ErrorTarget {
    setErrors(errors: FormError[]): void;
    getErrors(): FormErrorWithId[];
}

interface Options<Request extends Pick<FormRequest, "website">, Issue extends string> {
    status: Readonly<Ref<string>>;
    errors: Readonly<Ref<readonly { name?: string; message: Issue }[]>>;
    send: (request: Request, challenge: Challenge) => Promise<void>;
    message: (issue: Issue) => string;
    label?: (field: string) => string;
}

/**
 * Sends a form's fields with its honeypot through the challenge, puts the server's issues on the
 * fields and in the error summary, and validates on every input once the form has been submitted.
 */
export const useFormSubmission = <
    Request extends Pick<FormRequest, "website">,
    Issue extends string,
>(
    form: Readonly<ShallowRef<ErrorTarget | null>>,
    { status, errors, send, message, label = (field) => field }: Options<Request, Issue>,
) => {
    const honeypot = ref<string>("");
    const submitted = ref<boolean>(false);

    const submitting = computed<boolean>(() => status.value === "submitting");
    const validateOn = computed<FormInputEvents[]>(() => (submitted.value ? ["input"] : []));

    const { errors: summaryErrors, list } = useErrorSummary(label);

    const onError = (formErrors: readonly FormErrorWithId[]): void => {
        submitted.value = true;
        list(formErrors);
    };

    const submit = async (
        fields: Omit<Request, "website">,
        challenge: Challenge,
    ): Promise<void> => {
        submitted.value = true;
        list([]);

        await send({ ...fields, website: honeypot.value } as Request, challenge);

        form.value?.setErrors(
            errors.value.map(({ name, message: issue }) => ({ name, message: message(issue) })),
        );

        list(form.value?.getErrors() ?? []);
    };

    return { honeypot, submitting, validateOn, summaryErrors, submit, onError };
};
