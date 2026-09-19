import { vitest } from "@monorepo/configs";
import viteConfig from "./vite.config.ts";

export default vitest.createVueConfig(viteConfig);
