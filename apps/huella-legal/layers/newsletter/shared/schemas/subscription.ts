import * as v from "valibot";

export type SubscriptionIssue = "invalid" | "required";

export const subscriptionSchema = (message: (issue: SubscriptionIssue) => string) =>
    v.config(
        v.object({
            email: v.pipe(
                v.string(),
                v.trim(),
                v.nonEmpty(() => message("required")),
                v.email(() => message("invalid")),
            ),
        }),
        { abortPipeEarly: true },
    );

export type Subscription = v.InferOutput<ReturnType<typeof subscriptionSchema>>;
