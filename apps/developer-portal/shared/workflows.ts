/** The vocabularies `docs/workflows/README.md` documents, as the one copy every other spelling derives from. */
export const REUSE_PLANS = ["package", "extract", "copy", "method", "new"] as const;
export const KINDS = ["build", "spike", "owner"] as const;
export const SETTLED_STATES = ["done", "skipped"] as const;
export const CAPABILITY_STATES = [
    "off",
    "skipped",
    "waits",
    "can-file",
    "planned",
    "in-progress",
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
    settled: Record<string, { status: SettledState; note: string }>;
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
    closedAt: string | null;
    /** The author date of every commit tagged `[#N]` for this issue, ascending. */
    activity: string[];
    /** GitHub's blocked-by links, each with its blocker's state, since a blocker can sit outside the milestone. */
    blockedBy: { number: number; open: boolean }[];
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
            settled[id] = { status: status as SettledState, note: asText(entry.note) ?? "" };
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
    const on = new Set(
        all.filter((capability) => isEnabled(capability, project, template)).map(({ id }) => id),
    );

    // A need switched off with its whole group, a blog on a site with none, just drops out of the order.
    const offOnItsOwn = (id: string): boolean => {
        const dependency = byId.get(id);
        return !!dependency && !on.has(id) && isGroupEnabled(dependency.group, project, template);
    };

    for (const capability of all) {
        if (!on.has(capability.id)) continue;

        for (const dependency of capability.dependsOn) {
            if (offOnItsOwn(dependency)) {
                problems.push(
                    `\`${capability.id}\` is on but needs \`${dependency}\`, which is switched off`,
                );
            }
        }
    }

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
        closedAt: asText(raw.closedAt),
        activity: reader.texts(raw, "activity", at),
        blockedBy: reader
            .list(raw, "blockedBy", at)
            .flatMap((blocker) =>
                isRecord(blocker) && typeof blocker.number === "number"
                    ? [{ number: blocker.number, open: blocker.open === true }]
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
    issues: SnapshotIssue[];
    /** The longest chain of `dependsOn` behind it, so one wave holds what can run side by side. */
    wave: number;
    /** What it needs that keeps its tickets from being filed yet; empty once it has tickets. */
    waitsOn: string[];
    /** The capabilities that name it in `dependsOn`. */
    unblocks: string[];
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

export interface GroupView extends Group {
    enabled: boolean;
}

export interface NowTicket {
    issue: SnapshotIssue;
    status: TicketStatus;
    /** Open tickets waiting on this one, directly or through a chain of others. */
    unblocks: number;
    /** The numbers of its blockers that are still open. */
    blockers: number[];
    capability: string | null;
}

/** Every open milestone ticket by what can happen to it next, each list most-unblocking first. */
export interface Now {
    waiting: NowTicket[];
    ready: NowTicket[];
    inFlight: NowTicket[];
    blocked: NowTicket[];
}

export interface ProjectView {
    project: Project;
    template: Template;
    groups: GroupView[];
    stages: StageView[];
    waves: CapabilityView[][];
    now: Now;
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

const delivered = (issue: SnapshotIssue): boolean =>
    issue.state === "closed" && issue.reason !== "not_planned";

/** A capability's state from its switch, its settlement and its tickets; `projectView` turns `can-file` into `waits`. */
export const capabilityState = (
    enabled: boolean,
    settled: SettledState | null,
    issues: SnapshotIssue[],
): CapabilityState => {
    if (!enabled) return "off";
    if (settled) return settled;

    const live = issues.filter((issue) => issue.reason !== "not_planned");

    if (live.length === 0) return "can-file";
    if (live.every(delivered)) return "done";
    if (live.some(delivered)) return "in-progress";
    return "planned";
};

export const ticketStatus = (issue: SnapshotIssue): TicketStatus => {
    if (issue.state === "closed") return issue.reason === "not_planned" ? "dropped" : "done";
    if (issue.branch) return "in-flight";
    if (issue.blockedBy.some(({ open }) => open)) return "blocked";
    return issue.owner ? "waiting-on-you" : "ready";
};

/** How many open tickets wait on each one, directly or through a chain of blocked-by links. */
export const unblockCounts = (issues: SnapshotIssue[]): Map<number, number> => {
    const waiting = new Map<number, number[]>();

    for (const issue of issues) {
        if (issue.state !== "open") continue;

        for (const blocker of issue.blockedBy) {
            if (blocker.open) {
                waiting.set(blocker.number, [...(waiting.get(blocker.number) ?? []), issue.number]);
            }
        }
    }

    return new Map(
        issues.map((issue) => {
            const seen = new Set<number>();
            const queue = [...(waiting.get(issue.number) ?? [])];

            for (let next = queue.pop(); next !== undefined; next = queue.pop()) {
                if (seen.has(next)) continue;
                seen.add(next);
                queue.push(...(waiting.get(next) ?? []));
            }

            return [issue.number, seen.size];
        }),
    );
};

/** Each capability's wave: 0 when it needs nothing, else one past the latest wave it needs. */
export const wavesOf = (capabilities: Capability[]): Map<string, number> => {
    const needs = new Map(capabilities.map(({ id, dependsOn }) => [id, dependsOn]));
    const waves = new Map<string, number>();
    const walking = new Set<string>();

    const waveOf = (id: string): number => {
        const known = waves.get(id);

        if (known !== undefined) return known;
        // A loop is already a reported problem; cutting it here keeps the page drawing.
        if (walking.has(id)) return 0;

        walking.add(id);
        const wave =
            Math.max(-1, ...(needs.get(id) ?? []).filter((need) => needs.has(need)).map(waveOf)) +
            1;
        walking.delete(id);
        waves.set(id, wave);

        return wave;
    };

    for (const id of needs.keys()) waveOf(id);

    return waves;
};

const NOW_LISTS = {
    "waiting-on-you": "waiting",
    ready: "ready",
    "in-flight": "inFlight",
    blocked: "blocked",
} as const satisfies Partial<Record<TicketStatus, keyof Now>>;

const nowOf = (issues: SnapshotIssue[]): Now => {
    const counts = unblockCounts(issues);
    const now: Now = { waiting: [], ready: [], inFlight: [], blocked: [] };

    for (const issue of issues) {
        const status = ticketStatus(issue);
        const list = status in NOW_LISTS ? NOW_LISTS[status as keyof typeof NOW_LISTS] : null;

        if (!list) continue;

        now[list].push({
            issue,
            status,
            unblocks: counts.get(issue.number) ?? 0,
            blockers: issue.blockedBy.filter(({ open }) => open).map(({ number }) => number),
            capability: issue.caps[0] ?? null,
        });
    }

    for (const list of [now.waiting, now.ready, now.inFlight, now.blocked]) {
        list.sort((a, b) => b.unblocks - a.unblocks || a.issue.number - b.issue.number);
    }

    return now;
};

/** One project laid over its template and its last GitHub snapshot. */
export const projectView = (
    project: Project,
    template: Template,
    snapshot: Snapshot | null,
): ProjectView => {
    const issues = snapshot?.issues ?? [];
    const extraIds = new Set(project.extras.map((extra) => extra.id));
    const all = [...template.capabilities, ...project.extras];
    const enabledById = new Map(
        all.map((capability) => [
            capability.id,
            extraIds.has(capability.id)
                ? isGroupEnabled(capability.group, project, template)
                : isEnabled(capability, project, template),
        ]),
    );
    const waves = wavesOf(all);

    const base = all.map((capability) => {
        const enabled = enabledById.get(capability.id) ?? false;
        const placed = issues.filter((issue) => issue.caps.includes(capability.id));
        const settled = project.settled[capability.id];

        return {
            capability,
            enabled,
            placed,
            note: settled?.note || null,
            state: capabilityState(enabled, settled?.status ?? null, placed),
        };
    });
    const baseById = new Map(base.map((entry) => [entry.capability.id, entry]));

    // Decide before you file: an open spike or owner block holds back what needs it, and a build
    // block holds it back only until its own tickets exist to link to.
    const holdsBack = (id: string): boolean => {
        const need = baseById.get(id);

        if (!need || ["off", "done", "skipped"].includes(need.state)) return false;
        return need.capability.kind === "build" ? need.state === "can-file" : true;
    };

    const views: CapabilityView[] = base.map(({ capability, enabled, placed, note, state }) => {
        const waitsOn = state === "can-file" ? capability.dependsOn.filter(holdsBack) : [];

        return {
            ...capability,
            enabled,
            extra: extraIds.has(capability.id),
            note,
            issues: placed,
            state: waitsOn.length > 0 ? "waits" : state,
            wave: waves.get(capability.id) ?? 0,
            waitsOn,
            unblocks: all
                .filter(({ dependsOn }) => dependsOn.includes(capability.id))
                .map(({ id }) => id),
        };
    });

    const stages: StageView[] = template.stages.map((stage) => {
        const capabilities = views.filter((capability) => capability.stage === stage.id);
        return { ...stage, capabilities, progress: progressOf(capabilities) };
    });

    const waveCount = Math.max(-1, ...views.map(({ wave }) => wave)) + 1;

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

        const unknown = issue.caps.filter((cap) => !enabledById.has(cap));
        if (unknown.length > 0) {
            return [{ issue, reason: `unknown capability ${unknown.join(", ")}` }];
        }

        // A closed ticket on a capability later dropped is history, not something left to place.
        if (issue.state === "open" && issue.caps.every((cap) => !enabledById.get(cap))) {
            return [{ issue, reason: "its capability is switched off" }];
        }

        return [];
    });

    // Once everything switched on is delivered, an area issue outside the milestone is maintenance.
    const running = views.some(({ state }) => !["off", "skipped", "done"].includes(state));
    const strays: UnsortedIssue[] = running
        ? (snapshot?.noMilestone ?? []).map((issue) => ({ issue, reason: "not in the milestone" }))
        : [];

    return {
        project,
        template,
        groups: template.groups.map((group) => ({
            ...group,
            enabled: isGroupEnabled(group.id, project, template),
        })),
        stages,
        waves: Array.from({ length: waveCount }, (_, wave) =>
            views.filter((capability) => capability.wave === wave),
        ),
        now: nowOf(issues),
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
