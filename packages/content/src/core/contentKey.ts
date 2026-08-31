import { hash } from "ohash";
import type { EntryQuery, Resource } from "./domain/content";
import type { VendorConfig } from "./registry";

export function contentKey(vendor: VendorConfig, resource: Resource, query?: EntryQuery): string {
    return [vendor.name, resource, hash(vendor), hash(queryKey(query))].map(toWordChars).join("_");
}

function toWordChars(part: string): string {
    return part.replace(/_/g, "_u").replace(/-/g, "_d");
}

function queryKey(query?: EntryQuery): string {
    const entries = Object.entries({
        ...query,
        term: query?.term && `${query.term.resource}=${query.term.id}`,
    }).filter(([, value]) => value !== undefined);

    return entries
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join(",");
}
