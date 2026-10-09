// The archive the approved pages share: B's without series and issue numbers, which ADR 0027 found
// no source for, and without subtopics, which would mean reclassifying every post. Most live
// posts carry a featured image, so most entries here do too; the three without one get the paper tile.

import { archive, type ArchiveEntry } from "./fixtures-b";

const withoutImage = new Set(["impuesto-grandes-fortunas", "despido-absentismo", "examen-acceso"]);

export const archiveD: ArchiveEntry[] = archive.map((entry) => ({
    ...entry,
    series: undefined,
    issue: undefined,
    subtopic: "",
    media: withoutImage.has(entry.slug) ? "none" : "image",
}));

export const countIn = (subject: string) =>
    archiveD.filter((entry) => entry.subject === subject).length;
