import { routedNeeds } from "./capability.ts";
import { featuresOf, isEnabled, isGroupEnabled } from "./project.ts";
import { day, issueAsOf, ticketStatus } from "./ticket.ts";
import { ticketsToFile } from "./ticketSize.ts";
import {
    CAPABILITY_LABEL_PREFIX,
    CAPABILITY_STATES,
    type Capability,
    type CapabilityState,
    type CapabilityView,
    type Points,
    type Progress,
    type Project,
    type ProjectView,
    type Snapshot,
    type StageView,
    type Template,
    type UnsortedIssue,
} from "./types.ts";

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

const NO_POINTS: Points = { done: 0, total: 0, estimated: 0, unestimated: 0 };

const addPoints = (list: Points[]): Points =>
    list.reduce(
        (sum, points) => ({
            done: sum.done + points.done,
            total: sum.total + points.total,
            estimated: sum.estimated + points.estimated,
            unestimated: sum.unestimated + points.unestimated,
        }),
        NO_POINTS,
    );

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

    const needs = routedNeeds(all, ({ id }) => enabled.get(id) === true);
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

    const scores = (id: string) => byId.has(id) && enabled.get(id) === true && !settledFor(id);

    // A ticket shared by several blocks splits its estimate between them, so totals never count it twice.
    const pointsOf = (capability: Capability): Points => {
        if (!scores(capability.id)) return NO_POINTS;

        const tickets = live.get(capability.id) ?? [];

        if (tickets.length > 0) {
            return addPoints(
                tickets.map((ticket) => {
                    const sharers = ticket.caps.filter(scores);
                    const share = (ticket.complexity ?? 0) / sharers.length;
                    return {
                        done: ticket.state === "closed" ? share : 0,
                        total: share,
                        estimated: 0,
                        unestimated:
                            ticket.complexity === null && sharers[0] === capability.id ? 1 : 0,
                    };
                }),
            );
        }

        return {
            done: 0,
            total: capability.complexity ?? 0,
            estimated: capability.complexity ?? 0,
            unestimated: capability.complexity === null ? 1 : 0,
        };
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
        points: pointsOf(capability),
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
        return {
            ...stage,
            capabilities,
            progress: progressOf(capabilities),
            points: addPoints(capabilities.map(({ points }) => points)),
        };
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

    const pool = all.filter(({ id }) => enabled.get(id) && !settledFor(id));
    const filedIds = new Set(
        pool.flatMap(({ id }) => ((live.get(id) ?? []).length > 0 ? [id] : [])),
    );
    const tickets = {
        filed: issues.filter((issue) => issue.caps.length > 0 && issue.reason !== "not_planned")
            .length,
        toFile: ticketsToFile(pool, needs, filedIds),
    };

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
        points: addPoints(views.map(({ points }) => points)),
        tickets,
        syncedAt: snapshot?.syncedAt ?? null,
    };
};
