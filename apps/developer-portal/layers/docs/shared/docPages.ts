/** A folder name is what the workspace calls a project; a reader wants its name, not its slug. */
const NAME_OVERRIDES: Record<string, string> = {
    ui: "UI",
    i18n: "i18n",
};

export const toTitleCase = (name: string): string => {
    if (NAME_OVERRIDES[name]) return NAME_OVERRIDES[name];

    return name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

/** Titles here open with an emoji by house style; in a dense nav it is noise twice over. */
export const stripLeadingEmoji = (title: string): string =>
    title.replace(/^[^\p{L}\p{N}`@]+/u, "").trim();

/** `@nuxt/content` keys a page by a lower-cased, extension-less route; the collector keys it by the real repo path — anything joining the two must cross here first. */
export const toCollectionPath = (repoPath: string): string =>
    `/${repoPath.replace(/\.mdx?$/i, "").toLowerCase()}`;
