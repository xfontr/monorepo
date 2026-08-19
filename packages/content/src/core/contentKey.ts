import { hash } from "ohash";
import type { EntryQuery, Resource } from "./domain/content";
import type { VendorConfig } from "./registry";

// Every input that picks the upstream document, so changing any of them cannot serve the previous
// one's page.
//
// The vendor config is hashed whole rather than listed field by field. Listing it would put a token
// in a key that Nitro turns into a filesystem path or a KV entry; excluding it would let two
// deployments of the same vendor collide, because vendor config carries identity as readily as
// credentials — a Contentful environment and a Sanity dataset both live there.
//
// The query half is hashed rather than spelled out because Nitro deletes every non-word character
// from a custom cache key (`escapeKey`, in its cache runtime) before storing it. A readable
// `search=b,slug=a` arrives as `searchbsluga`, which `search=bsluga` also arrives as — so the
// separators a spelled-out key relies on are exactly what does not survive. Hashing bounds the key
// length too, which matters for a driver that turns it into a filename.
export function contentKey(vendor: VendorConfig, resource: Resource, query?: EntryQuery): string {
    return [vendor.name, resource, hash(vendor), hash(queryKey(query))].map(toWordChars).join("_");
}

// So the key survives that strip unchanged. ohash returns base64url, whose "-" is not a word
// character, and "_" is the separator — both expansions are unambiguous, so distinct parts stay
// distinct.
function toWordChars(part: string): string {
    return part.replace(/_/g, "_u").replace(/-/g, "_d");
}

// Canonical rather than pretty: the axes are sorted so two callers spelling one query differently
// share an entry, and encoded so a crafted value cannot forge an axis before the hash is taken
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
