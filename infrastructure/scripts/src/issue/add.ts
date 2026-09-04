import { confirm, isCancel, select, text } from "@clack/prompts";
import { createIssue } from "../shared/gh.ts";
import { out } from "../shared/io.ts";
import { orExit } from "../shared/prompts.ts";
import { listLabels, listProjects, type Label, type Project } from "./gh.ts";
import { currentBranch } from "./git.ts";
import { pick } from "./pick.ts";
import { labelOptions, NONE_OPTION, PROJECT_SCOPE_HINT, projectOptions } from "./prompts.ts";

const CANCELLED = "Cancelled — no issue created.";

const or = <T>(value: T | symbol): T => orExit(value, CANCELLED);

const pickProject = async (projects: Project[]): Promise<string | undefined> => {
    if (projects.length === 0) {
        out.warn(PROJECT_SCOPE_HINT);
        return undefined;
    }

    const picked = or(
        await select({
            message: "Project",
            options: [...projectOptions(projects), NONE_OPTION],
        }),
    );

    return picked || undefined;
};

const pickLabel = async (labels: Label[]): Promise<string | undefined> => {
    const picked = or(
        await select({
            message: "Label",
            options: [...labelOptions(labels), NONE_OPTION],
        }),
    );

    return picked || undefined;
};

export const add = async (): Promise<void> => {
    out.begin("📝 Add an issue");

    const loading = out.spinner();
    loading.start("Asking gh what's available...");
    const projects = listProjects();
    const labels = listLabels();
    loading.stop("Ready.");

    const project = await pickProject(projects);
    const label = await pickLabel(labels);

    const title = or(
        await text({
            message: "Title",
            validate: (value) => (value?.trim() ? undefined : "A title is required."),
        }),
    );

    const body = or(
        await text({
            message: "Description",
            validate: (value) => (value?.trim() ? undefined : "A description is required."),
        }),
    );

    out.note(`${body}\n\nlabel: ${label ?? "—"}\nproject: ${project ?? "—"}`, title);

    if (!or(await confirm({ message: "Create it?" }))) {
        out.cancelled(CANCELLED);
        return;
    }

    const creating = out.spinner();
    creating.start("Creating...");

    try {
        const url = createIssue({ title: title.trim(), body: body.trim(), label, project });
        creating.stop("Created.");
        out.end(url);
    }
    catch (error) {
        creating.stop("gh issue create failed.");
        throw error;
    }

    await offerPick();
};

/**
 * Filing an issue from `master` is the moment you're most likely about to start work on one — so
 * ask, and if yes, hand off to the same `pick` this exports for `pnpm issue:pick`, instead of
 * making that a separate command to remember to run.
 */
const offerPick = async (): Promise<void> => {
    if (currentBranch() !== "master") return;

    const wantsPick = await confirm({ message: "You're on master — pick an issue now?" });
    if (isCancel(wantsPick) || !wantsPick) return;

    await pick();
};
