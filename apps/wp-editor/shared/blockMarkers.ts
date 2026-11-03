const MARKER = /<!--\s*(\/?)wp:([\w/-]+)(?:\s[^>]*?)?(\/?)-->/g;

/** The ordered `<!-- wp:… -->` sequence, attributes dropped, e.g. `paragraph`, `/paragraph`. */
export const blockMarkers = (html: string): string[] =>
    [...html.matchAll(MARKER)].map(([, close, name, self]) => `${close}${name}${self}`);

export const markersDiffer = (base: string, proposed: string): boolean =>
    blockMarkers(base).join("\n") !== blockMarkers(proposed).join("\n");
