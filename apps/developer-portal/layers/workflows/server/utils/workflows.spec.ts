import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyEdit, loadWorkflows } from "./workflows.ts";

const TEMPLATE = `id: site
title: Site
stages:
  - id: build
    title: Build
groups:
  - id: posts
    title: Posts
    optional: true
    default: true
capabilities:
  - id: comments
    stage: build
    group: posts
    title: Comments
    optional: true
`;

const PROJECT = `# Kept: a person wrote this.
id: blog
title: Blog
template: site
milestone: Blog
switches:
  comments: false # opted out for now
`;

let dir = "";

beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "workflows-"));
    await mkdir(join(dir, "templates"));
    await mkdir(join(dir, "projects"));
    await writeFile(join(dir, "templates", "site.yaml"), TEMPLATE);
    await writeFile(join(dir, "projects", "blog.yaml"), PROJECT);
    vi.stubGlobal("useRuntimeConfig", () => ({ workflowsDir: dir }));
});

afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(dir, { recursive: true, force: true });
});

const projectFile = () => readFile(join(dir, "projects", "blog.yaml"), "utf8");

/** The settings page sends every field at once, as saved unless overridden. */
const settings = (overrides: Record<string, unknown> = {}) => ({
    action: "settings",
    project: "blog",
    title: "Blog",
    summary: "",
    milestone: "Blog",
    area: "",
    switches: {},
    ticketSize: "block",
    ...overrides,
});

describe("applyEdit", () => {
    it("flips a switch without losing the comments a person wrote", async () => {
        await expect(applyEdit(settings({ switches: { comments: true } }))).resolves.toBeNull();

        const written = await projectFile();
        expect(written).toContain("# Kept: a person wrote this.");
        expect(written).toContain("comments: true # opted out for now");
    });

    it("switches a whole group off with one line beside the capabilities' own switches", async () => {
        await expect(applyEdit(settings({ switches: { posts: false } }))).resolves.toBeNull();

        expect(await projectFile()).toContain("posts: false");
        expect(await projectFile()).toContain("comments: false # opted out for now");
    });

    it("refuses an id that could climb out of the projects directory", async () => {
        await expect(
            applyEdit({ action: "switch", project: "../evil", capability: "comments", on: true }),
        ).resolves.toMatch(/kebab-case/);
    });

    it("refuses to create over an existing project", async () => {
        await expect(
            applyEdit({
                action: "create",
                project: "blog",
                title: "Blog",
                template: "site",
                area: "",
                milestone: "Blog",
            }),
        ).resolves.toBe("blog already exists");
        expect(await projectFile()).toBe(PROJECT);
    });

    it("creates a project the loader accepts without a single problem", async () => {
        await applyEdit({
            action: "create",
            project: "shop",
            title: "Shop",
            template: "site",
            area: "app:shop",
            milestone: "Shop",
        });

        const { projects, problems } = await loadWorkflows();

        expect(problems).toEqual([]);
        expect(projects.map(({ project }) => project.id)).toEqual(["blog", "shop"]);
    });

    it("refuses a project with no template, which the page would then drop from view", async () => {
        await expect(
            applyEdit({
                action: "create",
                project: "shop",
                title: "Shop",
                template: "",
                area: "",
                milestone: "Shop",
            }),
        ).resolves.toBe("`(none)` names no template");
    });

    it.each([
        [{ action: "create" }, "`` isn't a kebab-case project id"],
        [null, "`` isn't a kebab-case project id"],
        [
            settings({ switches: { nope: true } }),
            "`nope` isn't an optional capability or group of site",
        ],
        [
            { action: "gate", project: "blog", stage: "build", approvedOn: "2026-11-09" },
            "`gate` isn't an edit",
        ],
        [{ action: "rename", project: "blog" }, "`rename` isn't an edit"],
        [settings({ title: "" }), "a project needs a title"],
        [settings({ ticketSize: "huge" }), "`huge` isn't a ticket size"],
    ])("refuses %j before writing anything", async (body, problem) => {
        await expect(applyEdit(body)).resolves.toBe(problem);
        expect(await projectFile()).toBe(PROJECT);
    });
});

describe("applyEdit create", () => {
    it("writes the features and ticket size chosen in the wizard into the new file", async () => {
        await expect(
            applyEdit({
                action: "create",
                project: "shop",
                title: "Shop",
                template: "site",
                area: "app:shop",
                milestone: "Shop",
                summary: "A small shop.",
                switches: { posts: false },
                ticketSize: "lean",
            }),
        ).resolves.toBeNull();

        const { projects, problems } = await loadWorkflows();
        const shop = projects.find(({ project }) => project.id === "shop")?.project;

        expect(problems).toEqual([]);
        expect(shop).toMatchObject({
            summary: "A small shop.",
            switches: { posts: false },
            ticketSize: "lean",
        });
    });

    it("refuses a switch on a block the template doesn't let a project turn off", async () => {
        await expect(
            applyEdit({
                action: "create",
                project: "shop",
                title: "Shop",
                template: "site",
                milestone: "Shop",
                switches: { nope: true },
            }),
        ).resolves.toBe("`nope` isn't an optional capability or group of site");
    });
});

describe("applyEdit settings and delete", () => {
    it("rewrites the details without losing the comments a person wrote", async () => {
        await expect(
            applyEdit(
                settings({
                    title: "Harbour Notes",
                    summary: "A sailing blog.",
                    milestone: "Harbour",
                    area: "app:harbour",
                }),
            ),
        ).resolves.toBeNull();

        const written = await projectFile();
        expect(written).toContain("# Kept: a person wrote this.");
        expect(written).toContain("title: Harbour Notes");
        expect(written).toContain("milestone: Harbour");
        expect(written).toContain("template: site");
    });

    it("deletes the project file and its snapshot, and nothing else", async () => {
        const snapshot = join(dir, "projects", "blog.snapshot.json");
        await writeFile(snapshot, "{}");

        await expect(applyEdit({ action: "delete", project: "blog" })).resolves.toBeNull();

        await expect(readFile(join(dir, "projects", "blog.yaml"))).rejects.toThrow();
        await expect(readFile(snapshot)).rejects.toThrow();
        await expect(readFile(join(dir, "templates", "site.yaml"), "utf8")).resolves.toBe(TEMPLATE);
    });

    it("deletes a project whose template is gone, so a broken file can still be cleared", async () => {
        await writeFile(join(dir, "projects", "blog.yaml"), PROJECT.replace("site", "missing"));

        await expect(applyEdit({ action: "delete", project: "blog" })).resolves.toBeNull();
    });
});

describe("loadWorkflows", () => {
    it("lays the synced snapshot over the project, so its tickets show", async () => {
        await writeFile(
            join(dir, "projects", "blog.snapshot.json"),
            JSON.stringify({
                syncedAt: "2026-11-09T00:00:00Z",
                milestone: "Blog",
                issues: [
                    {
                        number: 7,
                        title: "Stray",
                        url: "",
                        state: "open",
                        reason: null,
                        caps: [],
                        closedAt: null,
                    },
                ],
            }),
        );

        const { projects, problems } = await loadWorkflows();

        expect(problems).toEqual([]);
        expect(projects[0]?.syncedAt).toBe("2026-11-09T00:00:00Z");
        expect(projects[0]?.unsorted.map(({ issue }) => issue.number)).toEqual([7]);
    });

    it("reports a snapshot that isn't JSON instead of blanking every project", async () => {
        await writeFile(join(dir, "projects", "blog.snapshot.json"), "{ half");

        const { projects, problems } = await loadWorkflows();

        expect(projects.map(({ project }) => project.id)).toEqual(["blog"]);
        expect(problems.map(({ file }) => file)).toEqual(["projects/blog.snapshot.json"]);
    });
});

describe("applyEdit ticket size", () => {
    it("writes the size without losing the comments a person wrote", async () => {
        await expect(applyEdit(settings({ ticketSize: "stage" }))).resolves.toBeNull();

        const written = await projectFile();
        expect(written).toContain("# Kept: a person wrote this.");
        expect(written).toContain("ticketSize: stage");
    });

    it.each([
        [[], null],
        [["comments"], "the ticket size is fixed once a ticket is filed"],
    ])("with a filed ticket carrying %j, a size change answers %j", async (caps, problem) => {
        const issue = {
            number: 7,
            title: "One",
            url: "",
            state: "open",
            reason: null,
            closedAt: null,
        };
        await writeFile(
            join(dir, "projects", "blog.snapshot.json"),
            JSON.stringify({
                syncedAt: "2026-11-09T00:00:00Z",
                milestone: "Blog",
                issues: [{ ...issue, caps }],
            }),
        );

        await expect(applyEdit(settings({ ticketSize: "stage" }))).resolves.toBe(problem);
    });

    it("leaves the size out of the file while it stays the default", async () => {
        await expect(applyEdit(settings())).resolves.toBeNull();
        expect(await projectFile()).not.toContain("ticketSize");
    });
});
