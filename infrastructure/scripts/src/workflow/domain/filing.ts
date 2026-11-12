import { CAPABILITY_LABEL_PREFIX, OWNER_LABEL, type SnapshotIssue } from "./snapshot.ts";

type Kind = "build" | "spike" | "owner";

export const TICKET_SIZES = ["block", "stage", "lean"] as const;
export type TicketSize = (typeof TICKET_SIZES)[number];

/** The part of a template or extra capability filing reads; the portal's invariants validate the rest. */
export interface Block {
    id: string;
    stage: string;
    title: string;
    summary: string;
    kind: Kind;
    optional: boolean;
    default: boolean;
    group: string | null;
    dependsOn: string[];
    doneWhen: string[];
    tickets: { title: string; criteria: string[] }[];
    /** The template's Fibonacci estimate for the whole block. */
    complexity: number | null;
    reuse: { plan: string; from: string | null } | null;
    lessons: { text: string; issues: number[] }[];
}

export interface WorkflowMap {
    blocks: Block[];
    milestone: string;
    area: string | null;
    ticketSize: TicketSize;
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
        stage: text(block.stage),
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
        complexity: typeof block.complexity === "number" ? block.complexity : null,
        reuse:
            block.reuse === undefined
                ? null
                : {
                      plan: text(record(block.reuse).plan),
                      from: text(record(block.reuse).from) || null,
                  },
        lessons: list(block.lessons).map((lesson) => ({
            text: text(record(lesson).text),
            issues: list(record(lesson).issues).filter(
                (issue): issue is number => typeof issue === "number",
            ),
        })),
    };
};

/** A parsed template and project file as one map of blocks, with the project's switches applied. */
export const readMap = (template: unknown, project: unknown): WorkflowMap => {
    const source = record(project);
    const switches = record(source.switches);
    const groups = list(record(template).groups).map(record);
    const extras = new Set(list(source.extras).map((extra) => text(record(extra).id)));
    const size = text(source.ticketSize);

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
        ticketSize: (TICKET_SIZES as readonly string[]).includes(size)
            ? (size as TicketSize)
            : "block",
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
    complexity: number | null;
}

export type Filing = { ok: true; tickets: PlannedTicket[] } | { ok: false; reason: string };

export const KIND_LABELS = { build: "enhancement", spike: "spike", owner: OWNER_LABEL } as const;

const checklist = (criteria: string[]): string =>
    criteria.length > 0
        ? `**Acceptance criteria:**\n\n${criteria.map((line) => `- [ ] ${line}`).join("\n")}`
        : "";

// The same words as the portal's block panel, which a reader sees before the ticket.
const REUSE_LABELS: Record<string, string> = {
    package: "Import the package",
    extract: "Extract to a package",
    copy: "Copy and adapt",
    method: "Follow the method",
};

const startFrom = ({ reuse }: Block): string => {
    const label = reuse ? REUSE_LABELS[reuse.plan] : undefined;
    if (!label) return "";
    return `**Start from:** ${label}${reuse?.from ? ` \`${reuse.from}\`` : ""}.`;
};

const lessonsOf = ({ lessons }: Block): string =>
    lessons.length > 0
        ? `**Lessons from earlier projects:**\n\n${lessons
              .map(({ text, issues }) =>
                  issues.length > 0
                      ? `- ${text} (${issues.map((issue) => `#${issue}`).join(", ")})`
                      : `- ${text}`,
              )
              .join("\n")}`
        : "";

/** What an agent needs to start without opening the template: the ask, the bar, the precedent, the traps. */
const detailsOf = (block: Block, criteria: string[]): string[] => [
    block.summary,
    checklist(criteria),
    startFrom(block),
    lessonsOf(block),
];

const bodyOf = (block: Block, criteria: string[]): string =>
    [...detailsOf(block, criteria), `Filed from the workflow map, block \`${block.id}\`.`]
        .filter(Boolean)
        .join("\n\n");

const criteriaOf = (block: Block): string[] =>
    block.tickets.length > 0 ? block.tickets.flatMap(({ criteria }) => criteria) : block.doneWhen;

const bundleBodyOf = (blocks: Block[]): string =>
    [
        ...blocks.map((block) =>
            [`### ${block.title}`, ...detailsOf(block, criteriaOf(block))]
                .filter(Boolean)
                .join("\n\n"),
        ),
        `Filed from the workflow map, blocks ${blocks.map(({ id }) => `\`${id}\``).join(", ")}.`,
    ].join("\n\n");

const numbers = (issues: SnapshotIssue[]): string =>
    issues.map(({ number }) => `#${number}`).join(" ");

const liveTickets = (issues: SnapshotIssue[], cap: string) =>
    issues.filter((issue) => issue.caps.includes(cap) && issue.reason !== "not_planned");

type Check = { ok: true; blockedBy: number[] } | { ok: false; reason: string };

/** The switched-on blocks `block` needs, reading through each switched-off one to what it needed. */
const needsOf = (map: WorkflowMap, block: Block, seen: Set<string>): Block[] => [
    ...new Set(
        block.dependsOn.flatMap((need) => {
            const dependency = map.blocks.find((candidate) => candidate.id === need);
            if (!dependency || seen.has(need)) return [];

            return map.isOn(dependency)
                ? [dependency]
                : needsOf(map, dependency, new Set([...seen, need]));
        }),
    ),
];

/** Whether one block can be filed alongside `inside`, whose members it needs nothing from GitHub for. */
const checkBlock = (
    map: WorkflowMap,
    issues: SnapshotIssue[],
    id: string,
    inside: Set<string>,
): Check => {
    const block = map.blocks.find((candidate) => candidate.id === id);

    if (!block) return { ok: false, reason: `\`${id}\` is no block of this project` };
    if (!map.isOn(block)) return { ok: false, reason: `\`${id}\` is switched off` };
    if (map.settled.has(id))
        return { ok: false, reason: `\`${id}\` is settled in the project file` };

    const own = liveTickets(issues, id);
    if (own.length > 0) return { ok: false, reason: `\`${id}\` already has ${numbers(own)}` };

    const blockedBy: number[] = [];
    const waits: string[] = [];

    for (const dependency of needsOf(map, block, new Set([id]))) {
        const need = dependency.id;
        if (inside.has(need) || map.settled.has(need)) continue;

        const tickets = liveTickets(issues, need);
        const open = tickets.filter(({ state }) => state === "open");

        if (tickets.length === 0) waits.push(`${need} (nothing filed yet)`);
        else if (dependency.kind !== "build" && open.length > 0) {
            waits.push(`${need} (${dependency.kind}, open: ${numbers(open)})`);
        } else blockedBy.push(...open.map(({ number }) => number));
    }

    return waits.length > 0
        ? { ok: false, reason: `\`${id}\` waits on ${waits.join("; ")}` }
        : { ok: true, blockedBy };
};

/**
 * The tickets one block would get, or the one ticket several blocks would share, or why not yet:
 * every spike or owner block they need must be closed, and every build block they need must have
 * tickets to link to unless it is filed in the same ticket.
 */
export const planFiling = (map: WorkflowMap, issues: SnapshotIssue[], ids: string[]): Filing => {
    const inside = new Set(ids);
    const blocks = map.blocks.filter(({ id }) => inside.has(id));
    const kinds = new Set(blocks.map(({ kind }) => kind));

    // A spike's answer reshapes later tickets and an owner block is closed by the owner, so
    // neither shares a ticket with build work.
    if (ids.length > 1 && (kinds.size > 1 || kinds.has("owner"))) {
        return {
            ok: false,
            reason: "only build blocks share a ticket with each other, and spikes with spikes",
        };
    }

    const blockedBy = new Set<number>();

    for (const id of ids) {
        const check = checkBlock(map, issues, id, inside);
        if (!check.ok) return check;
        for (const number of check.blockedBy) blockedBy.add(number);
    }

    const links = [...blockedBy].sort((a, b) => a - b);
    const labels = (members: Block[]) => [
        ...members.map(({ id }) => `${CAPABILITY_LABEL_PREFIX}${id}`),
        ...(map.area ? [map.area] : []),
        KIND_LABELS[members[0]?.kind ?? "build"],
    ];

    const [only] = blocks;

    if (blocks.length === 1 && only) {
        const drafts =
            only.tickets.length > 0
                ? only.tickets
                : [{ title: only.title, criteria: only.doneWhen }];

        return {
            ok: true,
            tickets: drafts.map((draft) => ({
                title: draft.title,
                body: bodyOf(only, draft.criteria),
                labels: labels(blocks),
                blockedBy: links,
                // Each suggested ticket would otherwise carry the whole block's estimate.
                complexity: drafts.length === 1 ? only.complexity : null,
            })),
        };
    }

    return {
        ok: true,
        tickets: [
            {
                title: blocks.map(({ title }) => title).join(", "),
                body: bundleBodyOf(blocks),
                labels: labels(blocks),
                blockedBy: links,
                complexity: blocks.some(({ complexity }) => complexity !== null)
                    ? blocks.reduce((sum, { complexity }) => sum + (complexity ?? 0), 0)
                    : null,
            },
        ],
    };
};

/** Mirrored by `bundlesOf` in the portal's `shared/ticketSize.ts`; change both together. */
export const bundlesOf = (blocks: Block[], size: TicketSize): string[][] => {
    if (size === "block") return blocks.map(({ id }) => [id]);

    const byId = new Map(blocks.map((block) => [block.id, block]));
    const levels = new Map<string, number>();

    const levelOf = (id: string, walking: Set<string>): number => {
        const known = levels.get(id);
        if (known !== undefined) return known;

        const block = byId.get(id);
        if (!block) return 0;

        const level = Math.max(
            0,
            ...block.dependsOn.flatMap((need) => {
                const dependency = byId.get(need);
                if (!dependency || dependency.stage !== block.stage || walking.has(need)) return [];

                const behind = levelOf(need, new Set([...walking, need]));
                return [
                    block.kind !== "build" && dependency.kind === "build" ? behind + 1 : behind,
                ];
            }),
        );

        levels.set(id, level);
        return level;
    };

    const keyOf = (block: Block): string => {
        if (block.kind === "owner") return `owner:${block.id}`;
        if (block.kind === "spike") return size === "lean" ? "spike" : `spike:${block.id}`;
        return `build:${block.stage}:${levelOf(block.id, new Set([block.id]))}`;
    };

    const bundles = new Map<string, string[]>();
    for (const block of blocks) {
        const key = keyOf(block);
        bundles.set(key, [...(bundles.get(key) ?? []), block.id]);
    }

    return [...bundles.values()];
};

/** The blocks of the map still to file: on, unsettled and with no live ticket. */
export const toFile = (map: WorkflowMap, issues: SnapshotIssue[]): Block[] =>
    map.blocks.filter(
        (block) =>
            map.isOn(block) &&
            !map.settled.has(block.id) &&
            liveTickets(issues, block.id).length === 0,
    );

export interface Bundle {
    ids: string[];
    /** Members of the size's bundle that can't be filed yet, each with why. */
    later: string[];
}

/**
 * The blocks the project's ticket size files together with `id`: its bundle, less the members
 * that still wait. `id` itself is always kept, so `planFiling` reports why it can't go yet.
 */
export const bundleFor = (map: WorkflowMap, issues: SnapshotIssue[], id: string): Bundle => {
    const bundle = bundlesOf(toFile(map, issues), map.ticketSize).find((ids) => ids.includes(id));
    let ids = bundle ?? [id];
    const later: string[] = [];

    for (let changed = true; changed;) {
        changed = false;
        const inside = new Set(ids);

        for (const member of ids) {
            const check = checkBlock(map, issues, member, inside);

            if (member !== id && !check.ok) {
                later.push(check.reason);
                ids = ids.filter((kept) => kept !== member);
                changed = true;
                break;
            }
        }
    }

    return { ids, later };
};
