import { fileURLToPath } from "node:url";
import type { Messages } from "../types/Messages.ts";
import path from "node:path";
import { PROJECTS_PATH } from "../configs/constants.ts";
import { readFile } from "node:fs/promises";

const PROJECTS_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    PROJECTS_PATH,
);

async function readLocale(project: string, locale: string): Promise<Messages> {
    const raw = await readFile(path.join(PROJECTS_DIR, project, `${locale}.json`), "utf-8");
    return JSON.parse(raw) as Messages;
}

export default readLocale;
