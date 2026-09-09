/**
 * The fields a person searches an issue by. Declared here rather than imported from
 * [`gh.ts`](../adapters/gh.ts) so this file points at nothing outside `domain/`: `Issue` satisfies
 * it structurally, which is all either call site needs.
 */
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

/**
 * The `#` is optional on purpose. The picker prints `#63` and a person types `63` — requiring the
 * prefix would make the number, the one thing everybody remembers about an issue, the clumsiest way
 * to find it. Labels are searched too, so "spike" narrows to the spikes without a second prompt.
 */
export const matchesIssue = ({ number, title, labels }: SearchableIssue, search: string): boolean => {
    const needle = needleOf(search).replace("#", "");
    if (!needle) return true;

    return String(number).includes(needle)
      || title.toLowerCase().includes(needle)
      || labels.some((label) => label.toLowerCase().includes(needle));
};

/**
 * Descriptions count as much as names: `good first issue` and `wontfix` are known by what they mean
 * long before anyone recalls how they're spelled.
 */
export const matchesLabel = ({ name, description }: SearchableLabel, search: string): boolean => {
    const needle = needleOf(search);
    if (!needle) return true;

    return name.toLowerCase().includes(needle) || description.toLowerCase().includes(needle);
};
