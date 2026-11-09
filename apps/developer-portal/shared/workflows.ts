/** The vocabularies `docs/workflows/README.md` documents, as the one copy every other spelling derives from. */
export const REUSE_PLANS = ["package", "extract", "copy", "method", "new"] as const;
export const SETTLED_STATES = ["done", "skipped"] as const;
export const CAPABILITY_STATES = [
    "off",
    "skipped",
    "todo",
    "planned",
    "in-progress",
    "done",
] as const;

export type ReusePlan = (typeof REUSE_PLANS)[number];
export type SettledState = (typeof SETTLED_STATES)[number];
export type CapabilityState = (typeof CAPABILITY_STATES)[number];

/** The prefix of the GitHub label that places an issue under a capability. */
export const CAPABILITY_LABEL_PREFIX = "cap:";

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
    gate: string;
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
    /** Stage id to the ISO date its gate was approved. */
    gates: Record<string, string>;
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

    return {
        id,
        stage: reader.text(raw, "stage", where),
        group: asText(raw.group),
        title: reader.text(raw, "title", where),
        summary: reader.text(raw, "summary", where, ""),
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

    return problems;
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
                gate: reader.text(stage, "gate", where, ""),
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

    const gates: Record<string, string> = {};

    for (const [id, value] of Object.entries(reader.record(source, "gates", "project"))) {
        const date = asText(value);
        if (date !== null && /^\d{4}-\d{2}-\d{2}$/.test(date)) gates[id] = date;
        else reader.problems.push(`gate \`${id}\` must be a YYYY-MM-DD date`);
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
        gates,
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

    for (const id of Object.keys(project.gates)) {
        if (!stageIds.has(id)) problems.push(`gate \`${id}\` names no stage in \`${template.id}\``);
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

    for (const capability of all) {
        if (!on.has(capability.id)) continue;

        for (const dependency of capability.dependsOn) {
            if (byId.has(dependency) && !on.has(dependency)) {
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
    }

    return problems;
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
}

export type StageState = "done" | "current" | "upcoming";

export interface StageView extends Stage {
    state: StageState;
    approvedOn: string | null;
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

export interface ProjectView {
    project: Project;
    template: Template;
    groups: GroupView[];
    stages: StageView[];
    unsorted: UnsortedIssue[];
    /** Every capability still owed, in stage order: on, and neither done nor skipped. */
    left: CapabilityView[];
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

export const capabilityState = (
    enabled: boolean,
    settled: SettledState | null,
    issues: SnapshotIssue[],
): CapabilityState => {
    if (!enabled) return "off";
    if (settled) return settled;

    const live = issues.filter((issue) => issue.reason !== "not_planned");

    if (live.length === 0) return "todo";
    if (live.every(delivered)) return "done";
    if (live.some(delivered)) return "in-progress";
    return "planned";
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

    const views: CapabilityView[] = all.map((capability) => {
        const enabled = enabledById.get(capability.id) ?? false;
        const placed = issues.filter((issue) => issue.caps.includes(capability.id));
        const settled = project.settled[capability.id];

        return {
            ...capability,
            enabled,
            extra: extraIds.has(capability.id),
            note: settled?.note || null,
            issues: placed,
            state: capabilityState(enabled, settled?.status ?? null, placed),
        };
    });

    const current = template.stages.find((stage) => !project.gates[stage.id]);

    const stages: StageView[] = template.stages.map((stage) => {
        const capabilities = views.filter((capability) => capability.stage === stage.id);
        const approvedOn = project.gates[stage.id] ?? null;

        let state: StageState = "upcoming";

        if (approvedOn) state = "done";
        else if (stage === current) state = "current";

        return { ...stage, state, approvedOn, capabilities, progress: progressOf(capabilities) };
    });

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

    // Once every gate is approved, an area issue outside the milestone is maintenance, not this effort.
    const strays: UnsortedIssue[] = current
        ? (snapshot?.noMilestone ?? []).map((issue) => ({ issue, reason: "not in the milestone" }))
        : [];

    const left = stages.flatMap((stage) =>
        stage.capabilities.filter(({ state }) => !["off", "skipped", "done"].includes(state)),
    );

    return {
        project,
        template,
        groups: template.groups.map((group) => ({
            ...group,
            enabled: isGroupEnabled(group.id, project, template),
        })),
        stages,
        unsorted: [...unsorted, ...strays],
        left,
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
