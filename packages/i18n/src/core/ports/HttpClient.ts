export interface HttpClient {
    get<T>(url: string, opts?: { params?: Record<string, string> }): Promise<T>
}
