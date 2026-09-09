import { autocomplete, confirm, isCancel, select, text } from "@clack/prompts";
import { createIssue } from "../shared/adapters/gh.ts";
import { out } from "../shared/adapters/io.ts";
import { orExit } from "../shared/adapters/prompts.ts";
import { listLabels, listProjects, type Label, type Project } from "./adapters/gh.ts";
import { currentBranch } from "./adapters/git.ts";
import { labelOptions, NONE_OPTION, PROJECT_SCOPE_HINT, projectOptions } from "./adapters/prompts.ts";
import { matchesLabel } from "./domain/search.ts";
import { pick } from "./pick.ts";

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

/**
 * Searchable where the project prompt above isn't: labels are a list this repo keeps adding to, and
 * the one you want is one you can already name. *None* stays put while the box is empty and drops
 * out the moment you type — having typed anything, you're looking for a label, not for nothing.
 */
const pickLabel = async (labels: Label[]): Promise<string | undefined> => {
    const picked = or(
        await autocomplete({
            message: "Label",
            placeholder: "Type a label or what it means",
            maxItems: 12,
            options: [...labelOptions(labels), NONE_OPTION],
            filter: (search, { value, hint }) =>
                (value === NONE_OPTION.value
                    ? !search.trim()
                    : matchesLabel({ name: value, description: hint ?? "" }, search)),
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

const offerPick = async (): Promise<void> => {
    if (currentBranch() !== "master") return;

    const wantsPick = await confirm({ message: "You're on master — pick an issue now?" });
    if (isCancel(wantsPick) || !wantsPick) return;

    await pick();
};
