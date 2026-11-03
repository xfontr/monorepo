import * as v from "valibot";
import { parseDecimal } from "../utils/interest";

export type InterestFormIssue = "principal" | "from" | "to" | "order";

export const interestFormSchema = (message: (issue: InterestFormIssue) => string) =>
    v.config(
        v.pipe(
            v.object({
                principal: v.pipe(
                    v.string(() => message("principal")),
                    v.transform((text) => parseDecimal(text, { grouping: true })),
                    v.number(() => message("principal")),
                    v.minValue(0.01, () => message("principal")),
                ),
                rate: v.picklist(["legal", "judicial"]),
                from: v.pipe(
                    v.string(),
                    v.isoDate(() => message("from")),
                ),
                to: v.pipe(
                    v.string(),
                    v.isoDate(() => message("to")),
                ),
            }),
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

export type InterestForm = v.InferOutput<ReturnType<typeof interestFormSchema>>;
