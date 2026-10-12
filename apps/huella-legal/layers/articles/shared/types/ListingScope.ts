import type { Author } from "./Author";
import type { Category } from "./Category";

export type ListingScope =
    | { kind: "category" | "tag"; term: Category }
    | { kind: "author"; author: Author; since?: string };
