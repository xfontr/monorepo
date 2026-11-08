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

/** Refuses anything it can't classify, so a file it doesn't understand is never rewritten. */
export const parseEnv = (text: string): Parsed => {
    if (text.includes("\r")) return { problem: "it has CRLF line endings" };

    const raw = toLines(text);
    const lines: EnvLine[] = [];
    const seen = new Set<string>();

    for (let index = 0; index < raw.length; index++) {
        const line = raw[index] ?? "";

        if (line.trim() === "") {
            lines.push({ kind: "blank", text: line });
            continue;
        }

        const commented = COMMENTED.exec(line);
        if (commented?.[1]) {
            lines.push({ kind: "commented", key: commented[1], text: line });
            continue;
        }

        if (line.trimStart().startsWith("#")) {
            lines.push({ kind: "comment", text: line });
            continue;
        }

        const entry = ENTRY.exec(line);
        if (!entry?.[1]) {
            return { problem: `line ${index + 1} is not KEY=value, a comment or blank` };
        }

        const key = entry[1];
        const value = (entry[2] ?? "").trimStart();
        if (seen.has(key)) return { problem: `${key} is set twice` };
        seen.add(key);

        const start = index;
        const quote = value[0];
        if (quote && QUOTES.has(quote)) {
            let joined = value;
            while (!closes(joined, quote)) {
                index++;
                if (index >= raw.length) {
                    return { problem: `${key} opens a ${quote} quote that never closes` };
                }
                joined += `\n${raw[index]}`;
            }
        }

        lines.push({ kind: "entry", key, lines: raw.slice(start, index + 1) });
    }

    return { lines };
};
