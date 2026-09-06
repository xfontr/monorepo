import { defineEventHandler, getQuery } from "h3";
import type { IssuesArtifact } from "../../shared/types.ts";
import { listIssues } from "../utils/issues.ts";

/**
 * `gh` runs here rather than in the browser so the dashboard needs no token of its own: the CLI
 * already holds one, and a page that asked for a second would be a credential this repo has to
 * store somewhere.
 */
export default defineEventHandler((event): Promise<IssuesArtifact> =>
    listIssues(getQuery(event).refresh !== undefined));
