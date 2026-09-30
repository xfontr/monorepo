export interface Vendor<T extends object = object> {
    project: string | number
    baseURL: string
    options: T
}
