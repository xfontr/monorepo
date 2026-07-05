/// <reference types="vite/client" />

// Ambient shim so plain-TypeScript tooling (e.g. typescript-eslint's
// projectService, which does not load Volar) can type `.vue` imports from
// `.ts` files such as *.stories.ts. `vue-tsc`/Volar overrides this with the
// real single-file-component types during type-checking.
declare module "*.vue" {
    import type { DefineComponent } from "vue";

    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;

    export default component;
}
