import * as v from "valibot";
import { calendarDate, parseDecimal } from "../utils/interest";

export type InterestAdvancedFormIssue =
    "principal" | "customPercent" | "from" | "fromInvalid" | "to" | "toInvalid" | "order";

const CONCEPT_MAX_LENGTH = 120;

// An emptied number input binds "", which the date check below words, so a part never raises its own
const datePart = v.pipe(
    v.unknown(),
    v.transform((value) => (typeof value === "number" ? value : Number.NaN)),
);

interface DateParts {
    fromDay: number;
    fromMonth: number;
    fromYear: number;
    toDay: number;
    toMonth: number;
    toYear: number;
}

const isComplete = (...parts: number[]): boolean => parts.every((part) => !Number.isNaN(part));

const fromDate = (parts: Pick<DateParts, "fromDay" | "fromMonth" | "fromYear">) =>
    calendarDate(parts.fromDay, parts.fromMonth, parts.fromYear);

const toDate = (parts: Pick<DateParts, "toDay" | "toMonth" | "toYear">) =>
    calendarDate(parts.toDay, parts.toMonth, parts.toYear);

export const interestAdvancedFormSchema = (
    message: (issue: InterestAdvancedFormIssue) => string,
) => {
    const common = {
        concept: v.pipe(v.optional(v.string(), ""), v.trim(), v.maxLength(CONCEPT_MAX_LENGTH)),
        principal: v.pipe(
            v.string(() => message("principal")),
            v.transform((text) => parseDecimal(text, { grouping: true })),
            v.number(() => message("principal")),
            v.minValue(0.01, () => message("principal")),
        ),
        fromDay: datePart,
        fromMonth: datePart,
        fromYear: datePart,
        toDay: datePart,
        toMonth: datePart,
        toYear: datePart,
    };

    // Each date reports once, on its day field, so the summary links to the first of its three inputs
    return v.pipe(
        v.variant("rate", [
            v.object({ ...common, rate: v.picklist(["legal", "judicial"]) }),
            v.object({
                ...common,
                rate: v.literal("custom"),
                customPercent: v.pipe(
                    v.string(() => message("customPercent")),
                    v.transform((text) => parseDecimal(text, { grouping: false })),
                    v.number(() => message("customPercent")),
                    v.gtValue(0, () => message("customPercent")),
                    v.maxValue(100, () => message("customPercent")),
                ),
            }),
        ]),
        v.forward(
            v.partialCheck(
                [["fromDay"], ["fromMonth"], ["fromYear"]],
                ({ fromDay, fromMonth, fromYear }) => isComplete(fromDay, fromMonth, fromYear),
                () => message("from"),
            ),
            ["fromDay"],
        ),
        v.forward(
            v.partialCheck(
                [["fromDay"], ["fromMonth"], ["fromYear"]],
                (parts) =>
                    !isComplete(parts.fromDay, parts.fromMonth, parts.fromYear) ||
                    fromDate(parts) !== undefined,
                () => message("fromInvalid"),
            ),
            ["fromDay"],
        ),
        v.forward(
            v.partialCheck(
                [["toDay"], ["toMonth"], ["toYear"]],
                ({ toDay, toMonth, toYear }) => isComplete(toDay, toMonth, toYear),
                () => message("to"),
            ),
            ["toDay"],
        ),
        v.forward(
            v.partialCheck(
                [["toDay"], ["toMonth"], ["toYear"]],
                (parts) =>
                    !isComplete(parts.toDay, parts.toMonth, parts.toYear) ||
                    toDate(parts) !== undefined,
                () => message("toInvalid"),
            ),
            ["toDay"],
        ),
        v.forward(
            v.partialCheck(
                [["fromDay"], ["fromMonth"], ["fromYear"], ["toDay"], ["toMonth"], ["toYear"]],
                (parts) => {
                    const from = fromDate(parts);
                    const to = toDate(parts);

                    return from === undefined || to === undefined || to >= from;
                },
                () => message("order"),
            ),
            ["toDay"],
        ),
        v.transform(({ fromDay, fromMonth, fromYear, toDay, toMonth, toYear, ...rest }) => ({
            ...rest,
            from: calendarDate(fromDay, fromMonth, fromYear) ?? "",
            to: calendarDate(toDay, toMonth, toYear) ?? "",
        })),
    );
};

export type InterestAdvancedForm = v.InferOutput<ReturnType<typeof interestAdvancedFormSchema>>;
