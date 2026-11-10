import { statSync, readFileSync } from "node:fs";
import { posix } from "node:path";
import type { Rule, Scope } from "eslint";

type Options = [{ cores: string[] }];
type Origins = Map<string, string>;
interface TemplateElement {
    rawName: string;
    loc: Rule.Node["loc"];
}
interface TemplateContainer {
    references: { id: { name: string; loc: Rule.Node["loc"] } }[];
}
interface TemplateVisitor {
    defineTemplateBodyVisitor?: (
        templateVisitor: Record<string, (node: never) => void>,
        scriptVisitor: Rule.RuleListener,
    ) => Rule.RuleListener;
}

const LAYERS = "/layers/";

const DECLARATION = /const (\w+): (?:LazyComponent<)?typeof import\((["'])([^"']+)\2\)/g;

const MAPS = {
    app: ["types/imports.d.ts"],
    server: ["types/nitro-imports.d.ts"],
    shared: ["types/shared-imports.d.ts"],
    components: ["components.d.ts"],
} as const satisfies Record<string, readonly string[]>;

// ESLint's language server lives across `nuxi prepare` runs, so a cached map is reread on change.
const cache = new Map<string, { mtimeMs: number; origins: Origins }>();

const readOrigins = (file: string): Origins | undefined => {
    const mtimeMs = statSync(file, { throwIfNoEntry: false })?.mtimeMs;
    if (mtimeMs === undefined) return undefined;
    const cached = cache.get(file);
    if (cached?.mtimeMs === mtimeMs) return cached.origins;

    const origins: Origins = new Map();
    for (const [, name, , path] of readFileSync(file, "utf8").matchAll(DECLARATION)) {
        if (name && path) origins.set(name, posix.resolve(posix.dirname(file), path));
    }
    cache.set(file, { mtimeMs, origins });
    return origins;
};

const readMaps = (nuxtDir: string, files: readonly string[]): Origins | undefined => {
    const merged: Origins = new Map();
    for (const file of files) {
        const origins = readOrigins(posix.join(nuxtDir, file));
        if (!origins) return undefined;
        for (const [name, path] of origins) merged.set(name, path);
    }
    return merged;
};

const toPascal = (tag: string): string =>
    tag
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");

const layerAfter = (layersRoot: string, path: string): string | undefined =>
    path.startsWith(layersRoot) ? path.slice(layersRoot.length).split("/")[0] : undefined;

const targetLayer = (layersRoot: string, fromDir: string, source: string): string | undefined => {
    if (source.startsWith("#layers/")) return source.split("/")[1];
    if (!source.startsWith(".")) return undefined;
    return layerAfter(layersRoot, posix.join(fromDir, source));
};

const scriptKind = (inLayer: string): keyof typeof MAPS => {
    if (inLayer.includes("/server/")) return "server";
    if (inLayer.includes("/shared/")) return "shared";
    return "app";
};

const layerBoundaries: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Keep Nuxt layers apart, auto-imports included: a feature uses only cores, a core never uses a feature, and only a feature's pages render another feature's components.",
        },
        schema: [
            {
                type: "object",
                properties: { cores: { type: "array", items: { type: "string" } } },
                required: ["cores"],
                additionalProperties: false,
            },
        ],
        messages: {
            featureToFeature:
                "Move what this needs from the `{{target}}` feature into a core layer ({{cores}}) or the shell: a feature never uses another feature.",
            coreToFeature:
                "Move what this needs from the `{{target}}` feature into a core layer: a core never uses a feature.",
            unprepared:
                "Run `nuxi prepare` in this app: without `.nuxt/` this rule can't tell which layer an auto-import comes from.",
        },
    },
    create: (context) => {
        const [{ cores }] = context.options as Options;
        const filename = context.filename.replaceAll("\\", "/");
        const at = filename.indexOf(LAYERS);
        if (at === -1) return {};

        const layersRoot = filename.slice(0, at + LAYERS.length);
        const nuxtDir = posix.join(filename.slice(0, at), ".nuxt");
        const layer = layerAfter(layersRoot, filename);
        const fromDir = posix.dirname(filename);
        const inLayer = filename.slice(layersRoot.length);
        const featurePage =
            !cores.includes(layer ?? "") && inLayer.startsWith(`${layer}/app/pages/`);

        const report = (loc: Rule.Node["loc"], target: string | undefined) => {
            if (!target || target === layer || cores.includes(target) || !loc) return;
            context.report({
                loc,
                messageId: cores.includes(layer ?? "") ? "coreToFeature" : "featureToFeature",
                data: { target, cores: cores.join(", ") },
            });
        };

        const checkSource = (node: Rule.Node, source: unknown) => {
            if (typeof source === "string") {
                report(node.loc, targetLayer(layersRoot, fromDir, source));
            }
        };

        const autoImports = readMaps(nuxtDir, MAPS[scriptKind(inLayer)]);
        const components = readMaps(nuxtDir, MAPS.components);
        const templateImports = readMaps(nuxtDir, MAPS.app);
        const origin = (origins: Origins | undefined, name: string) => {
            const path = origins?.get(name);
            return path && layerAfter(layersRoot, path);
        };

        const declaredAtTop = new Set<string>();
        const templateVisitor = {
            VElement: (node: TemplateElement) => {
                if (featurePage) return;
                report(node.loc, origin(components, toPascal(node.rawName)));
            },
            VExpressionContainer: (node: TemplateContainer) => {
                for (const { id } of node.references) {
                    if (!declaredAtTop.has(id.name)) {
                        report(id.loc, origin(templateImports, id.name));
                    }
                }
            },
        };
        const parserServices = context.sourceCode.parserServices as TemplateVisitor | undefined;

        const scriptVisitor: Rule.RuleListener = {
            "ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration, ImportExpression": (
                node: Rule.Node,
            ) => {
                if ("source" in node && node.source?.type === "Literal") {
                    checkSource(node, node.source.value);
                }
            },
            Program: (node) => {
                if (!autoImports || !components || !templateImports) {
                    context.report({ node, loc: { line: 1, column: 0 }, messageId: "unprepared" });
                    return;
                }
                const { globalScope } = context.sourceCode.scopeManager;
                for (const scope of globalScope?.childScopes ?? []) {
                    for (const { name } of scope.variables) declaredAtTop.add(name);
                }
            },
            "Program:exit": () => {
                const through: Scope.Reference[] =
                    context.sourceCode.scopeManager.globalScope?.through ?? [];
                for (const { identifier } of through) {
                    report(identifier.loc, origin(autoImports, identifier.name));
                }
            },
        };

        // The parser walks the template from this visitor's own `Program:exit`, so it must wrap it.
        return (
            parserServices?.defineTemplateBodyVisitor?.(templateVisitor, scriptVisitor) ??
            scriptVisitor
        );
    },
};

export default layerBoundaries;
