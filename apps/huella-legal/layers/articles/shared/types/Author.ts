import type { Asset } from "@monorepo/content";

export type Author = {
    id: string
    slug: string
    name: string
    bio?: string
    avatar?: Asset
};
