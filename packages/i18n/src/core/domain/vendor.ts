export type Vendor<T extends object = object> = {
    project: string | number
    baseURL: string
    options: T
};
