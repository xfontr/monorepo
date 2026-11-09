import { gh } from "../../shared/adapters/gh.ts";
import type { GhIssue } from "../domain/snapshot.ts";

const FIELDS = "number,title,url,state,stateReason,labels,closedAt";

/** Every issue in the milestone, closed ones included, since those are what a capability is done with. */
export const milestoneIssues = (milestone: string): GhIssue[] =>
    JSON.parse(
        gh(
            "issue",
            "list",
            `--milestone=${milestone}`,
            "--state",
            "all",
            "--limit",
            "1000",
            "--json",
            FIELDS,
        ),
    ) as GhIssue[];

/** Open issues under the area label that nobody put in a milestone — what a hand-filed ticket usually is. */
export const areaIssuesWithoutMilestone = (area: string): GhIssue[] =>
    JSON.parse(
        gh(
            "issue",
            "list",
            `--label=${area}`,
            "--search",
            "no:milestone",
            "--state",
            "open",
            "--limit",
            "1000",
            "--json",
            FIELDS,
        ),
    ) as GhIssue[];
