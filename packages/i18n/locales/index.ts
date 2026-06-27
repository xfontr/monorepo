import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function join(locale: string) {
    return path.join(__dirname, "../locales", `${locale}.json`);
}

export const en = join("en");
export const es = join("es");
