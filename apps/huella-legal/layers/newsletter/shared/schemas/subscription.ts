import type { FormError } from "@nuxt/ui";
import * as v from "valibot";

// `rejected` is Mailchimp's verdict on an address these rules let through
export type SubscriptionIssue = "invalid" | "required" | "rejected";

export type SubscriptionError = FormError & { message: SubscriptionIssue };

export const subscriptionSchema = (message: (issue: SubscriptionIssue) => string) =>
    v.config(
        v.object({
            email: v.pipe(
                v.string(() => message("required")),
                v.trim(),
                v.nonEmpty(() => message("required")),
                v.email(() => message("invalid")),
            ),
        }),
        { abortPipeEarly: true },
    );

export type Subscription = v.InferOutput<ReturnType<typeof subscriptionSchema>>;
