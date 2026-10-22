import type { H3Event } from "h3";

interface Answer {
    success: boolean;
    "error-codes"?: string[];
}

/** Throws unless Cloudflare accepts the token: `403` when it refuses, `502` when it can't answer. */
export const assertChallenge = async (event: H3Event, token: string | undefined): Promise<void> => {
    // siteverify answers some refusals with a 400, which `$fetch` throws with the body as `data`
    const answer: Answer = await verifyTurnstileToken(token ?? "", event).catch(
        (cause: unknown) => {
            const answered = (cause as { data?: Partial<Answer> }).data;

            if (typeof answered?.success !== "boolean")
                throw createError({
                    statusCode: 502,
                    statusMessage: "Turnstile is unavailable",
                    cause,
                });

            return answered as Answer;
        },
    );

    if (answer.success) return;

    throw createError({ statusCode: 403, statusMessage: "Challenge failed", cause: answer });
};
