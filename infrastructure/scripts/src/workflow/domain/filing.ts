import { CAPABILITY_LABEL_PREFIX, OWNER_LABEL, type SnapshotIssue } from "./snapshot.ts";

type Kind = "build" | "spike" | "owner";

/** The part of a template or extra capability filing reads; the portal's invariants validate the rest. */
export interface Block {
    id: string;
    title: string;
    summary: string;
    kind: Kind;
    optional: boolean;
    default: boolean;
    group: string | null;
    dependsOn: string[];
    doneWhen: string[];
    tickets: { title: string; criteria: string[] }[];
}

export interface WorkflowMap {
    blocks: Block[];
    milestone: string;
    area: string | null;
    isOn: (block: Block) => boolean;
    /** Capabilities the project file settles as done or skipped. */
    settled: Set<string>;
}

type Raw = Record<string, unknown>;

const record = (value: unknown): Raw =>
    value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const texts = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const toBlock = (raw: unknown): Block => {
    const block = record(raw);
    const optional = block.optional === true;

    return {
        id: text(block.id),
        title: text(block.title),
        summary: text(block.summary),
        kind: block.kind === "spike" || block.kind === "owner" ? block.kind : "build",
        optional,
        default: optional ? block.default === true : true,
        group: text(block.group) || null,
        dependsOn: texts(block.dependsOn),
        doneWhen: texts(block.doneWhen),
        tickets: list(block.tickets).map((ticket) => ({
            title: text(record(ticket).title),
            criteria: texts(record(ticket).criteria),
        })),
    };
};

/** A parsed template and project file as one map of blocks, with the project's switches applied. */
export const readMap = (template: unknown, project: unknown): WorkflowMap => {
    const source = record(project);
    const switches = record(source.switches);
    const groups = list(record(template).groups).map(record);
    const extras = new Set(list(source.extras).map((extra) => text(record(extra).id)));

    const switchedOn = (id: string, optional: boolean, fallback: boolean): boolean => {
        if (!optional) return true;
        return typeof switches[id] === "boolean" ? switches[id] : fallback;
    };

    const groupOn = (id: string | null): boolean => {
        const group = groups.find((candidate) => candidate.id === id);
        return group
            ? switchedOn(text(group.id), group.optional === true, group.default === true)
            : true;
    };

    return {
        blocks: [...list(record(template).capabilities), ...list(source.extras)].map(toBlock),
        milestone: text(source.milestone),
        area: text(source.area) || null,
        isOn: (block) =>
            groupOn(block.group) &&
            (extras.has(block.id) || switchedOn(block.id, block.optional, block.default)),
        settled: new Set(Object.keys(record(source.settled))),
    };
};

export interface PlannedTicket {
    title: string;
    body: string;
    labels: string[];
    blockedBy: number[];
}

export type Filing = { ok: true; tickets: PlannedTicket[] } | { ok: false; reason: string };

const KIND_LABELS = { build: "enhancement", spike: "spike", owner: OWNER_LABEL } as const;

const bodyOf = (block: Block, criteria: string[]): string =>
    [
        block.summary,
        criteria.length > 0
            ? `**Acceptance criteria:**\n\n${criteria.map((line) => `- [ ] ${line}`).join("\n")}`
            : "",
        `Filed from the workflow map, block \`${block.id}\`.`,
    ]
        .filter(Boolean)
        .join("\n\n");

const numbers = (issues: SnapshotIssue[]): string =>
    issues.map(({ number }) => `#${number}`).join(" ");

/**
 * The tickets one block would get, or why it can't be filed yet: every spike or owner block it
 * needs must be closed, and every build block it needs must have tickets to link to.
 */
export const planFiling = (map: WorkflowMap, issues: SnapshotIssue[], id: string): Filing => {
    const block = map.blocks.find((candidate) => candidate.id === id);
    const live = (cap: string) =>
        issues.filter((issue) => issue.caps.includes(cap) && issue.reason !== "not_planned");

    if (!block) return { ok: false, reason: `\`${id}\` is no block of this project` };
    if (!map.isOn(block)) return { ok: false, reason: `\`${id}\` is switched off` };
    if (map.settled.has(id))
        return { ok: false, reason: `\`${id}\` is settled in the project file` };

    const own = live(id);
    if (own.length > 0) return { ok: false, reason: `\`${id}\` already has ${numbers(own)}` };

    const blockedBy: number[] = [];
    const waits: string[] = [];

    for (const need of block.dependsOn) {
        const dependency = map.blocks.find((candidate) => candidate.id === need);

        if (!dependency || !map.isOn(dependency) || map.settled.has(need)) continue;

        const tickets = live(need);
        const open = tickets.filter(({ state }) => state === "open");

        if (tickets.length === 0) waits.push(`${need} (nothing filed yet)`);
        else if (dependency.kind !== "build" && open.length > 0) {
            waits.push(`${need} (${dependency.kind}, open: ${numbers(open)})`);
        } else blockedBy.push(...open.map(({ number }) => number));
    }

    if (waits.length > 0) {
        return { ok: false, reason: `\`${id}\` waits on ${waits.join("; ")}` };
    }

    const labels = [
        `${CAPABILITY_LABEL_PREFIX}${block.id}`,
        ...(map.area ? [map.area] : []),
        KIND_LABELS[block.kind],
    ];
    const drafts =
        block.tickets.length > 0
            ? block.tickets
            : [{ title: block.title, criteria: block.doneWhen }];

    return {
        ok: true,
        tickets: drafts.map((draft) => ({
            title: draft.title,
            body: bodyOf(block, draft.criteria),
            labels,
            blockedBy: [...new Set(blockedBy)].sort((a, b) => a - b),
        })),
    };
};
