import { defineEventHandler, getQuery } from "h3";
import type { IssuesArtifact } from "../../shared/types.ts";
import { listIssues } from "../utils/issues.ts";

export default defineEventHandler((event): Promise<IssuesArtifact> =>
    listIssues(getQuery(event).refresh !== undefined));
