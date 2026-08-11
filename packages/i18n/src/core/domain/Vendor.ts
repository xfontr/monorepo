export type Vendor<T extends object = object> = {
    name?: string
    project: string
    baseURL: string
    options: T
};
