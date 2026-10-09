import * as v from "valibot";

export type SubscriptionIssue = "invalid" | "required";

export function subscriptionSchema(message: (issue: SubscriptionIssue) => string) {
    return v.config(
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
}

export type Subscription = v.InferOutput<ReturnType<typeof subscriptionSchema>>;
