import { asText, isRecord, type Reader } from "./reader.ts";
import {
    COMPLEXITY_SCALE,
    KINDS,
    REUSE_PLANS,
    type Capability,
    type Kind,
    type ReusePlan,
} from "./types.ts";

export const readCapability = (reader: Reader, raw: unknown, index: number): Capability | null => {
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

    const complexity =
        typeof raw.complexity === "number" &&
        (COMPLEXITY_SCALE as readonly number[]).includes(raw.complexity)
            ? raw.complexity
            : null;

    if (raw.complexity !== undefined && complexity === null) {
        reader.problems.push(
            `${where}: \`complexity: ${JSON.stringify(raw.complexity)}\` isn't one of ${COMPLEXITY_SCALE.join(", ")}`,
        );
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
        complexity,
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

export const cycleProblem = (capabilities: Capability[]): string[] => {
    const cycle = dependencyCycle(capabilities);
    return cycle ? [`\`dependsOn\` goes round in a loop: ${cycle.join(" → ")}`] : [];
};
