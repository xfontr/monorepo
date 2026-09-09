import { autocomplete } from "@clack/prompts";
import process from "node:process";
import { isInteractive, out } from "../shared/adapters/io.ts";
import { orExit } from "../shared/adapters/prompts.ts";
import type { Args } from "../shared/cli.ts";
import { ExpectedError } from "../shared/errors.ts";
import { projectsWithDev } from "./adapters/nx.ts";
import { dev } from "./adapters/pnpm.ts";
import { findProject, matches, rowFor, toProjects, type DevProject } from "./domain/projects.ts";

const CANCELLED = "Cancelled — nothing started.";

/** Enough to show every layer at once today, and to keep the search box on screen when it isn't. */
const VISIBLE_ROWS = 12;

const list = (): DevProject[] => {
    const loading = out.spinner();
    loading.start("Asking Nx what it can run...");

    const projects = toProjects(projectsWithDev());

    loading.stop(`${projects.length} project${projects.length === 1 ? "" : "s"} to choose from.`);

    return projects;
};

const spellings = (projects: DevProject[]): string =>
    projects.map(({ name }) => name.replace("@monorepo/", "")).join(", ");

/**
 * A searchable list rather than a plain `select`: it reads as the same picker until you type, and
 * scrolling stops being how you find things the moment this workspace has more than a screenful of
 * dev servers. `search` prefills the box with whatever name didn't match, so a near-miss lands on a
 * list already narrowed to it instead of the full one.
 *
 * The picker needs someone to answer it, so a non-interactive caller gets the list as an error
 * instead of a prompt nothing will ever type into — same split `drift/` makes for its confirm.
 */
const choose = async (projects: DevProject[], search: string): Promise<DevProject> => {
    if (!isInteractive()) {
        throw new ExpectedError(`No terminal to pick with — name a project: pnpm dev <${spellings(projects)}>`);
    }

    return orExit(
        await autocomplete({
            message: "Which one?",
            placeholder: "Type to search, ↑↓ to browse",
            initialUserInput: search,
            maxItems: VISIBLE_ROWS,
            // The hint is the name `--filter` takes, on the row you're deciding about: the picker
            // shows you what you could have typed before it shows you again on the way out.
            options: projects.map((project) => ({ value: project, label: rowFor(project), hint: project.name })),
            filter: (input, { value }) => matches(value, input),
        }),
        CANCELLED,
    );
};

export const main = async ({ positionals }: Args): Promise<void> => {
    out.begin("🚀 pnpm dev");

    const projects = list();
    if (projects.length === 0) throw new ExpectedError("Nothing in this workspace declares a `dev` script.");

    // Joined rather than taking the first, so `pnpm dev huella legal` matches the label the picker
    // shows as readily as the quoted spelling does.
    const requested = positionals.join(" ");
    const named = requested ? findProject(projects, requested) : undefined;

    if (requested && !named) out.warn(`No project here is called "${requested}" — search below.`);

    const project = named ?? await choose(projects, requested);

    out.end(`pnpm --filter ${project.name} run dev`);

    // `null` is a signal, which for a dev server means Ctrl+C — the way you stop one, not a failure
    // worth an exit code and pnpm's ELIFECYCLE noise on top of it.
    const status = dev(project.name);
    if (status) process.exitCode = status;
};
