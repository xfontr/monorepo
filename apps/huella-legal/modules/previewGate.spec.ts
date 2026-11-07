import type { Nuxt } from "@nuxt/schema";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("nuxt/kit", () => ({ defineNuxtModule: (definition: unknown) => definition }));

const { setup } = (await import("./previewGate")).default as unknown as {
    setup: (options: unknown, nuxt: Nuxt) => void;
};

type Gate = (request: Request) => Response | undefined;

let rootDir: string;

const edgeDir = () => join(rootDir, ".netlify/edge-functions");

const build = async (options: Partial<Nuxt["options"]> = {}): Promise<boolean> => {
    let compiled: (() => Promise<void>) | undefined;
    const nitro = {
        options: { rootDir },
        hooks: { hook: (_: string, fn: () => Promise<void>) => (compiled = fn) },
    };
    const hook = (_: string, fn: (value: typeof nitro) => void) => fn(nitro);

    setup({}, { options: { dev: false, ...options }, hook } as unknown as Nuxt);
    await compiled?.();

    return compiled !== undefined;
};

const loadGate = async (): Promise<Gate> => {
    const url = `${pathToFileURL(join(edgeDir(), "preview-gate.js")).href}?${Math.random()}`;

    return (await import(/* @vite-ignore */ url)).default;
};

const request = (username?: string, password?: string) =>
    new Request("https://pr-1--huella-legal.netlify.app/", {
        headers: username ? { authorization: `Basic ${btoa(`${username}:${password}`)}` } : {},
    });

const env = (vars: Record<string, string | undefined>) =>
    vi.stubGlobal("Netlify", { env: { get: (name: string) => vars[name] } });

beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "preview-gate-"));
    vi.stubEnv("NUXT_SITE_ENV", "preview");
    env({ PREVIEW_USERNAME: "editor", PREVIEW_PASSWORD: "s3cret" });
});

afterEach(async () => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    await rm(rootDir, { recursive: true, force: true });
});

describe("previewGate module", () => {
    it("routes every path of a preview deploy through the gate, assets included", async () => {
        await build();

        const manifest = JSON.parse(await readFile(join(edgeDir(), "manifest.json"), "utf8"));

        expect(manifest.functions).toEqual([
            expect.objectContaining({ function: "preview-gate", path: "/*" }),
        ]);
    });

    it("asks a visitor with no credentials for them instead of serving the page", async () => {
        await build();

        const response = (await loadGate())(request());

        expect(response?.status).toBe(401);
        expect(response?.headers.get("WWW-Authenticate")).toMatch(/^Basic realm=/);
    });

    it("lets the right credentials through to the page", async () => {
        await build();

        expect((await loadGate())(request("editor", "s3cret"))).toBeUndefined();
    });

    it("lets a non-ASCII password through rather than throwing in btoa", async () => {
        env({ PREVIEW_USERNAME: "editor", PREVIEW_PASSWORD: "contraseña" });
        await build();

        const header = `Basic ${Buffer.from("editor:contraseña").toString("base64")}`;
        const gated = new Request("https://pr-1--huella-legal.netlify.app/", {
            headers: { authorization: header },
        });

        expect((await loadGate())(gated)).toBeUndefined();
    });

    it("refuses a wrong password", async () => {
        await build();

        expect((await loadGate())(request("editor", "guess"))?.status).toBe(401);
    });

    // Unset vars would otherwise make "undefined:undefined" a working login
    it.each([
        { PREVIEW_USERNAME: undefined, PREVIEW_PASSWORD: "s3cret" },
        { PREVIEW_USERNAME: "editor", PREVIEW_PASSWORD: undefined },
    ])("stays shut when a credential is unset, %o", async (vars) => {
        env(vars);
        await build();

        const gate = await loadGate();

        expect(
            gate(request(String(vars.PREVIEW_USERNAME), String(vars.PREVIEW_PASSWORD)))?.status,
        ).toBe(401);
    });

    it.each(["production", ""])("never ships the gate on a %j build", async (siteEnv) => {
        vi.stubEnv("NUXT_SITE_ENV", siteEnv);

        await build();

        expect(existsSync(join(edgeDir(), "preview-gate.js"))).toBe(false);
    });

    it("clears a previous preview build's gate so production can't deploy it", async () => {
        await mkdir(edgeDir(), { recursive: true });
        await writeFile(join(edgeDir(), "preview-gate.js"), "");
        await writeFile(join(edgeDir(), "manifest.json"), "{}");
        vi.stubEnv("NUXT_SITE_ENV", "production");

        await build();

        expect(existsSync(join(edgeDir(), "preview-gate.js"))).toBe(false);
        expect(existsSync(join(edgeDir(), "manifest.json"))).toBe(false);
    });

    it.each([{ dev: true }, { _prepare: true }])("writes nothing under %o", async (options) => {
        expect(await build(options)).toBe(false);
    });
});
