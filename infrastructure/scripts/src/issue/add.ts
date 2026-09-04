import { cancel, confirm, intro, isCancel, log, note, outro, select, spinner, text } from "@clack/prompts";
import { createIssue } from "../shared/gh.ts";
import { NONE, orExit } from "../shared/prompts.ts";
import { listLabels, listProjects, type Label, type Project } from "./gh.ts";
import { currentBranch } from "./git.ts";
import { pick } from "./pick.ts";

const CANCELLED = "Cancelled — no issue created.";

const or = <T>(value: T | symbol): T => orExit(value, CANCELLED);

const pickProject = async (projects: Project[]): Promise<string | undefined> => {
    if (projects.length === 0) {
        log.warn("No open projects. If you expected some, the `project` scope is missing: gh auth refresh -s project");
        return undefined;
    }

    const picked = or(
        await select({
            message: "Project",
            options: [
                ...projects.map(({ title }) => ({ value: title, label: title })),
                { value: NONE, label: "— none —" },
            ],
        }),
    );

    return picked || undefined;
};

const pickLabel = async (labels: Label[]): Promise<string | undefined> => {
    const picked = or(
        await select({
            message: "Label",
            options: [
                ...labels.map(({ name, description }) => ({ value: name, label: name, hint: description || undefined })),
                { value: NONE, label: "— none —" },
            ],
        }),
    );

    return picked || undefined;
};

export const add = async (): Promise<void> => {
    intro("📝 Add an issue");

    const loading = spinner();
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

    note(`${body}\n\nlabel: ${label ?? "—"}\nproject: ${project ?? "—"}`, title);

    if (!or(await confirm({ message: "Create it?" }))) {
        cancel(CANCELLED);
        return;
    }

    const creating = spinner();
    creating.start("Creating...");

    try {
        const url = createIssue({ title: title.trim(), body: body.trim(), label, project });
        creating.stop("Created.");
        outro(url);
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
