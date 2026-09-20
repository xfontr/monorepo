export type IssueSource = "live" | "cache" | "auth-error";

export type IssueSourceInput = {
    knownOffline: boolean
    requestFailed: boolean
    online: boolean
};

export const issueSource = ({ knownOffline, requestFailed, online }: IssueSourceInput): IssueSource => {
    if (knownOffline || (requestFailed && !online)) return "cache";
    if (requestFailed) return "auth-error";
    return "live";
};
