import { asText, isRecord, Reader } from "./reader.ts";
import type { Snapshot, SnapshotIssue } from "./types.ts";

const readIssue = (reader: Reader, raw: unknown, where: string): SnapshotIssue | null => {
    if (!isRecord(raw) || typeof raw.number !== "number") {
        reader.problems.push(`${where} holds an issue without a number`);
        return null;
    }

    const at = `${where}: issue #${raw.number}`;

    if (raw.state !== "open" && raw.state !== "closed") {
        reader.problems.push(`${at} has no \`state\` of open or closed`);
        return null;
    }

    return {
        number: raw.number,
        title: asText(raw.title) ?? "",
        url: asText(raw.url) ?? "",
        state: raw.state,
        reason: raw.reason === "completed" || raw.reason === "not_planned" ? raw.reason : null,
        caps: reader.texts(raw, "caps", at),
        createdAt: asText(raw.createdAt),
        closedAt: asText(raw.closedAt),
        activity: reader.texts(raw, "activity", at),
        blockedBy: reader.list(raw, "blockedBy", at).flatMap((blocker) =>
            isRecord(blocker) && typeof blocker.number === "number"
                ? [
                      {
                          number: blocker.number,
                          open: blocker.open === true,
                          closedAt: asText(blocker.closedAt),
                      },
                  ]
                : [],
        ),
        branch: raw.branch === true,
        owner: raw.owner === true,
    };
};

/** A snapshot read from parsed JSON; a malformed issue is dropped and reported, never thrown on. */
export const readSnapshot = (raw: unknown): { snapshot: Snapshot; problems: string[] } => {
    const reader = new Reader();
    const source = isRecord(raw) ? raw : {};

    if (!isRecord(raw)) reader.problems.push("the file isn't an object");

    const issuesOf = (key: string) =>
        reader
            .list(source, key, "snapshot")
            .flatMap((issue) => readIssue(reader, issue, `\`${key}\``) ?? []);

    const snapshot: Snapshot = {
        syncedAt: reader.text(source, "syncedAt", "snapshot"),
        milestone: reader.text(source, "milestone", "snapshot"),
        issues: issuesOf("issues"),
        noMilestone: issuesOf("noMilestone"),
    };

    return { snapshot, problems: reader.problems };
};
