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

describe("applyEdit", () => {
    it("flips a switch without losing the comments a person wrote", async () => {
        await expect(
            applyEdit({ action: "switch", project: "blog", capability: "comments", on: true }),
        ).resolves.toBeNull();

        const written = await projectFile();
        expect(written).toContain("# Kept: a person wrote this.");
        expect(written).toContain("comments: true # opted out for now");
    });

    it("switches a whole group off with one line beside the capabilities' own switches", async () => {
        await expect(
            applyEdit({ action: "switch", project: "blog", capability: "posts", on: false }),
        ).resolves.toBeNull();

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
            { action: "switch", project: "blog", capability: "nope", on: true },
            "`nope` isn't an optional capability or group of site",
        ],
        [
            { action: "gate", project: "blog", stage: "build", approvedOn: "2026-11-09" },
            "`gate` isn't an edit",
        ],
        [{ action: "rename", project: "blog" }, "`rename` isn't an edit"],
    ])("refuses %j before writing anything", async (body, problem) => {
        await expect(applyEdit(body)).resolves.toBe(problem);
        expect(await projectFile()).toBe(PROJECT);
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
