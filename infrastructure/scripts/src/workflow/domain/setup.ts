import { KIND_LABELS, type WorkflowMap } from "./filing.ts";
import { CAPABILITY_LABEL_PREFIX } from "./snapshot.ts";

export interface SetupPlan {
    /** Null when the milestone already exists. */
    milestone: string | null;
    labels: string[];
}

/** Every label filing this project's switched-on, unsettled blocks will put on a ticket. */
export const labelsFor = (map: WorkflowMap): string[] => {
    const blocks = map.blocks.filter((block) => map.isOn(block) && !map.settled.has(block.id));

    return [
        ...new Set([
            ...(map.area ? [map.area] : []),
            ...blocks.map(({ kind }) => KIND_LABELS[kind]),
            ...blocks.map(({ id }) => `${CAPABILITY_LABEL_PREFIX}${id}`),
        ]),
    ];
};

/** What has to exist on GitHub before `sync` can read the project and `file` can label its tickets. */
export const setupPlan = (
    map: WorkflowMap,
    existing: { milestone: boolean; labels: string[] },
): SetupPlan => {
    const have = new Set(existing.labels);

    return {
        milestone: existing.milestone ? null : map.milestone,
        labels: labelsFor(map).filter((label) => !have.has(label)),
    };
};
