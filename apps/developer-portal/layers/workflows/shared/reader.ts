export type Raw = Record<string, unknown>;

export const isRecord = (value: unknown): value is Raw =>
    value !== null && typeof value === "object" && !Array.isArray(value);

/** YAML reads an unquoted `2026-09-30` as a Date, and a gate written either way means the same day. */
export const asText = (value: unknown): string | null => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (value instanceof Date && !Number.isNaN(value.getTime()))
        return value.toISOString().slice(0, 10);
    return null;
};

export class Reader {
    readonly problems: string[] = [];

    text(raw: Raw, key: string, where: string, fallback?: string): string {
        const value = asText(raw[key]);

        if (value !== null && value.trim() !== "") return value;
        if (fallback !== undefined) return fallback;

        this.problems.push(`${where} is missing \`${key}\``);
        return "";
    }

    list(raw: Raw, key: string, where: string): unknown[] {
        const value = raw[key];

        if (value === undefined || value === null) return [];
        if (Array.isArray(value)) return value;

        this.problems.push(`${where}: \`${key}\` must be a list`);
        return [];
    }

    texts(raw: Raw, key: string, where: string): string[] {
        return this.list(raw, key, where).flatMap((item) => {
            const value = asText(item);
            if (value !== null) return [value];
            this.problems.push(`${where}: \`${key}\` holds something that isn't text`);
            return [];
        });
    }

    record(raw: Raw, key: string, where: string): Raw {
        const value = raw[key];

        if (value === undefined || value === null) return {};
        if (isRecord(value)) return value;

        this.problems.push(`${where}: \`${key}\` must be a mapping`);
        return {};
    }
}
