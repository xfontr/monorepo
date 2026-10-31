import type { FormErrorWithId } from "@nuxt/ui";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, shallowRef } from "vue";
import { useFormSubmission } from "./useFormSubmission";

type Issue = "invalid" | "required";

const FIELDS = { email: "lucia@ejemplo.es" };

const MESSAGES = {
    invalid: "invalid value",
    required: "required value",
} as const satisfies Record<Issue, string>;

const LEFT_ON_FORM: FormErrorWithId[] = [{ id: "v-1", name: "email", message: "invalid value" }];

const challenge = vi.fn() as unknown as Challenge;

const setUp = () => {
    const status = ref<string>("idle");
    const errors = ref<{ name?: string; message: Issue }[]>([]);
    const send = vi.fn(async () => {});
    const form = { setErrors: vi.fn(), getErrors: vi.fn(() => LEFT_ON_FORM) };

    const submission = useFormSubmission(shallowRef(form), {
        status,
        errors,
        send,
        message: (issue) => MESSAGES[issue],
    });

    return { status, errors, send, form, submission };
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("useFormSubmission", () => {
    it("sends what a bot typed into the honeypot beside the fields, through the challenge", async () => {
        const { send, submission } = setUp();

        submission.honeypot.value = "https://spam.test";
        await submission.submit(FIELDS, challenge);

        expect(send).toHaveBeenCalledWith({ ...FIELDS, website: "https://spam.test" }, challenge);
    });

    it("words the server's issues onto their fields and resolves to what the form holds", async () => {
        const { send, errors, form, submission } = setUp();
        send.mockImplementation(async () => {
            errors.value = [{ name: "email", message: "invalid" }];
        });

        const left = await submission.submit(FIELDS, challenge);

        expect(form.setErrors).toHaveBeenCalledWith([{ name: "email", message: "invalid value" }]);
        expect(left).toBe(LEFT_ON_FORM);
    });

    it.each([
        [
            "a failed validation",
            ({ submission }: ReturnType<typeof setUp>) => submission.onInvalid(),
        ],
        [
            "a submit",
            ({ submission }: ReturnType<typeof setUp>) => submission.submit(FIELDS, challenge),
        ],
    ])("validates on input only after %s, so nobody is told off mid-word", async (_, act) => {
        const setup = setUp();

        expect(setup.submission.validateOn.value).toEqual([]);

        await act(setup);

        expect(setup.submission.validateOn.value).toEqual(["input"]);
    });

    it("reports submitting only while the request's status says so", () => {
        const { status, submission } = setUp();

        expect(submission.submitting.value).toBe(false);

        status.value = "submitting";

        expect(submission.submitting.value).toBe(true);
    });
});
