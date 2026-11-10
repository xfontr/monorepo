/** The vocabularies `docs/workflows/README.md` documents, as the one copy every other spelling derives from. */
export const REUSE_PLANS = ["package", "extract", "copy", "method", "new"] as const;
export const KINDS = ["build", "spike", "owner"] as const;
export const SETTLED_STATES = ["done", "skipped"] as const;
export const CAPABILITY_STATES = [
    "off",
    "skipped",
    "waits",
    "can-file",
    "blocked",
    "waiting-on-you",
    "ready",
    "in-flight",
    "done",
] as const;
export const TICKET_STATUSES = [
    "waiting-on-you",
    "ready",
    "in-flight",
    "blocked",
    "done",
    "dropped",
] as const;

export type ReusePlan = (typeof REUSE_PLANS)[number];
export type Kind = (typeof KINDS)[number];
export type SettledState = (typeof SETTLED_STATES)[number];
export type CapabilityState = (typeof CAPABILITY_STATES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];

/** The prefix of the GitHub label that places an issue under a capability. */
export const CAPABILITY_LABEL_PREFIX = "cap:";

/** The GitHub label on a ticket only the project's owner can close: a decision, a credential, DNS. */
export const OWNER_LABEL = "owner";

export interface Lesson {
    text: string;
    issues: number[];
}

export interface SuggestedTicket {
    title: string;
    criteria: string[];
}

export interface Capability {
    id: string;
    stage: string;
    /** A group switches every capability in it off at once, across stages. */
    group: string | null;
    title: string;
    summary: string;
    kind: Kind;
    optional: boolean;
    /** Whether an optional capability starts switched on; always true for a required one. */
    default: boolean;
    dependsOn: string[];
    doneWhen: string[];
    reuse: { plan: ReusePlan; from: string | null } | null;
    lessons: Lesson[];
    tickets: SuggestedTicket[];
}

/** A switchable bundle of capabilities, such as a blog, with no tickets or progress of its own. */
export interface Group {
    id: string;
    title: string;
    summary: string;
    optional: boolean;
    default: boolean;
}

export interface Stage {
    id: string;
    title: string;
    goal: string;
}

export interface Template {
    id: string;
    title: string;
    summary: string;
    stages: Stage[];
    groups: Group[];
    capabilities: Capability[];
}

export interface Project {
    id: string;
    title: string;
    template: string;
    area: string;
    milestone: string;
    summary: string;
    switches: Record<string, boolean>;
    /** `on` is the day it was settled, so a replay of an earlier day doesn't count it yet. */
    settled: Record<string, { status: SettledState; note: string; on: string | null }>;
    extras: Capability[];
}

export interface SnapshotIssue {
    number: number;
    title: string;
    url: string;
    state: "open" | "closed";
    /** GitHub's `state_reason`, so a ticket closed as not planned doesn't count as delivered. */
    reason: "completed" | "not_planned" | null;
    caps: string[];
    /** Null in a snapshot synced before it was recorded, which a replay treats as always filed. */
    createdAt: string | null;
    closedAt: string | null;
    /** The author date of every commit tagged `[#N]` for this issue, ascending. */
    activity: string[];
    /** GitHub's blocked-by links with each blocker's state and close date, since a blocker can sit outside the milestone. */
    blockedBy: { number: number; open: boolean; closedAt: string | null }[];
    /** A branch is linked on the issue, which is how `pnpm issue:pick` marks it as taken. */
    branch: boolean;
    owner: boolean;
}

export interface Snapshot {
    syncedAt: string;
    milestone: string;
    issues: SnapshotIssue[];
    /** Open issues with the project's area label and no milestone, typically filed by hand. */
    noMilestone: SnapshotIssue[];
}

export interface WorkflowProblem {
    file: string;
    message: string;
}

// ── Reading untyped YAML ──────────────────────────────────────────────────────────────────────────

type Raw = Record<string, unknown>;

const isRecord = (value: unknown): value is Raw =>
    value !== null && typeof value === "object" && !Array.isArray(value);

/** YAML reads an unquoted `2026-09-30` as a Date, and a gate written either way means the same day. */
const asText = (value: unknown): string | null => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (value instanceof Date && !Number.isNaN(value.getTime()))
        return value.toISOString().slice(0, 10);
    return null;
};

class Reader {
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

const readCapability = (reader: Reader, raw: unknown, index: number): Capability | null => {
    if (!isRecord(raw)) {
        reader.problems.push(`capability #${index + 1} isn't a mapping`);
        return null;
    }

    const id = reader.text(raw, "id", `capability #${index + 1}`);
    const where = `capability \`${id || index + 1}\``;
    const optional = raw.optional === true;

    let reuse: Capability["reuse"] = null;

    if (raw.reuse !== undefined) {
        const rawReuse = isRecord(raw.reuse) ? raw.reuse : {};
        const plan = asText(rawReuse.plan) ?? "";

        if ((REUSE_PLANS as readonly string[]).includes(plan)) {
            reuse = { plan: plan as ReusePlan, from: asText(rawReuse.from) };
        } else {
            reader.problems.push(
                `${where}: \`reuse.plan: ${plan || "(missing)"}\` isn't one of ${REUSE_PLANS.join(", ")}`,
            );
        }
    }

    const kind = asText(raw.kind) ?? "build";

    if (!(KINDS as readonly string[]).includes(kind)) {
        reader.problems.push(`${where}: \`kind: ${kind}\` isn't one of ${KINDS.join(", ")}`);
    }

    return {
        id,
        stage: reader.text(raw, "stage", where),
        group: asText(raw.group),
        title: reader.text(raw, "title", where),
        summary: reader.text(raw, "summary", where, ""),
        kind: (KINDS as readonly string[]).includes(kind) ? (kind as Kind) : "build",
        optional,
        default: optional ? raw.default === true : true,
        dependsOn: reader.texts(raw, "dependsOn", where),
        doneWhen: reader.texts(raw, "doneWhen", where),
        reuse,
        lessons: reader.list(raw, "lessons", where).flatMap((lesson) =>
            isRecord(lesson)
                ? [
                      {
                          text: reader.text(lesson, "text", `${where} lesson`),
                          issues: reader
                              .list(lesson, "issues", `${where} lesson`)
                              .filter((issue): issue is number => typeof issue === "number"),
                      },
                  ]
                : [],
        ),
        tickets: reader.list(raw, "tickets", where).flatMap((ticket) =>
            isRecord(ticket)
                ? [
                      {
                          title: reader.text(ticket, "title", `${where} ticket`),
                          criteria: reader.texts(ticket, "criteria", `${where} ticket`),
                      },
                  ]
                : [],
        ),
    };
};

/** The first loop of `dependsOn` links found, as the ids walked round it, or null when there is none. */
export const dependencyCycle = (capabilities: Capability[]): string[] | null => {
    const needs = new Map(capabilities.map(({ id, dependsOn }) => [id, dependsOn]));
    const finished = new Set<string>();
    const path: string[] = [];

    const walk = (id: string): string[] | null => {
        const at = path.indexOf(id);

        if (at >= 0) return [...path.slice(at), id];
        if (finished.has(id) || !needs.has(id)) return null;

        path.push(id);
        for (const need of needs.get(id) ?? []) {
            const cycle = walk(need);
            if (cycle) return cycle;
        }
        path.pop();
        finished.add(id);

        return null;
    };

    for (const { id } of capabilities) {
        const cycle = walk(id);
        if (cycle) return cycle;
    }

    return null;
};

const cycleProblem = (capabilities: Capability[]): string[] => {
    const cycle = dependencyCycle(capabilities);
    return cycle ? [`\`dependsOn\` goes round in a loop: ${cycle.join(" → ")}`] : [];
};

const duplicates = (ids: string[]): string[] =>
    [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort((a, b) =>
        a.localeCompare(b),
    );

const templateRuleProblems = ({ stages, groups, capabilities }: Template): string[] => {
    const problems: string[] = [];
    const stageIds = new Set(stages.map((stage) => stage.id));
    const groupIds = new Set(groups.map((group) => group.id));
    const capabilityIds = new Set(capabilities.map((capability) => capability.id));

    for (const id of duplicates(groups.map((group) => group.id))) {
        problems.push(`group \`${id}\` is declared twice`);
    }

    for (const id of groupIds) {
        if (capabilityIds.has(id)) {
            problems.push(
                `group \`${id}\` shares its id with a capability, so a switch can't tell them apart`,
            );
        }
    }

    for (const id of duplicates(stages.map((stage) => stage.id))) {
        problems.push(`stage \`${id}\` is declared twice`);
    }

    for (const id of duplicates(capabilities.map((capability) => capability.id))) {
        problems.push(`capability \`${id}\` is declared twice`);
    }

    for (const capability of capabilities) {
        if (capability.stage && !stageIds.has(capability.stage)) {
            problems.push(
                `capability \`${capability.id}\` names stage \`${capability.stage}\`, which the template doesn't have`,
            );
        }

        if (capability.group && !groupIds.has(capability.group)) {
            problems.push(
                `capability \`${capability.id}\` names group \`${capability.group}\`, which the template doesn't have`,
            );
        }

        for (const dependency of capability.dependsOn) {
            if (!capabilityIds.has(dependency)) {
                problems.push(
                    `capability \`${capability.id}\` depends on \`${dependency}\`, which the template doesn't have`,
                );
            }
        }
    }

    return [...problems, ...cycleProblem(capabilities)];
};

/** A template read from parsed YAML, and everything about it that breaks the rules. */
export const readTemplate = (raw: unknown): { template: Template; problems: string[] } => {
    const reader = new Reader();
    const source = isRecord(raw) ? raw : {};

    if (!isRecord(raw)) reader.problems.push("the file isn't a mapping");

    const stages = reader.list(source, "stages", "template").flatMap((stage, index) => {
        if (!isRecord(stage)) {
            reader.problems.push(`stage #${index + 1} isn't a mapping`);
            return [];
        }

        const id = reader.text(stage, "id", `stage #${index + 1}`);
        const where = `stage \`${id || index + 1}\``;

        return [
            {
                id,
                title: reader.text(stage, "title", where),
                goal: reader.text(stage, "goal", where, ""),
            },
        ];
    });

    const groups = reader.list(source, "groups", "template").flatMap((group, index) => {
        if (!isRecord(group)) {
            reader.problems.push(`group #${index + 1} isn't a mapping`);
            return [];
        }

        const id = reader.text(group, "id", `group #${index + 1}`);
        const where = `group \`${id || index + 1}\``;
        const optional = group.optional === true;

        return [
            {
                id,
                title: reader.text(group, "title", where),
                summary: reader.text(group, "summary", where, ""),
                optional,
                default: optional ? group.default === true : true,
            },
        ];
    });

    const capabilities = reader
        .list(source, "capabilities", "template")
        .flatMap((capability, index) => readCapability(reader, capability, index) ?? []);

    const template: Template = {
        id: reader.text(source, "id", "template"),
        title: reader.text(source, "title", "template"),
        summary: reader.text(source, "summary", "template", ""),
        stages,
        groups,
        capabilities,
    };

    return { template, problems: [...reader.problems, ...templateRuleProblems(template)] };
};

/**
 * A project read from parsed YAML. Rules that need its template — a switch on a capability that
 * doesn't exist — live in `projectProblems`, because the template may be the broken file.
 */
export const readProject = (raw: unknown): { project: Project; problems: string[] } => {
    const reader = new Reader();
    const source = isRecord(raw) ? raw : {};

    if (!isRecord(raw)) reader.problems.push("the file isn't a mapping");

    const switches: Record<string, boolean> = {};

    for (const [id, value] of Object.entries(reader.record(source, "switches", "project"))) {
        if (typeof value === "boolean") switches[id] = value;
        else reader.problems.push(`switch \`${id}\` must be true or false`);
    }

    if (source.gates !== undefined) {
        reader.problems.push(
            "`gates:` is gone: a gate is an `owner` block now, approved by closing its ticket or settling it as done",
        );
    }

    const settled: Project["settled"] = {};

    for (const [id, value] of Object.entries(reader.record(source, "settled", "project"))) {
        const entry = isRecord(value) ? value : {};
        const status = asText(entry.status) ?? "";

        if ((SETTLED_STATES as readonly string[]).includes(status)) {
            const on = asText(entry.on);

            if (on !== null && !/^\d{4}-\d{2}-\d{2}$/.test(on)) {
                reader.problems.push(`settled \`${id}\`: \`on\` must be a YYYY-MM-DD date`);
            }
            settled[id] = { status: status as SettledState, note: asText(entry.note) ?? "", on };
        } else {
            reader.problems.push(
                `settled \`${id}\`: \`status: ${status || "(missing)"}\` isn't one of ${SETTLED_STATES.join(", ")}`,
            );
        }
    }

    const extras = reader
        .list(source, "extras", "project")
        .flatMap((capability, index) => readCapability(reader, capability, index) ?? []);

    const project: Project = {
        id: reader.text(source, "id", "project"),
        title: reader.text(source, "title", "project"),
        template: reader.text(source, "template", "project"),
        area: reader.text(source, "area", "project", ""),
        milestone: reader.text(source, "milestone", "project"),
        summary: reader.text(source, "summary", "project", ""),
        switches,
        settled,
        extras,
    };

    return { project, problems: reader.problems };
};

const switchedOn = (switchable: Group | Capability, project: Project): boolean =>
    switchable.optional ? (project.switches[switchable.id] ?? switchable.default) : true;

/** Whether a group is on in a project; a capability outside any group is never held back by one. */
export const isGroupEnabled = (
    id: string | null,
    project: Project,
    template: Template,
): boolean => {
    const group = template.groups.find((candidate) => candidate.id === id);
    return group ? switchedOn(group, project) : true;
};

export const isEnabled = (capability: Capability, project: Project, template: Template): boolean =>
    isGroupEnabled(capability.group, project, template) && switchedOn(capability, project);

/** What a project says about its template that the template doesn't back up. */
export const projectProblems = (project: Project, template: Template): string[] => {
    const problems: string[] = [];
    const byId = new Map(template.capabilities.map((capability) => [capability.id, capability]));
    const stageIds = new Set(template.stages.map((stage) => stage.id));

    const groupsById = new Map(template.groups.map((group) => [group.id, group]));

    for (const id of Object.keys(project.switches)) {
        const switchable = byId.get(id) ?? groupsById.get(id);

        if (!switchable)
            problems.push(`switch \`${id}\` names no capability or group in \`${template.id}\``);
        else if (!switchable.optional)
            problems.push(
                `switch \`${id}\` is on a required ${byId.has(id) ? "capability" : "group"}`,
            );
    }

    const extraIds = new Set(project.extras.map((extra) => extra.id));

    for (const id of Object.keys(project.settled)) {
        if (!byId.has(id) && !extraIds.has(id)) {
            problems.push(`settled \`${id}\` names no capability`);
        }
    }

    const all = [...template.capabilities, ...project.extras];

    for (const extra of project.extras) {
        if (byId.has(extra.id)) problems.push(`extra \`${extra.id}\` reuses a template id`);
        if (extra.group && !groupsById.has(extra.group)) {
            problems.push(
                `extra \`${extra.id}\` names group \`${extra.group}\`, which doesn't exist`,
            );
        }
        if (!stageIds.has(extra.stage)) {
            problems.push(
                `extra \`${extra.id}\` names stage \`${extra.stage}\`, which doesn't exist`,
            );
        }
        for (const dependency of extra.dependsOn) {
            if (!byId.has(dependency) && !extraIds.has(dependency)) {
                problems.push(
                    `extra \`${extra.id}\` depends on \`${dependency}\`, which doesn't exist`,
                );
            }
        }
    }

    return project.extras.length > 0 ? [...problems, ...cycleProblem(all)] : problems;
};

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

// ── The derived view ──────────────────────────────────────────────────────────────────────────────

export interface CapabilityView extends Capability {
    state: CapabilityState;
    enabled: boolean;
    extra: boolean;
    note: string | null;
    /** Its tickets as of the day viewed: filed by then, with their state on that day. */
    issues: SnapshotIssue[];
    /** What it needs once switched-off blocks are taken out: their own needs take their place. */
    needs: string[];
    /** The blocks that need it, after the same re-routing. */
    unblocks: string[];
    /** The needs that aren't finished, which is why it is blocked or can't be filed yet. */
    waitingOn: string[];
    /** Unfinished blocks behind it, directly or through others. */
    unblockCount: number;
}

export interface StageView extends Stage {
    capabilities: CapabilityView[];
    progress: Progress;
}

export interface Progress {
    done: number;
    total: number;
    percent: number;
}

export interface UnsortedIssue {
    issue: SnapshotIssue;
    reason: string;
}

/** One switch in a project's plan: a group of blocks such as a blog, or a single optional block. */
export interface Feature {
    id: string;
    title: string;
    summary: string;
    enabled: boolean;
    /** Titles of the blocks it brings in. */
    blocks: string[];
    /** The feature it sits inside, which has to be on for this one to be. */
    within: string | null;
}

export interface ProjectView {
    project: Project;
    template: Template;
    /** Kept so the page can lay the same project over another day. */
    snapshot: Snapshot | null;
    /** The day viewed, or null for the snapshot as synced. */
    asOf: string | null;
    features: Feature[];
    stages: StageView[];
    capabilities: CapabilityView[];
    /** Every unfinished block, what needs the owner first, then most-unblocking first. */
    left: CapabilityView[];
    counts: Record<CapabilityState, number>;
    /** The longest chain of unfinished blocks, which decides when the project can finish. */
    critical: string[];
    unsorted: UnsortedIssue[];
    progress: Progress;
    syncedAt: string | null;
}

const progressOf = (capabilities: CapabilityView[]): Progress => {
    const counted = capabilities.filter(
        (capability) => capability.state !== "off" && capability.state !== "skipped",
    );
    const done = counted.filter((capability) => capability.state === "done").length;

    return {
        done,
        total: counted.length,
        percent: counted.length === 0 ? 0 : Math.round((done / counted.length) * 100),
    };
};

const day = (timestamp: string): string => timestamp.slice(0, 10);

/**
 * An issue as it stood at the end of `asOf`, or null if it wasn't filed yet. A linked branch is
 * only known for the day of the sync, so an earlier day goes by commits alone.
 */
export const issueAsOf = (
    issue: SnapshotIssue,
    asOf: string | null,
    syncedOn: string | null,
): SnapshotIssue | null => {
    if (asOf === null) return issue;
    if (issue.createdAt && day(issue.createdAt) > asOf) return null;

    const closed = issue.closedAt !== null && day(issue.closedAt) <= asOf;

    return {
        ...issue,
        state: closed ? "closed" : "open",
        reason: closed ? issue.reason : null,
        activity: issue.activity.filter((commit) => commit <= asOf),
        blockedBy: issue.blockedBy.map((blocker) => ({
            ...blocker,
            open: blocker.closedAt ? day(blocker.closedAt) > asOf : blocker.open,
        })),
        branch: issue.branch && syncedOn !== null && asOf >= syncedOn,
    };
};

/** The first day a commit names one of the project's tickets, and the day of its last sync. */
export const replayRange = (snapshot: Snapshot | null): { first: string; last: string } | null => {
    const days = (snapshot?.issues ?? [])
        .flatMap((issue) => issue.activity)
        .sort((a, b) => a.localeCompare(b));
    if (!snapshot?.syncedAt || days.length === 0) return null;

    return { first: days[0]!, last: day(snapshot.syncedAt) };
};

export const ticketStatus = (issue: SnapshotIssue): TicketStatus => {
    if (issue.state === "closed") return issue.reason === "not_planned" ? "dropped" : "done";
    if (issue.branch || issue.activity.length > 0) return "in-flight";
    if (issue.blockedBy.some(({ open }) => open)) return "blocked";
    return issue.owner ? "waiting-on-you" : "ready";
};

/** What needs the owner first, then what an agent can take, then what can't move yet. */
const LEFT_ORDER: CapabilityState[] = [
    "waiting-on-you",
    "ready",
    "in-flight",
    "can-file",
    "blocked",
    "waits",
];

const FINISHED = new Set<CapabilityState>(["done", "skipped", "off"]);

const featuresOf = (project: Project, template: Template): Feature[] => {
    const titles = (ids: Capability[]) => ids.map(({ title }) => title);

    return [
        ...template.groups
            .filter((group) => group.optional)
            .map((group) => ({
                id: group.id,
                title: group.title,
                summary: group.summary,
                enabled: isGroupEnabled(group.id, project, template),
                blocks: titles(
                    template.capabilities.filter((c) => c.group === group.id && !c.optional),
                ),
                within: null,
            })),
        ...template.capabilities
            .filter((capability) => capability.optional)
            .map((capability) => ({
                id: capability.id,
                title: capability.title,
                summary: capability.summary,
                enabled: switchedOn(capability, project),
                blocks: [capability.title],
                within: template.groups.some((g) => g.id === capability.group && g.optional)
                    ? capability.group
                    : null,
            })),
    ];
};

/** One project laid over its template and its last GitHub snapshot, as of a day or as synced. */
export const projectView = (
    project: Project,
    template: Template,
    snapshot: Snapshot | null,
    asOf: string | null = null,
): ProjectView => {
    const syncedOn = snapshot?.syncedAt ? day(snapshot.syncedAt) : null;
    const issues = (snapshot?.issues ?? []).flatMap(
        (issue) => issueAsOf(issue, asOf, syncedOn) ?? [],
    );
    const extraIds = new Set(project.extras.map((extra) => extra.id));
    const all = [...template.capabilities, ...project.extras];
    const byId = new Map(all.map((capability) => [capability.id, capability]));
    const enabled = new Map(
        all.map((capability) => [
            capability.id,
            extraIds.has(capability.id)
                ? isGroupEnabled(capability.group, project, template)
                : isEnabled(capability, project, template),
        ]),
    );

    // A switched-off block leaves the map, and whatever needed it waits on what it needed instead.
    const needsOf = (id: string, seen: Set<string>): string[] =>
        (byId.get(id)?.dependsOn ?? []).flatMap((need) => {
            if (!byId.has(need) || seen.has(need)) return [];
            return enabled.get(need) ? [need] : needsOf(need, new Set([...seen, need]));
        });
    const needs = new Map(
        all.map(({ id }) => [id, enabled.get(id) ? [...new Set(needsOf(id, new Set([id])))] : []]),
    );
    const dependents = new Map(all.map(({ id }) => [id, [] as string[]]));
    for (const [id, list] of needs) for (const need of list) dependents.get(need)?.push(id);

    const live = new Map(
        all.map(({ id }) => [
            id,
            issues.filter((issue) => issue.caps.includes(id) && issue.reason !== "not_planned"),
        ]),
    );

    const settledFor = (id: string) => {
        const settled = project.settled[id];
        return settled && (!settled.on || asOf === null || settled.on <= asOf) ? settled : null;
    };

    const finished = new Map<string, boolean>();
    const isFinished = (id: string): boolean => {
        const known = finished.get(id);
        if (known !== undefined) return known;

        const settled = settledFor(id);
        const tickets = live.get(id) ?? [];
        const result =
            !enabled.get(id) ||
            settled !== null ||
            (tickets.length > 0 && tickets.every(({ state }) => state === "closed"));

        finished.set(id, result);
        return result;
    };

    const stateOf = (capability: Capability): CapabilityState => {
        const { id } = capability;
        if (!enabled.get(id)) return "off";

        const settled = settledFor(id);
        if (settled) return settled.status;

        const tickets = live.get(id) ?? [];
        if (tickets.length > 0 && tickets.every(({ state }) => state === "closed")) return "done";

        const open = (needs.get(id) ?? []).filter((need) => !isFinished(need));
        const openTickets = tickets.filter(({ state }) => state === "open");

        if (openTickets.length === 0) {
            if (capability.kind === "owner" && open.length === 0) return "waiting-on-you";

            // Decide before you file: an open spike or owner block holds filing back, and a build
            // block holds it back only until it has tickets to link to.
            const holding = open.filter(
                (need) => byId.get(need)?.kind !== "build" || (live.get(need) ?? []).length === 0,
            );
            return holding.length > 0 ? "waits" : "can-file";
        }

        const statuses = openTickets.map(ticketStatus);
        if (statuses.includes("in-flight")) return "in-flight";
        if (open.length > 0 || statuses.every((status) => status === "blocked")) return "blocked";
        if (capability.kind === "owner" || statuses.includes("waiting-on-you")) {
            return "waiting-on-you";
        }
        return "ready";
    };

    const states = new Map(all.map((capability) => [capability.id, stateOf(capability)]));
    const isOpen = (id: string) => !FINISHED.has(states.get(id) ?? "off");

    const unblockCount = (id: string): number => {
        const seen = new Set<string>();
        const queue = [...(dependents.get(id) ?? [])];

        for (let next = queue.pop(); next !== undefined; next = queue.pop()) {
            if (seen.has(next) || !isOpen(next)) continue;
            seen.add(next);
            queue.push(...(dependents.get(next) ?? []));
        }

        return seen.size;
    };

    const views: CapabilityView[] = all.map((capability) => ({
        ...capability,
        enabled: enabled.get(capability.id) ?? false,
        extra: extraIds.has(capability.id),
        note: project.settled[capability.id]?.note || null,
        issues: issues.filter((issue) => issue.caps.includes(capability.id)),
        state: states.get(capability.id) ?? "off",
        needs: needs.get(capability.id) ?? [],
        unblocks: dependents.get(capability.id) ?? [],
        waitingOn: isOpen(capability.id)
            ? (needs.get(capability.id) ?? []).filter((need) => !isFinished(need))
            : [],
        unblockCount: unblockCount(capability.id),
    }));
    const viewById = new Map(views.map((view) => [view.id, view]));

    const chains = new Map<string, string[]>();
    const chainFrom = (id: string, walking: Set<string>): string[] => {
        const known = chains.get(id);
        if (known) return known;

        const next = (dependents.get(id) ?? [])
            .filter((dependent) => isOpen(dependent) && !walking.has(dependent))
            .map((dependent) => chainFrom(dependent, new Set([...walking, dependent])))
            .sort((a, b) => b.length - a.length)[0];
        const chain = [id, ...(next ?? [])];

        chains.set(id, chain);
        return chain;
    };
    const critical =
        views
            .filter((view) => isOpen(view.id) && view.waitingOn.length === 0)
            .map((view) => chainFrom(view.id, new Set([view.id])))
            .sort((a, b) => b.length - a.length)[0] ?? [];

    const stages: StageView[] = template.stages.map((stage) => {
        const capabilities = views.filter((capability) => capability.stage === stage.id);
        return { ...stage, capabilities, progress: progressOf(capabilities) };
    });

    const left = views
        .filter((view) => isOpen(view.id))
        .sort(
            (a, b) =>
                LEFT_ORDER.indexOf(a.state) - LEFT_ORDER.indexOf(b.state) ||
                b.unblockCount - a.unblockCount,
        );

    const counts = Object.fromEntries(
        CAPABILITY_STATES.map((state) => [
            state,
            views.filter((view) => view.state === state).length,
        ]),
    ) as Record<CapabilityState, number>;

    const unsorted: UnsortedIssue[] = issues.flatMap((issue) => {
        if (issue.caps.length === 0) {
            return [{ issue, reason: `no ${CAPABILITY_LABEL_PREFIX} label` }];
        }

        const group = template.groups.find(({ id }) => issue.caps.includes(id));
        if (group) {
            return [
                { issue, reason: `${group.id} is a group; label one of its capabilities instead` },
            ];
        }

        const unknown = issue.caps.filter((cap) => !viewById.has(cap));
        if (unknown.length > 0) {
            return [{ issue, reason: `unknown capability ${unknown.join(", ")}` }];
        }

        // A closed ticket on a capability later dropped is history, not something left to place.
        if (issue.state === "open" && issue.caps.every((cap) => !enabled.get(cap))) {
            return [{ issue, reason: "its capability is switched off" }];
        }

        return [];
    });

    // Once everything switched on is delivered, an area issue outside the milestone is maintenance.
    const strays: UnsortedIssue[] =
        asOf === null && left.length > 0
            ? (snapshot?.noMilestone ?? []).map((issue) => ({
                  issue,
                  reason: "not in the milestone",
              }))
            : [];

    return {
        project,
        template,
        snapshot,
        asOf,
        features: featuresOf(project, template),
        stages,
        capabilities: views,
        left,
        counts,
        critical,
        unsorted: [...unsorted, ...strays],
        progress: progressOf(views),
        syncedAt: snapshot?.syncedAt ?? null,
    };
};

// ── Assembling a directory ────────────────────────────────────────────────────────────────────────

export type ParsedFile = { file: string } & (
    { ok: true; value: unknown } | { ok: false; error: string }
);

export interface Workflows {
    templates: Template[];
    projects: ProjectView[];
    problems: WorkflowProblem[];
}

/**
 * Every template and project, each project laid over its template and snapshot, keyed by project
 * id. The caller reads and parses the files; a broken one becomes a problem rather than a throw, so
 * one bad edit never blanks the page.
 */
export const assembleWorkflows = (
    templateFiles: ParsedFile[],
    projectFiles: ParsedFile[],
    snapshotFiles: Record<string, ParsedFile>,
): Workflows => {
    const problems: WorkflowProblem[] = [];
    const templates: Template[] = [];

    const snapshotOf = (parsed: ParsedFile | undefined): Snapshot | null => {
        if (!parsed) return null;

        const where = `projects/${parsed.file}`;

        if (!parsed.ok) {
            problems.push({ file: where, message: parsed.error });
            return null;
        }

        const { snapshot, problems: found } = readSnapshot(parsed.value);

        problems.push(...found.map((message) => ({ file: where, message })));
        return snapshot;
    };

    for (const parsed of templateFiles) {
        const where = `templates/${parsed.file}`;

        if (!parsed.ok) {
            problems.push({ file: where, message: parsed.error });
            continue;
        }

        const { template, problems: found } = readTemplate(parsed.value);

        problems.push(...found.map((message) => ({ file: where, message })));
        if (`${template.id}.yaml` !== parsed.file) {
            problems.push({
                file: where,
                message: `\`id: ${template.id}\` doesn't match the filename`,
            });
        }
        if (template.id) templates.push(template);
    }

    const projects: ProjectView[] = [];

    for (const parsed of projectFiles) {
        const where = `projects/${parsed.file}`;

        if (!parsed.ok) {
            problems.push({ file: where, message: parsed.error });
            continue;
        }

        const { project, problems: found } = readProject(parsed.value);
        problems.push(...found.map((message) => ({ file: where, message })));

        if (`${project.id}.yaml` !== parsed.file) {
            problems.push({
                file: where,
                message: `\`id: ${project.id}\` doesn't match the filename`,
            });
        }

        const template = templates.find((candidate) => candidate.id === project.template);

        if (!template) {
            problems.push({
                file: where,
                message: `\`template: ${project.template}\` names no template`,
            });
            continue;
        }

        problems.push(
            ...projectProblems(project, template).map((message) => ({ file: where, message })),
        );
        projects.push(projectView(project, template, snapshotOf(snapshotFiles[project.id])));
    }

    return { templates, projects, problems };
};
