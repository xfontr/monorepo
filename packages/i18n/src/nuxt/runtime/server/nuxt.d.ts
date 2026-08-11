declare function useFetch<T>(url: string, options?: {
    key?: string
    server?: boolean
}): Promise<{
    data: { value: T | null }
    error: { value: Error | null }
}>;

declare function showError(error: Error) {}

declare function useNuxtApp() {
    return {
        runWithContext: (callback: Function) => {}
    }
}