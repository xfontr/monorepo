export interface HttpClient {
    get<T>(url: string, options?: { headers: object }): Promise<T>
}
