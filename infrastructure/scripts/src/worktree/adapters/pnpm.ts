import { capture, type Captured } from "../../shared/adapters/exec.ts";

export const install = (root: string): Captured =>
    capture("pnpm", ["--dir", root, "install", "--frozen-lockfile", "--ignore-scripts"]);
