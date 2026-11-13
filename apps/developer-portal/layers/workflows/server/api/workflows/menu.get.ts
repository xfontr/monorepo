import { defineEventHandler } from "h3";
import { activeProjects } from "../../../shared/workflows.ts";
import { loadWorkflows } from "../../utils/workflows.ts";

const LIMIT = 5;

/** The sidebar's submenu: the unfinished projects synced most recently, then a way to start one. */
export default defineEventHandler(async () => {
    const { projects } = await loadWorkflows();
    const recent = activeProjects(projects)
        .sort((a, b) => (b.syncedAt ?? "").localeCompare(a.syncedAt ?? ""))
        .slice(0, LIMIT)
        .map(({ project }) => ({ label: project.title, to: `/workflows/${project.id}` }));

    return [...recent, { label: "New project", icon: "i-lucide-plus", to: "/workflows/new" }];
});
