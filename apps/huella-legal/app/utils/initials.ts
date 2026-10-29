export const initials = (name: string): string =>
    name
        .split(/\s+/)
        .filter((word) => /^\p{Lu}/u.test(word))
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("");
