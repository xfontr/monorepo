export type Vendor<Name extends string = string, T extends object = object> = {
    name: Name
    project: string
    baseURL: string
    options: T
};
