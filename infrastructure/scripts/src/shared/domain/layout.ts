export const PROJECT_ROOTS = ["packages", "apps", "infrastructure"];

/** Words Title Case would ruin: nobody calls the component library "Ui". */
const ACRONYMS = new Set(["ui", "api", "bff", "cms", "tms"]);

export const titleCase = (word: string): string =>
    ACRONYMS.has(word) ? word.toUpperCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
