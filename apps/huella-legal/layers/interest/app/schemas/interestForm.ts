import * as v from "valibot";

export type InterestFormIssue = "principal" | "customPercent" | "from" | "to" | "order";

export const interestFormSchema = (message: (issue: InterestFormIssue) => string) => {
    const common = {
        principal: v.pipe(
            v.number(() => message("principal")),
            v.minValue(0.01, () => message("principal")),
        ),
        from: v.pipe(
            v.string(),
            v.isoDate(() => message("from")),
        ),
        to: v.pipe(
            v.string(),
            v.isoDate(() => message("to")),
        ),
    };

    return v.config(
        v.pipe(
            v.variant("rate", [
                v.object({ ...common, rate: v.picklist(["legal", "judicial"]) }),
                v.object({
                    ...common,
                    rate: v.literal("custom"),
                    customPercent: v.pipe(
                        v.number(() => message("customPercent")),
                        v.gtValue(0, () => message("customPercent")),
                        v.maxValue(100, () => message("customPercent")),
                    ),
                }),
            ]),
            v.forward(
                v.partialCheck(
                    [["from"], ["to"]],
                    ({ from, to }) => to >= from,
                    () => message("order"),
                ),
                ["to"],
            ),
        ),
        { abortPipeEarly: true },
    );
};

export type InterestForm = v.InferOutput<ReturnType<typeof interestFormSchema>>;
