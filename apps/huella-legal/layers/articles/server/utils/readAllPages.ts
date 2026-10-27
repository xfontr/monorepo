interface Paged<T> {
    items: T[];
    totalPages: number;
}

export const readAllPages = async <T>(fetchPage: (page: number) => Promise<Paged<T>>) => {
    const first = await fetchPage(1);
    const rest = await Promise.all(
        Array.from({ length: first.totalPages - 1 }, (_, index) => fetchPage(index + 2)),
    );

    return [first, ...rest].flatMap(({ items }) => items);
};
