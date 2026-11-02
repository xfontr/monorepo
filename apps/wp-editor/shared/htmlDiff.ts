import { diffArrays } from "diff";

// Raw-text elements are one token so a highlight never lands inside CSS or JS.
const TOKEN = /<(style|script)\b[\s\S]*?<\/\1>|<!--[\s\S]*?-->|<[^>]+>|\s+|[^\s<]+/gi;

export const htmlTokens = (html: string): string[] => html.match(TOKEN) ?? [];

const isMarkup = (token: string): boolean => token.startsWith("<");

const wrap = (tokens: string[], tag: "ins" | "del"): string => {
    let out = "";
    let run = "";

    const flush = () => {
        if (run.trim()) out += `<${tag}>${run}</${tag}>`;
        else out += run;
        run = "";
    };

    for (const token of tokens) {
        if (isMarkup(token)) {
            flush();
            out += token;
        } else {
            run += token;
        }
    }

    flush();

    return out;
};

/**
 * Both sides keep their own markup untouched; only changed text runs are wrapped, so each side
 * stays exactly as balanced as its source.
 */
export const htmlDiff = (before: string, after: string): { before: string; after: string } => {
    let left = "";
    let right = "";

    for (const { added, removed, value } of diffArrays(htmlTokens(before), htmlTokens(after))) {
        if (removed) left += wrap(value, "del");
        else if (added) right += wrap(value, "ins");
        else {
            left += value.join("");
            right += value.join("");
        }
    }

    return { before: left, after: right };
};
