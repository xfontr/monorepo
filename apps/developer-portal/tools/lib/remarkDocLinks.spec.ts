import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { WORKSPACE_ROOT } from "./paths.ts";
import remarkDocLinks from "./remarkDocLinks.ts";

const sourcePath = resolve(WORKSPACE_ROOT, "README.md");

function transform(tree: unknown, path?: string): void {
    remarkDocLinks()(tree as never, { path });
}

describe("remarkDocLinks", () => {
    it("leaves a tree untouched when the markdown source has no path", () => {
        const tree = { type: "root", children: [{ type: "link", url: "./README.md", children: [] }] };

        transform(tree, undefined);

        expect(tree).toEqual({ type: "root", children: [{ type: "link", url: "./README.md", children: [] }] });
    });

    it("rewrites links nested below other mdast nodes", () => {
        const tree = {
            type: "root",
            children: [{ type: "emphasis", children: [{ type: "link", url: "./docs/README.md", children: [{ type: "text", value: "docs" }] }] }],
        };

        transform(tree, sourcePath);

        expect(tree).toEqual({
            type: "root",
            children: [{ type: "emphasis", children: [{ type: "link", url: "/docs/docs/readme", children: [{ type: "text", value: "docs" }] }] }],
        });
    });

    it("routes known markdown pages and extensionless markdown pages but sends non-page files to the repo", () => {
        const tree = { type: "root", children: [
            { type: "link", url: "./docs/README.md", children: [] },
            { type: "link", url: "./docs/README", children: [] },
            { type: "link", url: "./nx.json", children: [] },
        ] };

        transform(tree, sourcePath);

        expect(tree.children).toEqual([
            { type: "link", url: "/docs/docs/readme", children: [] },
            { type: "link", url: "/docs/docs/readme", children: [] },
            { type: "link", url: "repo:nx.json", children: [] },
        ]);
    });

    it("replaces placeholder links with their text children instead of a dead route", () => {
        const tree = { type: "root", children: [{ type: "link", url: "<file>.md", children: [{ type: "text", value: "a file" }] }] };

        transform(tree, sourcePath);

        expect(tree).toEqual({ type: "root", children: [{ type: "text", value: "a file" }] });
    });

    it("keeps non-owned links unchanged", () => {
        const tree = { type: "root", children: [
            { type: "link", url: "https://example.test", children: [{ type: "text", value: "external" }] },
            { type: "link", url: "#section", children: [{ type: "text", value: "anchor" }] },
        ] };

        transform(tree, sourcePath);

        expect(tree).toEqual({ type: "root", children: [
            { type: "link", url: "https://example.test", children: [{ type: "text", value: "external" }] },
            { type: "link", url: "#section", children: [{ type: "text", value: "anchor" }] },
        ] });
    });

    it("preserves sibling order when a placeholder expands into multiple children", () => {
        const tree = { type: "root", children: [
            { type: "link", url: "./nx.json", children: [{ type: "text", value: "config" }] },
            { type: "link", url: "<file>.md", children: [{ type: "text", value: "first" }, { type: "text", value: "second" }] },
            { type: "link", url: "./README.md", children: [{ type: "text", value: "readme" }] },
        ] };

        transform(tree, sourcePath);

        expect(tree.children).toEqual([
            { type: "link", url: "repo:nx.json", children: [{ type: "text", value: "config" }] },
            { type: "text", value: "first" },
            { type: "text", value: "second" },
            { type: "link", url: "/docs/readme", children: [{ type: "text", value: "readme" }] },
        ]);
    });
});
