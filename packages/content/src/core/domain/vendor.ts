export interface Vendor<T extends object = object> {
    baseURL: string;
    options: T;
}
