/** Structural typing keeps the domain independent of the GitHub adapter. */
export type SearchableIssue = {
    number: number
    title: string
    labels: string[]
};

export type SearchableLabel = {
    name: string
    description: string
};

const needleOf = (search: string): string => search.trim().toLowerCase();

export const matchesIssue = ({ number, title, labels }: SearchableIssue, search: string): boolean => {
    const needle = needleOf(search).replace("#", "");
    if (!needle) return true;

    return String(number).includes(needle)
      || title.toLowerCase().includes(needle)
      || labels.some((label) => label.toLowerCase().includes(needle));
};

export const matchesLabel = ({ name, description }: SearchableLabel, search: string): boolean => {
    const needle = needleOf(search);
    if (!needle) return true;

    return name.toLowerCase().includes(needle) || description.toLowerCase().includes(needle);
};
