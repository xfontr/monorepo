import { statSync, readFileSync } from "node:fs";
import { posix } from "node:path";
import type { Rule, Scope } from "eslint";

export interface LayerBoundariesOptions {
    cores: string[];
    kit: string[];
}
type Options = [LayerBoundariesOptions];
type Origins = Map<string, string>;
type Owner = { layer: string } | "kit" | "shell";
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

const ALIASES: Record<string, string> = { "~/": "app/", "@/": "app/", "~~/": "", "@@/": "" };

const EXTERNAL = ["node_modules/", ".nuxt/"];

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

const scriptKind = (path: string): keyof typeof MAPS => {
    if (path.includes("server/")) return "server";
    if (path.includes("shared/")) return "shared";
    return "app";
};

const appRootOf = (filename: string, kit: string[]): string | undefined => {
    const at = filename.indexOf(LAYERS);
    if (at !== -1) return filename.slice(0, at);
    const inKit = kit.map((path) => filename.indexOf(`/${path}`)).find((index) => index !== -1);
    return inKit === undefined ? undefined : filename.slice(0, inKit);
};

const layerBoundaries: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Keep Nuxt layers apart, auto-imports included: the kit uses only itself, a core uses only itself and the kit, a feature also uses the cores, and only a feature's pages render another feature's components.",
        },
        schema: [
            {
                type: "object",
                properties: {
                    cores: { type: "array", items: { type: "string" } },
                    kit: { type: "array", items: { type: "string" } },
                },
                required: ["cores", "kit"],
                additionalProperties: false,
            },
        ],
        messages: {
            featureToFeature:
                "Move what this needs from the `{{target}}` feature into a core layer ({{cores}}) or the kit ({{kit}}): a feature never uses another feature.",
            coreToFeature:
                "Move what this needs from the `{{target}}` feature into a core layer: a core never uses a feature.",
            coreToCore:
                "Move what this needs from the `{{target}}` layer into this one or into the kit ({{kit}}): a core uses only itself and the kit.",
            layerToShell:
                "Move what this needs from the shell into the kit ({{kit}}): a layer never uses the rest of `app/` or `server/`.",
            kitToOutside:
                "Move what this needs into the kit ({{kit}}), or pass it in from the caller: the kit uses only itself.",
            unprepared:
                "Run `nuxi prepare` in this app: without `.nuxt/` this rule can't tell which layer an auto-import comes from.",
        },
    },
    create: (context) => {
        const [{ cores, kit }] = context.options as Options;
        const filename = context.filename.replaceAll("\\", "/");
        const appRoot = appRootOf(filename, kit);
        if (appRoot === undefined) return {};

        // eslint-disable-next-line sonarjs/function-return-type -- Owner names the kit and shell as strings and a layer as an object
        const ownerOf = (path: string): Owner | undefined => {
            if (!path.startsWith(`${appRoot}/`)) return undefined;
            const relative = path.slice(appRoot.length + 1);
            if (EXTERNAL.some((prefix) => relative.startsWith(prefix))) return undefined;
            if (relative.startsWith("layers/")) return { layer: relative.split("/")[1] ?? "" };
            return kit.some((prefix) => relative.startsWith(prefix)) ? "kit" : "shell";
        };

        const self = ownerOf(filename);
        const layer = typeof self === "object" ? self.layer : undefined;
        const fromCore = cores.includes(layer ?? "");
        const relative = filename.slice(appRoot.length + 1);
        const featurePage =
            !!layer && !fromCore && relative.startsWith(`layers/${layer}/app/pages/`);
        const fromDir = posix.dirname(filename);
        const data = { cores: cores.join(", "), kit: kit.join(", ") };

        const messageFor = (
            target: Owner,
            asComponent: boolean,
        ): { messageId: string; target: string } | undefined => {
            if (target === "kit") return undefined;
            if (self === "kit") {
                return {
                    messageId: "kitToOutside",
                    target: target === "shell" ? "shell" : target.layer,
                };
            }
            if (target === "shell") return { messageId: "layerToShell", target: "shell" };
            if (target.layer === layer) return undefined;
            if (cores.includes(target.layer)) {
                return fromCore ? { messageId: "coreToCore", target: target.layer } : undefined;
            }
            if (fromCore) return { messageId: "coreToFeature", target: target.layer };
            if (featurePage && asComponent) return undefined;
            return { messageId: "featureToFeature", target: target.layer };
        };

        const report = (loc: Rule.Node["loc"], path: string | undefined, asComponent = false) => {
            const target = path === undefined ? undefined : ownerOf(path);
            const problem = target && messageFor(target, asComponent);
            if (!problem || !loc) return;
            context.report({
                loc,
                messageId: problem.messageId,
                data: { ...data, target: problem.target },
            });
        };

        const resolveSource = (source: string): string | undefined => {
            if (source.startsWith("#layers/"))
                return posix.join(appRoot, "layers", source.slice(8));
            if (source.startsWith(".")) return posix.join(fromDir, source);
            const alias = Object.keys(ALIASES).find((prefix) => source.startsWith(prefix));
            return alias === undefined
                ? undefined
                : posix.join(appRoot, ALIASES[alias] ?? "", source.slice(alias.length));
        };

        const autoImports = readMaps(posix.join(appRoot, ".nuxt"), MAPS[scriptKind(relative)]);
        const components = readMaps(posix.join(appRoot, ".nuxt"), MAPS.components);
        const templateImports = readMaps(posix.join(appRoot, ".nuxt"), MAPS.app);

        const declaredAtTop = new Set<string>();
        const templateVisitor = {
            VElement: (node: TemplateElement) => {
                report(node.loc, components?.get(toPascal(node.rawName)), true);
            },
            VExpressionContainer: (node: TemplateContainer) => {
                for (const { id } of node.references) {
                    if (!declaredAtTop.has(id.name)) {
                        report(id.loc, templateImports?.get(id.name));
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
                    const { value } = node.source;
                    if (typeof value === "string") report(node.loc, resolveSource(value));
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
                    report(identifier.loc, autoImports?.get(identifier.name));
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
