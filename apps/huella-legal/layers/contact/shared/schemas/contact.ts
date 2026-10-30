import type { FormError } from "@nuxt/ui";
import * as v from "valibot";

export type ContactIssue = "invalid" | "required";

export type ContactError = FormError & { message: ContactIssue };

const text = (message: (issue: ContactIssue) => string) =>
    v.pipe(
        v.string(() => message("required")),
        v.trim(),
        v.nonEmpty(() => message("required")),
    );

export const contactSchema = (message: (issue: ContactIssue) => string) =>
    v.config(
        v.object({
            name: text(message),
            email: v.pipe(
                v.string(() => message("required")),
                v.trim(),
                v.nonEmpty(() => message("required")),
                v.email(() => message("invalid")),
            ),
            message: text(message),
            consent: v.literal(true, () => message("required")),
        }),
        { abortPipeEarly: true },
    );

export type Contact = v.InferOutput<ReturnType<typeof contactSchema>>;
