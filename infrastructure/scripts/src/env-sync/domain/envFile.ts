export type EnvLine =
    | { kind: "blank"; text: string }
    | { kind: "comment"; text: string }
    | { kind: "commented"; key: string; text: string }
    | { kind: "entry"; key: string; lines: string[] };

export type Parsed =
    { lines: EnvLine[]; problem?: undefined } | { lines?: undefined; problem: string };

const KEY = String.raw`[A-Za-z_][\w.-]*`;
const ENTRY = new RegExp(String.raw`^\s*(?:export\s+)?(${KEY})\s*=(.*)$`);
const COMMENTED = new RegExp(String.raw`^\s*#\s*(?:export\s+)?(${KEY})\s*=`);
const QUOTES = new Set(['"', "'", "`"]);

/** dotenv lets a backslash escape the quote inside all three quote styles. */
const closes = (text: string, quote: string): boolean => {
    for (let index = 1; index < text.length; index++) {
        if (text[index] === "\\") index++;
        else if (text[index] === quote) return true;
    }
    return false;
};

export const toLines = (text: string): string[] =>
    text === "" ? [] : text.replace(/\n$/, "").split("\n");

export const render = (lines: string[]): string =>
    lines.length === 0 ? "" : `${lines.join("\n")}\n`;

const classify = (line: string): EnvLine | undefined => {
    if (line.trim() === "") return { kind: "blank", text: line };

    const commented = COMMENTED.exec(line);
    if (commented?.[1]) return { kind: "commented", key: commented[1], text: line };

    if (line.trimStart().startsWith("#")) return { kind: "comment", text: line };

    return undefined;
};

/** The index of the line an entry's value ends on, or the problem when a quote never closes. */
const entryEnd = (raw: string[], start: number, key: string, value: string): number | string => {
    const quote = value[0];
    if (!quote || !QUOTES.has(quote)) return start;

    let index = start;
    let joined = value;
    while (!closes(joined, quote)) {
        index++;
        if (index >= raw.length) return `${key} opens a ${quote} quote that never closes`;
        joined += `\n${raw[index]}`;
    }
    return index;
};

/** Refuses anything it can't classify, so a file it doesn't understand is never rewritten. */
export const parseEnv = (text: string): Parsed => {
    if (text.includes("\r")) return { problem: "it has CRLF line endings" };

    const raw = toLines(text);
    const lines: EnvLine[] = [];
    const seen = new Set<string>();

    for (let index = 0; index < raw.length; index++) {
        const line = raw[index] ?? "";
        const other = classify(line);

        if (other) {
            lines.push(other);
            continue;
        }

        const entry = ENTRY.exec(line);
        if (!entry?.[1]) {
            return { problem: `line ${index + 1} is not KEY=value, a comment or blank` };
        }

        const key = entry[1];
        if (seen.has(key)) return { problem: `${key} is set twice` };
        seen.add(key);

        const end = entryEnd(raw, index, key, (entry[2] ?? "").trimStart());
        if (typeof end === "string") return { problem: end };

        lines.push({ kind: "entry", key, lines: raw.slice(index, end + 1) });
        index = end;
    }

    return { lines };
};
