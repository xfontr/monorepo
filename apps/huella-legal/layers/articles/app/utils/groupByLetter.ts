/** Splits an already sorted list by the first letter of each name, in the order the list has. */
export const groupByLetter = <T>(items: T[], name: (item: T) => string): [string, T[]][] => {
    const groups = new Map<string, T[]>();

    for (const item of items) {
        const letter = normalizeText(name(item)).charAt(0).toLocaleUpperCase("es");
        const group = groups.get(letter);

        if (group) group.push(item);
        else groups.set(letter, [item]);
    }

    return [...groups.entries()];
};
