import { inject, provide, type InjectionKey } from "vue";

// B pages link to their B siblings, and fall back to the approved A page where none exists
const siblings: Record<string, string> = {
    "/lab/home": "/lab/home-b",
    "/lab/article": "/lab/article-b",
    "/lab/category": "/lab/category-b",
    "/lab/categorias": "/lab/categorias-b",
};

const key: InjectionKey<boolean> = Symbol("lab-variant-b");

export const provideVariantB = () => provide(key, true);

export const useLabHref = () => {
    const isB = inject(key, false);

    return (path: string) => (isB && siblings[path]) || path;
};
