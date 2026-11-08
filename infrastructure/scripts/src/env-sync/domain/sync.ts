import { parseEnv, type EnvLine } from "./envFile.ts";

export const TRAILING_HEADER = "# Not in .env.example";

export interface Synced {
    lines: string[];
    added: string[];
    trailing: string[];
    droppedComments: number;
}

type Entry = Extract<EnvLine, { kind: "entry" }>;
type Commented = Extract<EnvLine, { kind: "commented" }>;

const isEntry = (line: EnvLine): line is Entry => line.kind === "entry";
const isCommented = (line: EnvLine): line is Commented => line.kind === "commented";
const textOf = (line: EnvLine): string[] => (isEntry(line) ? line.lines : [line.text]);

/** A key's slot is its live line in the example, or its first commented line when it has none. */
const slots = (example: EnvLine[]): Map<string, EnvLine> => {
    const slot = new Map<string, EnvLine>();
    for (const line of example.filter(isEntry)) slot.set(line.key, line);
    for (const line of example.filter(isCommented))
        if (!slot.has(line.key)) slot.set(line.key, line);
    return slot;
};

/**
 * Lays the example out with the env file's values in it. Comments come from the example, except
 * commented-out assignments, which are data and stay above their key's slot.
 */
export const syncEnv = (example: EnvLine[], env: EnvLine[]): Synced => {
    const exampleText = new Set(example.flatMap(textOf).map((text) => text.trim()));
    const live = new Map(env.filter(isEntry).map((line) => [line.key, line]));
    const own = env.filter(isCommented).filter((line) => !exampleText.has(line.text.trim()));
    const slot = slots(example);

    const lines: string[] = [];
    const added: string[] = [];

    for (const line of example) {
        if (line.kind === "blank" || line.kind === "comment" || slot.get(line.key) !== line) {
            lines.push(...textOf(line));
            continue;
        }

        lines.push(...own.filter(({ key }) => key === line.key).map(({ text }) => text));

        const mine = live.get(line.key);
        if (mine) lines.push(...mine.lines);
        else lines.push(...textOf(line));
        if (!mine && isEntry(line)) added.push(line.key);
    }

    const leftover = env.filter(
        (line): line is Entry | Commented =>
            (isEntry(line) || (isCommented(line) && own.includes(line))) && !slot.has(line.key),
    );
    if (leftover.length > 0) {
        if (lines.length > 0 && lines.at(-1)?.trim() !== "") lines.push("");
        lines.push(TRAILING_HEADER, ...leftover.flatMap(textOf));
    }

    const droppedComments = env.filter(
        (line) =>
            line.kind === "comment" &&
            line.text.trim() !== TRAILING_HEADER &&
            !exampleText.has(line.text.trim()),
    ).length;

    return {
        lines,
        added,
        trailing: [...new Set(leftover.filter(isEntry).map(({ key }) => key))],
        droppedComments,
    };
};

/**
 * Re-parses what `syncEnv` produced and checks nothing it must keep went missing; any problem
 * means the file is left as it was.
 */
export const lostData = (env: EnvLine[], example: EnvLine[], output: string): string[] => {
    const parsed = parseEnv(output);
    if (parsed.problem !== undefined) return [`the result would not parse: ${parsed.problem}`];

    const written = new Map(parsed.lines.filter(isEntry).map((line) => [line.key, line]));
    const writtenText = parsed.lines.map((line) => textOf(line).join("\n"));
    const problems: string[] = [];

    for (const line of env.filter(isEntry)) {
        if (written.get(line.key)?.lines.join("\n") !== line.lines.join("\n")) {
            problems.push(`${line.key} would change or disappear`);
        }
    }

    for (const line of env.filter(isCommented)) {
        if (!writtenText.includes(line.text)) problems.push(`a commented ${line.key} would go`);
    }

    for (const line of example.filter(isEntry)) {
        if (!written.has(line.key)) problems.push(`${line.key} would still be missing`);
    }

    return problems;
};

const plural = (count: number, one: string, many: string): string =>
    `${count} ${count === 1 ? one : many}`;

/** Names keys only — a value never reaches the output, so a log or an agent never sees one. */
export const describeSync = (synced: Synced): string => {
    const parts = [
        synced.added.length > 0 && `added ${synced.added.join(", ")}`,
        synced.trailing.length > 0 &&
            `kept ${synced.trailing.join(", ")} under "${TRAILING_HEADER}"`,
        synced.droppedComments > 0 &&
            `dropped ${plural(synced.droppedComments, "comment line", "comment lines")} not in the example`,
    ].filter((part): part is string => typeof part === "string");

    return parts.length > 0 ? parts.join("; ") : "order and comments matched to the example";
};
