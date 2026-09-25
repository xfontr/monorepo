import { hash } from "ohash";
import type { EntryQuery, Resource } from "./domain/content";
import type { VendorConfig } from "./registry";

export function contentKey(vendor: VendorConfig, resource: Resource, query?: EntryQuery): string {
    return [vendor.name, resource, hash(vendor), hash(queryKey(query))].map(toWordChars).join("_");
}

function toWordChars(part: string): string {
    return part.replaceAll("_", "_u").replaceAll("-", "_d");
}

function queryKey(query?: EntryQuery): string {
    const entries = Object.entries({
        ...query,
        term: query?.term && `${query.term.resource}=${query.term.id}`,
    }).filter(([, value]) => value !== undefined);

    entries.sort(([a], [b]) => a.localeCompare(b));

    return entries
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join(",");
}
