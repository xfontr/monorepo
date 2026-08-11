export type Vendor<T extends object = object> = {
    project: string
    baseURL: string
    options: T
};
