import type { FormError } from "@nuxt/ui";
import * as v from "valibot";

/** Returns `input` parsed by `schema`, or throws `422` with one `FormError` per issue. */
export const assertForm = <S extends v.GenericSchema>(
    schema: S,
    input: unknown,
): v.InferOutput<S> => {
    const result = v.safeParse(schema, input);

    if (result.success) return result.output;

    throw createError({
        statusCode: 422,
        statusMessage: "Invalid form",
        data: result.issues.map((issue): FormError => ({
            name: v.getDotPath(issue) ?? "",
            message: issue.message,
        })),
    });
};
