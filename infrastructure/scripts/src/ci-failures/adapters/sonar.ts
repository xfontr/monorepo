import { ExpectedError } from "../../shared/errors.ts";
import type { SonarIssue, SonarPullRequest } from "../domain/checks.ts";

/** A public project's issues need no token; `ps` is the API's page-size cap. */
export const openIssues = async ({
    origin,
    project,
    pullRequest,
}: SonarPullRequest): Promise<SonarIssue[]> => {
    const query = new URLSearchParams({
        componentKeys: project,
        pullRequest,
        resolved: "false",
        ps: "500",
    });
    const response = await fetch(`${origin}/api/issues/search?${query.toString()}`);

    if (!response.ok) throw new ExpectedError(`Sonar answered ${response.status}.`);

    return ((await response.json()) as { issues: SonarIssue[] }).issues;
};
