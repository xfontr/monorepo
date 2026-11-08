import { diffArrays } from "diff";

const RAW_TEXT = /<(style|script)\b/iy;
const TEXT = /\s+|[^\s<]+/y;

/** `indexOf` that remembers each needle's last hit, so a scan whose `from` only grows stays linear. */
const finderIn = (haystack: string) => {
    const found = new Map<string, number>();

    return (needle: string, from: number): number => {
        const cached = found.get(needle);
        if (cached !== undefined && (cached === -1 || cached >= from)) return cached;

        const index = haystack.indexOf(needle, from);
        found.set(needle, index);
        return index;
    };
};

const tokenEnd = (
    html: string,
    at: number,
    find: ReturnType<typeof finderIn>,
    findFolded: ReturnType<typeof finderIn>,
): number | undefined => {
    // Raw-text elements are one token so a highlight never lands inside CSS or JS.
    RAW_TEXT.lastIndex = at;
    const raw = RAW_TEXT.exec(html);
    if (raw?.[1]) {
        const close = `</${raw[1].toLowerCase()}>`;
        const index = findFolded(close, at + raw[0].length);
        if (index !== -1) return index + close.length;
    }

    if (html.startsWith("<!--", at)) {
        const index = find("-->", at + 4);
        if (index !== -1) return index + 3;
    }

    if (html[at] === "<") {
        const index = find(">", at + 1);
        return index > at + 1 ? index + 1 : undefined;
    }

    TEXT.lastIndex = at;
    return TEXT.exec(html) ? TEXT.lastIndex : undefined;
};

/** Markup, raw-text elements, comments, whitespace runs and words; a stray `<` is dropped. */
export const htmlTokens = (html: string): string[] => {
    const find = finderIn(html);
    // ASCII only: a full toLowerCase can change the length and shift every index after it
    const findFolded = finderIn(html.replaceAll(/[A-Z]+/g, (letters) => letters.toLowerCase()));
    const tokens: string[] = [];

    for (let at = 0; at < html.length;) {
        const end = tokenEnd(html, at, find, findFolded);

        if (end === undefined) {
            at++;
        } else {
            tokens.push(html.slice(at, end));
            at = end;
        }
    }

    return tokens;
};

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
