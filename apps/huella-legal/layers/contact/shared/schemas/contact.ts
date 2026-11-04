import type { FormError } from "@nuxt/ui";
import * as v from "valibot";

export type ContactIssue = "invalid" | "long" | "required";

export type ContactError = FormError & { message: ContactIssue };

const MAX_NAME_LENGTH = 245;
const MAX_MESSAGE_LENGTH = 5000;

const text = (message: (issue: ContactIssue) => string, maxLength: number) =>
    v.pipe(
        v.string(() => message("required")),
        v.trim(),
        v.nonEmpty(() => message("required")),
        v.maxLength(maxLength, () => message("long")),
    );

export const contactSchema = (message: (issue: ContactIssue) => string) =>
    v.config(
        v.object({
            name: text(message, MAX_NAME_LENGTH),
            email: v.pipe(
                v.string(() => message("required")),
                v.trim(),
                v.nonEmpty(() => message("required")),
                v.email(() => message("invalid")),
            ),
            message: text(message, MAX_MESSAGE_LENGTH),
            // A boolean that must be true, not `literal(true)`, so a checkbox's state fits the input
            consent: v.pipe(
                v.boolean(() => message("required")),
                v.value(true, () => message("required")),
            ),
        }),
        { abortPipeEarly: true },
    );

export type Contact = v.InferOutput<ReturnType<typeof contactSchema>>;
