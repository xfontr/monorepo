import { inject, provide, type InjectionKey } from "vue";

type Variant = "a" | "b";

// Attempt pages link to their siblings, and fall back to the approved page where none exists
const siblings: Record<Variant, Record<string, string>> = {
    a: {
        "/lab/home": "/lab/attempts/home-a",
        "/lab/article": "/lab/attempts/article-a",
        "/lab/publicaciones": "/lab/category",
        "/lab/categorias": "/lab/attempts/categorias-a",
    },
    b: {
        "/lab/home": "/lab/attempts/home-b",
        "/lab/article": "/lab/attempts/article-b",
        "/lab/publicaciones": "/lab/attempts/category-b",
        "/lab/categorias": "/lab/attempts/categorias-b",
    },
};

const key: InjectionKey<Variant | undefined> = Symbol("lab-variant");

export const provideVariant = (variant: Variant) => provide(key, variant);

export const provideVariantB = () => provideVariant("b");

export const useLabHref = () => {
    const variant = inject(key, undefined);

    return (path: string) => (variant && siblings[variant][path]) || path;
};
