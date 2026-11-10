const KIND_ICONS: Record<string, string> = {
    readme: "i-lucide-file-text",
    agent: "i-lucide-bot",
    changelog: "i-lucide-tag",
    skill: "i-lucide-wand-sparkles",
    doc: "i-lucide-book-open",
    decision: "i-lucide-compass",
    audit: "i-lucide-scan-search",
};

export const kindIcon = (kind: string): string => KIND_ICONS[kind] ?? "i-lucide-file-text";
