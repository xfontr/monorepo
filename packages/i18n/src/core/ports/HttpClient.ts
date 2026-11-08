export interface RequestOptions {
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | undefined>;
}

export interface HttpResponse<T> {
    data: T;
    headers: Headers;
}

export interface HttpClient {
    get<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>;
}
