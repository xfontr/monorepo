import type { Asset } from "@monorepo/content";

export interface Author {
    id: string
    slug: string
    name: string
    bio?: string
    avatar?: Asset
}
