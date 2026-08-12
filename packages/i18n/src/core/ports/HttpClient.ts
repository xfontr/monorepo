export interface HttpClient {
    get<T>(url: string, options?: { headers: Record<string, string> }): Promise<T>
}
