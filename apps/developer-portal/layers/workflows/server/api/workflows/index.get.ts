import { defineEventHandler } from "h3";
import type { Workflows } from "../../../shared/workflows.ts";
import { loadWorkflows } from "../../utils/workflows.ts";

/** Read from `data/workflows` on every call, so a local edit shows on the next refresh; a build bakes it. */
export default defineEventHandler((): Promise<Workflows> => loadWorkflows());
