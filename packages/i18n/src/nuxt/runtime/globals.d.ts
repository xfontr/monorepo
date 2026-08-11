declare function defineI18nLocale<Messages>(
    loader: (locale: string) => Promise<Messages>,
): (locale: string) => Promise<Messages>;

declare function useFetch<T>(url: string, options?: {
    key?: string
    server?: boolean
}): Promise<{
    data: { value: T | null }
    error: { value: Error | null }
}>;
